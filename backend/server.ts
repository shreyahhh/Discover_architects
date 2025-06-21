import express from 'express';
import cors from 'cors';
import { dbService } from './dbService';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import crypto from 'crypto';
import axios from 'axios';
import https from 'https';

// IMPORTANT: The following line disables SSL/TLS certificate validation for all HTTPS requests.
// This is INSECURE and should ONLY be used for local development to bypass certificate errors.
// REMOVE THIS LINE IN A PRODUCTION ENVIRONMENT.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/gallery_uploads', express.static(path.join(__dirname, 'gallery_uploads')));

const upload = multer({ dest: "gallery_uploads/" });

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Sign up endpoint
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    console.log('Signup attempt:', { email, username });
    
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username are required' });
    }

    const existingUser = dbService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const user = await dbService.createUser(email, password, username);
    console.log('User created:', user);
    res.status(201).json({ user });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sign in endpoint
app.post('/api/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Signin attempt:', { email });
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = dbService.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await dbService.verifyPassword(email, password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = dbService.createSession(Number(user.id));
    console.log('User signed in:', { id: user.id, email: user.email, role: user.role });
    res.json({ user, token });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/gallery
app.get('/api/gallery', (req: Request, res: Response) => {
  const images = dbService.getGalleryImages() as Array<{ id: number; src: string; title: string; created_at: string }>;
  // Return URLs relative to server
  const mapped = images.map(img => ({ ...img, src: `/gallery_uploads/${path.basename(img.src)}` }));
  res.json(mapped);
});

// POST /api/gallery
app.post('/api/gallery', upload.single('image'), (req: Request, res: Response) => {
  if (!req.file || !req.body.title) {
    return res.status(400).json({ error: 'Image file and title are required' });
  }
  const img = dbService.addGalleryImage(req.file.path, req.body.title) as { id: number; src: string; title: string; created_at: string };
  res.status(201).json({ ...img, src: `/gallery_uploads/${path.basename(img.src)}` });
});

// DELETE /api/gallery/:id
app.delete('/api/gallery/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const images = dbService.getGalleryImages() as Array<{ id: number; src: string; title: string; created_at: string }>;
  const img = images.find(i => i.id === id);
  if (!img) return res.status(404).json({ error: 'Image not found' });
  // Delete file from disk
  try { fs.unlinkSync(img.src); } catch {}
  dbService.deleteGalleryImage(id);
  res.json({ success: true });
});

// --- Admin & Subscription Endpoints ---
// Get all users with profiles
app.get('/api/admin/users', (req, res) => {
  try {
    const users = dbService.getAllUsersWithProfiles();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});
// Get all plans
app.get('/api/admin/plans', (req, res) => {
  try {
    const plans = dbService.getAllPlans();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});
// Get all subscriptions for a user
app.get('/api/admin/user/:id/subscriptions', (req, res) => {
  try {
    const userId = Number(req.params.id);
    const subs = dbService.getUserSubscriptions(userId);
    res.json(subs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});
// Create a new subscription for a user
app.post('/api/admin/subscription', (req, res) => {
  try {
    const { userId, planId } = req.body;
    if (!userId || !planId) return res.status(400).json({ error: 'userId and planId required' });
    const subId = dbService.createSubscription(userId, planId);
    res.status(201).json({ subscriptionId: subId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});
// Pause a subscription
app.post('/api/admin/subscription/:id/pause', (req, res) => {
  try {
    const subId = Number(req.params.id);
    dbService.pauseSubscription(subId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to pause subscription' });
  }
});
// Resume a subscription
app.post('/api/admin/subscription/:id/resume', (req, res) => {
  try {
    const subId = Number(req.params.id);
    dbService.resumeSubscription(subId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to resume subscription' });
  }
});

// TEMP: Add a Standard plan subscription for Shreya (user_id=2)
app.post('/api/dev/add-shreya-sub', (req, res) => {
  try {
    // Clean up any existing subscription for user_id=2 and plan_id=1
    const existing = dbService.getUserSubscription(2, 1);
    if (existing && existing.id) {
      dbService.deleteSubscriptionPeriod(existing.id);
      dbService.deleteSubscription(existing.id);
    }
    // Insert subscription for user_id=2, plan_id=1 (Standard)
    const subId = dbService.createSubscription(2, 1);
    dbService.updateSubscriptionStartDate(Number(subId), '2025-01-01');
    res.json({ success: true, subscriptionId: subId });
  } catch (e) {
    console.error('Failed to insert subscription:', e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: 'Failed to insert subscription', details: errorMessage });
  }
});

// PhonePe Integration
const PHONEPE_MERCHANT_ID = 'PGTESTPAYUAT'; // Replace with your Merchant ID
const PHONEPE_SALT_KEY = '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399'; // Replace with your Salt Key
const PHONEPE_SALT_INDEX = 1;
const PHONEPE_PAY_API_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay';
const APP_URL = 'http://localhost:3000'; // Replace with your frontend URL

app.post('/api/pay', async (req, res) => {
  const { amount, plan, userId } = req.body;
  const merchantTransactionId = `M${Date.now()}`;

  const data = {
    merchantId: PHONEPE_MERCHANT_ID,
    merchantTransactionId: merchantTransactionId,
    merchantUserId: `MUID${userId}`,
    amount: amount * 100, // Amount in paise
    redirectUrl: `${APP_URL}/payment-status/${merchantTransactionId}`,
    redirectMode: 'POST',
    callbackUrl: 'http://localhost:5000/api/payment/callback', // Replace with your deployed backend URL
    mobileNumber: '9999999999', // Optional: Can be taken from user profile
    paymentInstrument: {
      type: 'PAY_PAGE',
    },
  };

  const payload = JSON.stringify(data);
  const payloadMain = Buffer.from(payload).toString('base64');
  const keyIndex = PHONEPE_SALT_INDEX;
  const string = payloadMain + '/pg/v1/pay' + PHONEPE_SALT_KEY;
  const sha256 = crypto.createHash('sha256').update(string).digest('hex');
  const checksum = sha256 + '###' + keyIndex;

  // The HttpsAgent is no longer strictly necessary with the global override,
  // but we'll leave it in case the global override is removed in the future.
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

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
  
  // TODO: Verify the checksum from PhonePe to ensure the request is genuine
  // This requires comparing the 'X-VERIFY' header from the callback
  // with a checksum generated on your server.
  
  console.log('Received PhonePe callback:', payload);

  if (payload.code === 'PAYMENT_SUCCESS') {
    // TODO: Update subscription status in your database
    // Use payload.merchantTransactionId to identify the order
    console.log('Payment was successful for transaction:', payload.merchantTransactionId);
  } else {
    console.log('Payment failed or is pending for transaction:', payload.merchantTransactionId);
  }

  res.status(200).send('Callback received');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database initialized in ${__dirname}/data/users.db`);
}); 