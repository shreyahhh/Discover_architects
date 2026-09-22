import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { dbService } from './dbService';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import axios from 'axios';
import https from 'https';
import archiver from 'archiver';

const app = express();
app.use(cors());
app.use(express.json());

// Uploads are held in memory only long enough to stream them into Supabase
// Storage — nothing is written to local disk.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

interface AuthedRequest extends Request {
  authUser?: Awaited<ReturnType<typeof dbService.validateSession>>;
}

const getBearerToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length);
};

const requireAuth = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const user = await dbService.validateSession(token);
    if (!user) return res.status(401).json({ error: 'Invalid or expired session' });
    req.authUser = user;
    next();
  } catch (error) {
    console.error('Auth check failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const requireAdmin = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  await requireAuth(req, res, () => {
    if (req.authUser?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
};

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

app.post('/api/signup', async (req, res) => {
  try {
    const { email, password, username, fullName, city, state } = req.body;
    console.log('Signup attempt:', { email, username });

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username are required' });
    }

    const existingUser = await dbService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const user = await dbService.createUser(email, password, username, { fullName, city, state });
    const token = await dbService.createSession(Number(user.id));
    console.log('User created:', user);
    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Signin attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await dbService.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await dbService.verifyPassword(email, password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = await dbService.createSession(Number(user.id));
    console.log('User signed in:', { id: user.id, email: user.email, role: user.role });
    res.json({ user, token });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/signout', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const token = getBearerToken(req)!;
    await dbService.deleteSession(token);
    res.json({ success: true });
  } catch (error) {
    console.error('Signout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

app.get('/api/gallery', async (req: Request, res: Response) => {
  try {
    const images = await dbService.getGalleryImages();
    res.json(images);
  } catch (error) {
    console.error('Failed to fetch gallery:', error);
    res.status(500).json({ error: 'Failed to fetch gallery images' });
  }
});

app.post('/api/gallery', requireAdmin, upload.single('image'), async (req: Request, res: Response) => {
  if (!req.file || !req.body.title) {
    return res.status(400).json({ error: 'Image file and title are required' });
  }
  try {
    const img = await dbService.addGalleryImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      req.body.title
    );
    res.status(201).json(img);
  } catch (error) {
    console.error('Failed to add gallery image:', error);
    res.status(500).json({ error: 'Failed to add image' });
  }
});

app.delete('/api/gallery/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    await dbService.deleteGalleryImage(Number(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete gallery image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// ---------------------------------------------------------------------------
// Job postings (public read; admin write)
// ---------------------------------------------------------------------------

app.get('/api/jobs', async (req: Request, res: Response) => {
  try {
    const jobs = await dbService.getOpenJobPostings();
    res.json(jobs);
  } catch (error) {
    console.error('Failed to fetch job postings:', error);
    res.status(500).json({ error: 'Failed to fetch job postings' });
  }
});

app.get('/api/jobs/:id', async (req: Request, res: Response) => {
  try {
    const job = await dbService.getJobPostingById(Number(req.params.id));
    if (!job) return res.status(404).json({ error: 'Job posting not found' });
    res.json(job);
  } catch (error) {
    console.error('Failed to fetch job posting:', error);
    res.status(500).json({ error: 'Failed to fetch job posting' });
  }
});

// Apply to a job posting (public — anyone can submit an application).
app.post('/api/jobs/:id/apply', upload.single('resume'), async (req: Request, res: Response) => {
  try {
    const jobId = Number(req.params.id);
    const { full_name, email, phone, cover_letter, current_ctc, expected_ctc } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({ error: 'full_name and email are required' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'A resume file is required' });
    }

    const job = await dbService.getJobPostingById(jobId);
    if (!job || job.status !== 'open') {
      return res.status(404).json({ error: 'Job posting not found or no longer open' });
    }

    const application = await dbService.createJobApplication(
      jobId,
      { full_name, email, phone, cover_letter, current_ctc, expected_ctc },
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    res.status(201).json(application);
  } catch (error) {
    console.error('Failed to submit application:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// General / speculative application (public) — lets someone upload a
// resume even when no job posting is currently open.
app.post('/api/jobs/apply', upload.single('resume'), async (req: Request, res: Response) => {
  try {
    const { full_name, email, phone, cover_letter, current_ctc, expected_ctc } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({ error: 'full_name and email are required' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'A resume file is required' });
    }

    const application = await dbService.createJobApplication(
      null,
      { full_name, email, phone, cover_letter, current_ctc, expected_ctc },
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    res.status(201).json(application);
  } catch (error) {
    console.error('Failed to submit general application:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// --- Admin: job posting management ---

app.get('/api/admin/jobs', requireAdmin, async (req: Request, res: Response) => {
  try {
    const jobs = await dbService.getAllJobPostings();
    res.json(jobs);
  } catch (error) {
    console.error('Failed to fetch job postings:', error);
    res.status(500).json({ error: 'Failed to fetch job postings' });
  }
});

app.post('/api/admin/jobs', requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const { title, description, location, employment_type } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'title and description are required' });
    }
    const job = await dbService.createJobPosting(
      { title, description, location, employment_type },
      Number(req.authUser!.id)
    );
    res.status(201).json(job);
  } catch (error) {
    console.error('Failed to create job posting:', error);
    res.status(500).json({ error: 'Failed to create job posting' });
  }
});

app.put('/api/admin/jobs/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, description, location, employment_type, status } = req.body;
    const job = await dbService.updateJobPosting(Number(req.params.id), {
      title,
      description,
      location,
      employment_type,
      status,
    });
    res.json(job);
  } catch (error) {
    console.error('Failed to update job posting:', error);
    res.status(500).json({ error: 'Failed to update job posting' });
  }
});

app.delete('/api/admin/jobs/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    await dbService.deleteJobPosting(Number(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete job posting:', error);
    res.status(500).json({ error: 'Failed to delete job posting' });
  }
});

app.get('/api/admin/jobs/:id/applications', requireAdmin, async (req: Request, res: Response) => {
  try {
    const applications = await dbService.getApplicationsForJob(Number(req.params.id));
    res.json(applications);
  } catch (error) {
    console.error('Failed to fetch applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// General / speculative applications (no job posting attached).
app.get('/api/admin/applications/general', requireAdmin, async (req: Request, res: Response) => {
  try {
    const applications = await dbService.getGeneralApplications();
    res.json(applications);
  } catch (error) {
    console.error('Failed to fetch general applications:', error);
    res.status(500).json({ error: 'Failed to fetch general applications' });
  }
});

// Streams a .zip of every resume for a job posting (?jobId=<id>) or for the
// general application pool (?jobId=general or omitted).
app.get('/api/admin/applications/zip', requireAdmin, async (req: Request, res: Response) => {
  try {
    const jobIdParam = req.query.jobId as string | undefined;
    const jobPostingId = !jobIdParam || jobIdParam === 'general' ? null : Number(jobIdParam);

    const applications = await dbService.getApplicationsForZip(jobPostingId);
    if (applications.length === 0) {
      return res.status(404).json({ error: 'No applications found for this selection' });
    }

    const zipName = jobPostingId === null ? 'general-applications' : `job-${jobPostingId}-applications`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => {
      console.error('Zip stream error:', err);
      res.end();
    });
    archive.pipe(res);

    for (const application of applications) {
      try {
        const buffer = await dbService.downloadResume(application.resume_path);
        const ext = application.resume_original_name?.includes('.')
          ? application.resume_original_name.split('.').pop()
          : application.resume_path.split('.').pop();
        const safeName = (application.full_name || 'candidate').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'candidate';
        // application.id is unique, so this name can't collide within the zip.
        archive.append(buffer, { name: `${safeName}_${application.id}.${ext}` });
      } catch (fileError) {
        console.error(`Skipping resume for application ${application.id}:`, fileError);
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error('Failed to build resumes zip:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to build zip file' });
    } else {
      res.end();
    }
  }
});

app.patch('/api/admin/applications/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['new', 'reviewed', 'rejected', 'hired'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const application = await dbService.updateApplicationStatus(Number(req.params.id), status);
    res.json(application);
  } catch (error) {
    console.error('Failed to update application status:', error);
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

// ---------------------------------------------------------------------------
// Self-service: any signed-in user's own plans/subscriptions. These are
// deliberately separate from the /api/admin/* routes below — a regular user
// must never be able to reach another user's subscription data, so every
// route here is scoped to req.authUser and, for pause/resume, verifies
// ownership of the subscription before touching it.
// ---------------------------------------------------------------------------

// Public: the list of plans someone can subscribe to (name + duration only,
// nothing sensitive) — needed before a visitor even has an account.
app.get('/api/plans', async (req: Request, res: Response) => {
  try {
    const plans = await dbService.getAllPlans();
    res.json(plans);
  } catch (error) {
    console.error('Failed to fetch plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

app.get('/api/me/subscriptions', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const subs = await dbService.getUserSubscriptions(Number(req.authUser!.id));
    res.json(subs);
  } catch (error) {
    console.error('Failed to fetch own subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

app.post('/api/me/subscriptions/:id/pause', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const subId = Number(req.params.id);
    const ownerId = await dbService.getSubscriptionOwner(subId);
    if (ownerId === null) return res.status(404).json({ error: 'Subscription not found' });
    if (ownerId !== Number(req.authUser!.id)) return res.status(403).json({ error: 'Not your subscription' });

    await dbService.pauseSubscription(subId);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to pause subscription:', error);
    res.status(500).json({ error: 'Failed to pause subscription' });
  }
});

app.post('/api/me/subscriptions/:id/resume', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const subId = Number(req.params.id);
    const ownerId = await dbService.getSubscriptionOwner(subId);
    if (ownerId === null) return res.status(404).json({ error: 'Subscription not found' });
    if (ownerId !== Number(req.authUser!.id)) return res.status(403).json({ error: 'Not your subscription' });

    await dbService.resumeSubscription(subId);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to resume subscription:', error);
    res.status(500).json({ error: 'Failed to resume subscription' });
  }
});

// ---------------------------------------------------------------------------
// Admin: users, plans, subscriptions (any user, by id — admin only)
// ---------------------------------------------------------------------------

app.get('/api/admin/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const users = await dbService.getAllUsersWithProfiles();
    res.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/admin/plans', requireAdmin, async (req: Request, res: Response) => {
  try {
    const plans = await dbService.getAllPlans();
    res.json(plans);
  } catch (error) {
    console.error('Failed to fetch plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

app.get('/api/admin/user/:id/subscriptions', requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const subs = await dbService.getUserSubscriptions(userId);
    res.json(subs);
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

app.post('/api/admin/subscription', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId, planId } = req.body;
    if (!userId || !planId) return res.status(400).json({ error: 'userId and planId required' });
    const subId = await dbService.createSubscription(userId, planId);
    res.status(201).json({ subscriptionId: subId });
  } catch (error) {
    console.error('Failed to create subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

app.post('/api/admin/subscription/:id/pause', requireAdmin, async (req: Request, res: Response) => {
  try {
    await dbService.pauseSubscription(Number(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to pause subscription:', error);
    res.status(500).json({ error: 'Failed to pause subscription' });
  }
});

app.post('/api/admin/subscription/:id/resume', requireAdmin, async (req: Request, res: Response) => {
  try {
    await dbService.resumeSubscription(Number(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to resume subscription:', error);
    res.status(500).json({ error: 'Failed to resume subscription' });
  }
});

// ---------------------------------------------------------------------------
// PhonePe payment integration
// ---------------------------------------------------------------------------

const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT';
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || '';
const PHONEPE_SALT_INDEX = Number(process.env.PHONEPE_SALT_INDEX || '1');
const PHONEPE_PAY_API_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const PORT = process.env.PORT || 5000;

// Only bypass TLS verification when explicitly opted into for local dev —
// never enable this in production.
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.DEV_DISABLE_TLS_VERIFY !== 'true',
});

app.post('/api/pay', requireAuth, async (req: AuthedRequest, res: Response) => {
  if (!PHONEPE_SALT_KEY) {
    return res.status(500).json({ error: 'Payment gateway is not configured (missing PHONEPE_SALT_KEY)' });
  }

  const { amount, plan } = req.body;
  const userId = req.authUser!.id;
  const merchantTransactionId = `M${Date.now()}`;

  const data = {
    merchantId: PHONEPE_MERCHANT_ID,
    merchantTransactionId,
    merchantUserId: `MUID${userId}`,
    amount: amount * 100, // paise
    redirectUrl: `${APP_URL}/payment-status/${merchantTransactionId}`,
    redirectMode: 'POST',
    callbackUrl: `${APP_URL.replace(/\/$/, '')}/api/payment/callback`,
    paymentInstrument: { type: 'PAY_PAGE' },
  };

  const payload = JSON.stringify(data);
  const payloadMain = Buffer.from(payload).toString('base64');
  const string = payloadMain + '/pg/v1/pay' + PHONEPE_SALT_KEY;
  const sha256 = crypto.createHash('sha256').update(string).digest('hex');
  const checksum = sha256 + '###' + PHONEPE_SALT_INDEX;

  try {
    const response = await axios.post(
      PHONEPE_PAY_API_URL,
      { request: payloadMain },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          accept: 'application/json',
        },
        httpsAgent,
      }
    );
    res.json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('PhonePe API Error Response:', error.response?.data);
      console.error('PhonePe API Error Status:', error.response?.status);
    } else {
      console.error('Generic Error:', error);
    }
    res.status(500).json({ success: false, message: 'Error initiating payment' });
  }
});

app.post('/api/payment/callback', (req, res) => {
  const payload = req.body;

  // TODO: Verify the checksum from PhonePe (X-VERIFY header) against one
  // computed here before trusting this payload.
  console.log('Received PhonePe callback:', payload);

  if (payload.code === 'PAYMENT_SUCCESS') {
    // TODO: Update subscription status using payload.merchantTransactionId.
    console.log('Payment was successful for transaction:', payload.merchantTransactionId);
  } else {
    console.log('Payment failed or is pending for transaction:', payload.merchantTransactionId);
  }

  res.status(200).send('Callback received');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
