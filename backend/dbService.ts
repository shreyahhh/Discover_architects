import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { supabase, GALLERY_BUCKET, RESUMES_BUCKET } from './supabaseClient';

// ---------------------------------------------------------------------------
// Row shapes (snake_case, as stored in Postgres)
// ---------------------------------------------------------------------------

interface DbUser {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
}

interface DbProfile {
  id: number;
  username: string;
  role: 'user' | 'admin';
  full_name: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  fullName: string | null;
  city: string | null;
  state: string | null;
  createdAt: string;
}

function assertNoError<T>(data: T, error: { message: string } | null, context: string): T {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
  return data;
}

function toPublicUser(row: DbUser & { profiles: DbProfile | DbProfile[] }): PublicUser | null {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  if (!profile) return null;
  return {
    id: String(row.id),
    email: row.email,
    username: profile.username,
    role: profile.role,
    fullName: profile.full_name ?? null,
    city: profile.city ?? null,
    state: profile.state ?? null,
    createdAt: row.created_at,
  };
}

export const dbService = {
  // -------------------------------------------------------------------------
  // Users / auth
  // -------------------------------------------------------------------------

  createUser: async (
    email: string,
    password: string,
    username: string,
    profile: { fullName?: string; city?: string; state?: string } = {}
  ): Promise<PublicUser> => {
    const passwordHash = await bcrypt.hash(password, 10);

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .insert({ email, password_hash: passwordHash })
      .select()
      .single();
    assertNoError(userRow, userError, 'Failed to create user');

    const { error: profileError } = await supabase.from('profiles').insert({
      id: userRow.id,
      username,
      role: 'user',
      full_name: profile.fullName || null,
      city: profile.city || null,
      state: profile.state || null,
    });
    if (profileError) {
      // Roll back the orphaned user row if the profile insert fails
      // (e.g. duplicate username).
      await supabase.from('users').delete().eq('id', userRow.id);
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    const user = await dbService.getUserById(userRow.id);
    if (!user) throw new Error('Failed to create user');
    return user;
  },

  getUserByEmail: async (email: string): Promise<PublicUser | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*, profiles(*)')
      .eq('email', email)
      .maybeSingle();
    if (error) throw new Error(`Failed to look up user: ${error.message}`);
    if (!data) return null;
    return toPublicUser(data as any);
  },

  getUserById: async (id: number): Promise<PublicUser | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*, profiles(*)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`Failed to look up user: ${error.message}`);
    if (!data) return null;
    return toPublicUser(data as any);
  },

  verifyPassword: async (email: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('email', email)
      .maybeSingle();
    if (error) throw new Error(`Failed to verify password: ${error.message}`);
    if (!data) return false;
    return bcrypt.compare(password, data.password_hash);
  },

  // -------------------------------------------------------------------------
  // Profile
  // -------------------------------------------------------------------------

  setUserRole: async (id: number, role: 'user' | 'admin'): Promise<void> => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) throw new Error(`Failed to set user role: ${error.message}`);
  },

  updateProfile: async (id: number, data: Partial<DbProfile>): Promise<void> => {
    const updates = Object.fromEntries(
      Object.entries(data).filter(([key]) => key !== 'id' && key !== 'created_at')
    );
    if (Object.keys(updates).length === 0) return;

    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (error) throw new Error(`Failed to update profile: ${error.message}`);
  },

  // -------------------------------------------------------------------------
  // Sessions
  // -------------------------------------------------------------------------

  createSession: async (userId: number): Promise<string> => {
    const token = crypto.randomBytes(32).toString('hex');
    const { error } = await supabase.from('sessions').insert({ user_id: userId, token });
    if (error) throw new Error(`Failed to create session: ${error.message}`);
    return token;
  },

  validateSession: async (token: string): Promise<PublicUser | null> => {
    const { data, error } = await supabase
      .from('sessions')
      .select('user_id, expires_at')
      .eq('token', token)
      .maybeSingle();
    if (error) throw new Error(`Failed to validate session: ${error.message}`);
    if (!data) return null;
    if (new Date(data.expires_at).getTime() <= Date.now()) return null;
    return dbService.getUserById(data.user_id);
  },

  deleteSession: async (token: string): Promise<void> => {
    const { error } = await supabase.from('sessions').delete().eq('token', token);
    if (error) throw new Error(`Failed to delete session: ${error.message}`);
  },

  // -------------------------------------------------------------------------
  // Gallery (images live in the "gallery" Supabase Storage bucket; the table
  // only stores the storage path + title, and we return short-lived signed
  // URLs so the frontend can render them without the bucket being public).
  // -------------------------------------------------------------------------

  getGalleryImages: async () => {
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch gallery images: ${error.message}`);

    const withUrls = await Promise.all(
      (data || []).map(async (img) => {
        const { data: signed } = await supabase.storage
          .from(GALLERY_BUCKET)
          .createSignedUrl(img.storage_path, 60 * 60); // 1 hour
        return { id: img.id, title: img.title, created_at: img.created_at, src: signed?.signedUrl || null };
      })
    );
    return withUrls;
  },

  addGalleryImage: async (fileBuffer: Buffer, originalName: string, contentType: string, title: string) => {
    const ext = originalName.includes('.') ? originalName.split('.').pop() : 'bin';
    const storagePath = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(GALLERY_BUCKET)
      .upload(storagePath, fileBuffer, { contentType });
    if (uploadError) throw new Error(`Failed to upload image: ${uploadError.message}`);

    const { data, error } = await supabase
      .from('gallery')
      .insert({ storage_path: storagePath, title })
      .select()
      .single();
    if (error) throw new Error(`Failed to save gallery entry: ${error.message}`);

    const { data: signed } = await supabase.storage
      .from(GALLERY_BUCKET)
      .createSignedUrl(storagePath, 60 * 60);
    return { id: data.id, title: data.title, created_at: data.created_at, src: signed?.signedUrl || null };
  },

  deleteGalleryImage: async (id: number): Promise<void> => {
    const { data: img, error: fetchError } = await supabase
      .from('gallery')
      .select('storage_path')
      .eq('id', id)
      .maybeSingle();
    if (fetchError) throw new Error(`Failed to look up gallery image: ${fetchError.message}`);
    if (!img) throw new Error('Image not found');

    await supabase.storage.from(GALLERY_BUCKET).remove([img.storage_path]);
    const { error } = await supabase.from('gallery').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete gallery image: ${error.message}`);
  },

  // -------------------------------------------------------------------------
  // Admin: users / plans / subscriptions
  // -------------------------------------------------------------------------

  getAllUsersWithProfiles: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, created_at, profiles(username, role, full_name, city, state, created_at, updated_at)')
      .order('id', { ascending: true });
    if (error) throw new Error(`Failed to fetch users: ${error.message}`);

    return (data || []).map((row: any) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return {
        id: row.id,
        email: row.email,
        username: profile?.username,
        role: profile?.role,
        full_name: profile?.full_name ?? null,
        city: profile?.city ?? null,
        state: profile?.state ?? null,
        user_created_at: row.created_at,
        profile_created_at: profile?.created_at,
        updated_at: profile?.updated_at,
      };
    });
  },

  getAllPlans: async () => {
    const { data, error } = await supabase.from('plans').select('*').order('id', { ascending: true });
    if (error) throw new Error(`Failed to fetch plans: ${error.message}`);
    return data;
  },

  getUserSubscriptions: async (userId: number) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(
        'id, start_date, plans(name, duration_months), subscription_periods(id, start_date, end_date, status)'
      )
      .eq('user_id', userId)
      .order('start_date', { ascending: true });
    if (error) throw new Error(`Failed to fetch subscriptions: ${error.message}`);

    const rows: any[] = [];
    for (const sub of data || []) {
      const plan = Array.isArray((sub as any).plans) ? (sub as any).plans[0] : (sub as any).plans;
      const periods = ((sub as any).subscription_periods || []) as any[];
      if (periods.length === 0) {
        rows.push({
          subscription_id: sub.id,
          start_date: sub.start_date,
          plan_name: plan?.name,
          duration_months: plan?.duration_months,
          period_id: null,
          period_start: null,
          period_end: null,
          status: null,
        });
      } else {
        for (const p of periods.sort((a, b) => a.start_date.localeCompare(b.start_date))) {
          rows.push({
            subscription_id: sub.id,
            start_date: sub.start_date,
            plan_name: plan?.name,
            duration_months: plan?.duration_months,
            period_id: p.id,
            period_start: p.start_date,
            period_end: p.end_date,
            status: p.status,
          });
        }
      }
    }
    return rows;
  },

  createSubscription: async (userId: number, planId: number): Promise<number> => {
    const { data: sub, error } = await supabase
      .from('subscriptions')
      .insert({ user_id: userId, plan_id: planId })
      .select()
      .single();
    if (error) throw new Error(`Failed to create subscription: ${error.message}`);

    const { error: periodError } = await supabase
      .from('subscription_periods')
      .insert({ subscription_id: sub.id, start_date: new Date().toISOString(), status: 'active' });
    if (periodError) throw new Error(`Failed to create subscription period: ${periodError.message}`);

    return sub.id;
  },

  pauseSubscription: async (subscriptionId: number): Promise<void> => {
    const { data: period, error } = await supabase
      .from('subscription_periods')
      .select('id')
      .eq('subscription_id', subscriptionId)
      .eq('status', 'active')
      .is('end_date', null)
      .maybeSingle();
    if (error) throw new Error(`Failed to look up active period: ${error.message}`);
    if (!period) return;

    const now = new Date().toISOString();
    await supabase.from('subscription_periods').update({ end_date: now }).eq('id', period.id);
    await supabase
      .from('subscription_periods')
      .insert({ subscription_id: subscriptionId, start_date: now, status: 'paused' });
  },

  resumeSubscription: async (subscriptionId: number): Promise<void> => {
    const { data: period, error } = await supabase
      .from('subscription_periods')
      .select('id')
      .eq('subscription_id', subscriptionId)
      .eq('status', 'paused')
      .is('end_date', null)
      .maybeSingle();
    if (error) throw new Error(`Failed to look up paused period: ${error.message}`);
    if (!period) return;

    const now = new Date().toISOString();
    await supabase.from('subscription_periods').update({ end_date: now }).eq('id', period.id);
    await supabase
      .from('subscription_periods')
      .insert({ subscription_id: subscriptionId, start_date: now, status: 'active' });
  },

  // Used to authorize a self-service pause/resume: confirms the subscription
  // belongs to the user making the request before dbService.pauseSubscription
  // / resumeSubscription touch it. `id` is the primary key, so exactly 0 or 1
  // rows can ever match — .maybeSingle() is safe here.
  getSubscriptionOwner: async (subscriptionId: number): Promise<number | null> => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('id', subscriptionId)
      .maybeSingle();
    if (error) throw new Error(`Failed to look up subscription owner: ${error.message}`);
    return data ? data.user_id : null;
  },

  // -------------------------------------------------------------------------
  // Job postings (public read of open postings, admin-managed)
  // -------------------------------------------------------------------------

  getOpenJobPostings: async () => {
    const { data, error } = await supabase
      .from('job_postings')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch job postings: ${error.message}`);
    return data;
  },

  // Admin listing — includes how many applications each posting has, via a
  // PostgREST count aggregate on the related job_applications rows (no
  // extra round trip per job).
  getAllJobPostings: async () => {
    const { data, error } = await supabase
      .from('job_postings')
      .select('*, job_applications(count)')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch job postings: ${error.message}`);

    return (data || []).map((row: any) => {
      const countRow = Array.isArray(row.job_applications) ? row.job_applications[0] : row.job_applications;
      const { job_applications, ...rest } = row;
      return { ...rest, applicant_count: countRow?.count ?? 0 };
    });
  },

  getJobPostingById: async (id: number) => {
    const { data, error } = await supabase.from('job_postings').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Failed to fetch job posting: ${error.message}`);
    return data;
  },

  createJobPosting: async (
    input: { title: string; description: string; location?: string; employment_type?: string },
    createdBy: number
  ) => {
    const { data, error } = await supabase
      .from('job_postings')
      .insert({
        title: input.title,
        description: input.description,
        location: input.location || null,
        employment_type: input.employment_type || 'full-time',
        created_by: createdBy,
      })
      .select()
      .single();
    if (error) throw new Error(`Failed to create job posting: ${error.message}`);
    return data;
  },

  updateJobPosting: async (
    id: number,
    updates: Partial<{ title: string; description: string; location: string; employment_type: string; status: string }>
  ) => {
    const { data, error } = await supabase
      .from('job_postings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(`Failed to update job posting: ${error.message}`);
    return data;
  },

  deleteJobPosting: async (id: number): Promise<void> => {
    const { error } = await supabase.from('job_postings').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete job posting: ${error.message}`);
  },

  // -------------------------------------------------------------------------
  // Job applications (resumes live in the "resumes" Supabase Storage bucket)
  // -------------------------------------------------------------------------

  // jobPostingId is null for a general / speculative application — a
  // candidate uploading a resume when no specific role is currently open.
  createJobApplication: async (
    jobPostingId: number | null,
    applicant: {
      full_name: string;
      email: string;
      phone?: string;
      cover_letter?: string;
      current_ctc?: string;
      expected_ctc?: string;
    },
    resumeBuffer: Buffer,
    resumeOriginalName: string,
    resumeContentType: string
  ) => {
    const ext = resumeOriginalName.includes('.') ? resumeOriginalName.split('.').pop() : 'pdf';
    const folder = jobPostingId === null ? 'general' : String(jobPostingId);
    const storagePath = `${folder}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(RESUMES_BUCKET)
      .upload(storagePath, resumeBuffer, { contentType: resumeContentType });
    if (uploadError) throw new Error(`Failed to upload resume: ${uploadError.message}`);

    const { data, error } = await supabase
      .from('job_applications')
      .insert({
        job_posting_id: jobPostingId,
        full_name: applicant.full_name,
        email: applicant.email,
        phone: applicant.phone || null,
        cover_letter: applicant.cover_letter || null,
        current_ctc: applicant.current_ctc || null,
        expected_ctc: applicant.expected_ctc || null,
        resume_path: storagePath,
        resume_original_name: resumeOriginalName,
      })
      .select()
      .single();
    if (error) throw new Error(`Failed to save application: ${error.message}`);
    return data;
  },

  getApplicationsForJob: async (jobPostingId: number) => {
    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('job_posting_id', jobPostingId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch applications: ${error.message}`);
    return dbService._withResumeUrls(data || []);
  },

  // General / speculative applications not tied to any job posting.
  getGeneralApplications: async () => {
    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .is('job_posting_id', null)
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch general applications: ${error.message}`);
    return dbService._withResumeUrls(data || []);
  },

  _withResumeUrls: async (applications: any[]) => {
    return Promise.all(
      applications.map(async (app) => {
        const { data: signed } = await supabase.storage
          .from(RESUMES_BUCKET)
          .createSignedUrl(app.resume_path, 60 * 60);
        return { ...app, resume_url: signed?.signedUrl || null };
      })
    );
  },

  // Lightweight listing (no signed URLs) used when streaming a zip of
  // resumes — we download the file bytes directly with the service role
  // client instead of round-tripping through a signed URL.
  getApplicationsForZip: async (jobPostingId: number | null) => {
    let query = supabase
      .from('job_applications')
      .select('id, full_name, resume_path, resume_original_name');
    query = jobPostingId === null ? query.is('job_posting_id', null) : query.eq('job_posting_id', jobPostingId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to list applications for zip: ${error.message}`);
    return data || [];
  },

  downloadResume: async (storagePath: string): Promise<Buffer> => {
    const { data, error } = await supabase.storage.from(RESUMES_BUCKET).download(storagePath);
    if (error || !data) throw new Error(`Failed to download resume: ${error?.message || 'not found'}`);
    return Buffer.from(await data.arrayBuffer());
  },

  updateApplicationStatus: async (id: number, status: 'new' | 'reviewed' | 'rejected' | 'hired') => {
    const { data, error } = await supabase
      .from('job_applications')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(`Failed to update application status: ${error.message}`);
    return data;
  },
};
