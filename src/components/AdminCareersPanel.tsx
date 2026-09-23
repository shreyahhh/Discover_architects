import React, { useEffect, useState, useCallback } from 'react';
import { API_URL, authHeaders } from '../utils/api';
import Loader from './ui/loader';

interface JobPosting {
  id: number;
  title: string;
  description: string;
  location: string | null;
  employment_type: string;
  status: 'open' | 'closed';
  applicant_count: number;
  created_at: string;
}

interface Application {
  id: number;
  job_posting_id: number | null;
  full_name: string;
  email: string;
  phone: string | null;
  cover_letter: string | null;
  current_ctc: string | null;
  expected_ctc: string | null;
  resume_url: string | null;
  status: 'new' | 'reviewed' | 'rejected' | 'hired';
  created_at: string;
}

type JobFormState = {
  title: string;
  description: string;
  location: string;
  employment_type: string;
  status: 'open' | 'closed';
};

const GENERAL = 'general';
const STATUS_OPTIONS: Application['status'][] = ['new', 'reviewed', 'rejected', 'hired'];
const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'internship'];

const statusColor = (status: Application['status']) => {
  switch (status) {
    case 'hired': return 'bg-green-100 text-green-800';
    case 'reviewed': return 'bg-blue-100 text-blue-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const emptyJobForm: JobFormState = { title: '', description: '', location: '', employment_type: 'full-time', status: 'open' };

const AdminCareersPanel: React.FC = () => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState('');

  const [scope, setScope] = useState<string>(GENERAL); // 'general' or a job id (string)
  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError] = useState('');

  // Create-new-posting form
  const [showNewJobForm, setShowNewJobForm] = useState(false);
  const [newJob, setNewJob] = useState<JobFormState>(emptyJobForm);
  const [creatingJob, setCreatingJob] = useState(false);
  const [createJobError, setCreateJobError] = useState('');

  // Edit-existing-posting form
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [editJob, setEditJob] = useState<JobFormState>(emptyJobForm);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const [deletingJobId, setDeletingJobId] = useState<number | null>(null);
  const [jobActionError, setJobActionError] = useState('');

  const fetchJobs = useCallback(async () => {
    setJobsLoading(true);
    setJobsError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/jobs`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch job postings');
      setJobs(await res.json());
    } catch (e) {
      setJobsError('Failed to load job postings');
    } finally {
      setJobsLoading(false);
    }
  }, []);

  const fetchApplications = useCallback(async (nextScope: string) => {
    setAppsLoading(true);
    setAppsError('');
    setExpandedId(null);
    try {
      const url = nextScope === GENERAL
        ? `${API_URL}/api/admin/applications/general`
        : `${API_URL}/api/admin/jobs/${nextScope}/applications`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch applications');
      setApplications(await res.json());
    } catch (e) {
      setAppsError('Failed to load candidates for this selection');
      setApplications([]);
    } finally {
      setAppsLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);
  useEffect(() => { fetchApplications(scope); }, [scope, fetchApplications]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.title.trim() || !newJob.description.trim()) return;
    setCreatingJob(true);
    setCreateJobError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(newJob),
      });
      if (!res.ok) throw new Error('Failed to create job posting');
      setNewJob(emptyJobForm);
      setShowNewJobForm(false);
      await fetchJobs();
    } catch (e) {
      setCreateJobError('Failed to create job posting');
    } finally {
      setCreatingJob(false);
    }
  };

  const startEditingJob = (job: JobPosting) => {
    setJobActionError('');
    setEditError('');
    setEditingJobId(job.id);
    setEditJob({
      title: job.title,
      description: job.description,
      location: job.location || '',
      employment_type: job.employment_type,
      status: job.status,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingJobId === null) return;
    if (!editJob.title.trim() || !editJob.description.trim()) return;
    setSavingEdit(true);
    setEditError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/jobs/${editingJobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(editJob),
      });
      if (!res.ok) throw new Error('Failed to save changes');
      setEditingJobId(null);
      await fetchJobs();
    } catch (e) {
      setEditError('Failed to save changes. Please try again.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleStatus = async (job: JobPosting) => {
    setJobActionError('');
    const nextStatus = job.status === 'open' ? 'closed' : 'open';
    try {
      const res = await fetch(`${API_URL}/api/admin/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      await fetchJobs();
    } catch (e) {
      setJobActionError(`Failed to ${nextStatus === 'closed' ? 'close' : 'reopen'} the posting.`);
    }
  };

  const handleDeleteJob = async (job: JobPosting) => {
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone, and its applications will be deleted too.`)) return;
    setJobActionError('');
    setDeletingJobId(job.id);
    try {
      const res = await fetch(`${API_URL}/api/admin/jobs/${job.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete posting');
      if (scope === String(job.id)) setScope(GENERAL);
      await fetchJobs();
    } catch (e) {
      setJobActionError('Failed to delete the posting.');
    } finally {
      setDeletingJobId(null);
    }
  };

  const handleStatusChange = async (applicationId: number, status: Application['status']) => {
    // Optimistic update so the dropdown feels immediate.
    setApplications((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status } : a)));
    try {
      const res = await fetch(`${API_URL}/api/admin/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
    } catch (e) {
      setAppsError('Failed to update a candidate\'s status — refresh to see the current state.');
    }
  };

  const handleDownloadZip = async () => {
    setZipLoading(true);
    setZipError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/applications/zip?jobId=${scope}`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to download resumes');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = scope === GENERAL ? 'general-applications.zip' : `job-${scope}-applications.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setZipError(e instanceof Error ? e.message : 'Failed to download resumes');
    } finally {
      setZipLoading(false);
    }
  };

  const selectedJob = jobs.find((j) => String(j.id) === scope);

  const renderJobForm = (
    form: JobFormState,
    setForm: (f: JobFormState) => void,
    onSubmit: (e: React.FormEvent) => void,
    submitting: boolean,
    submitLabel: string,
    error: string,
    onCancel?: () => void,
    includeStatus?: boolean
  ) => (
    <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Title"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2"
        />
        <input
          type="text"
          placeholder="Location (optional)"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <select
          value={form.employment_type}
          onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
        >
          {EMPLOYMENT_TYPES.map((t) => (
            <option key={t} value={t}>{t.replace('-', ' ').replace(/^./, (c) => c.toUpperCase())}</option>
          ))}
        </select>
        {includeStatus && (
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as 'open' | 'closed' })}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        )}
      </div>
      <textarea
        placeholder="Description"
        required
        rows={4}
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full border border-gray-300 rounded-lg px-3 py-2"
      />
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60"
        >
          {submitting ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );

  return (
    <div>
      {/* Job postings list */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Job postings</h2>
        <button
          onClick={() => { setShowNewJobForm((v) => !v); setEditingJobId(null); }}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
        >
          {showNewJobForm ? 'Cancel' : '+ New posting'}
        </button>
      </div>

      {showNewJobForm && renderJobForm(
        newJob, setNewJob, handleCreateJob, creatingJob, 'Create posting', createJobError
      )}

      {jobActionError && <div className="text-red-600 text-sm mb-3">{jobActionError}</div>}

      {jobsLoading ? (
        <div className="py-8 mb-6"><Loader label="Loading postings..." /></div>
      ) : jobsError ? (
        <div className="text-red-500 mb-6">{jobsError}</div>
      ) : jobs.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-gray-500 mb-6">
          No job postings yet. Create one above.
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicants</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {jobs.map((job) => (
                <React.Fragment key={job.id}>
                  <tr className={`hover:bg-gray-50 ${scope === String(job.id) ? 'bg-indigo-50' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{job.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{job.location || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 capitalize">{job.employment_type.replace('-', ' ')}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${job.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-medium">{job.applicant_count}</td>
                    <td className="px-4 py-3 text-sm space-x-3 whitespace-nowrap">
                      <button
                        onClick={() => { setScope(String(job.id)); setEditingJobId(null); }}
                        className="text-indigo-600 hover:underline font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() => startEditingJob(job)}
                        className="text-gray-600 hover:underline font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(job)}
                        className="text-gray-600 hover:underline font-medium"
                      >
                        {job.status === 'open' ? 'Close' : 'Reopen'}
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job)}
                        disabled={deletingJobId === job.id}
                        className="text-red-600 hover:underline font-medium disabled:opacity-50"
                      >
                        {deletingJobId === job.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                  {editingJobId === job.id && (
                    <tr>
                      <td colSpan={6} className="px-4 pb-4 bg-gray-50">
                        {renderJobForm(
                          editJob, setEditJob, handleSaveEdit, savingEdit, 'Save changes', editError,
                          () => setEditingJobId(null), true
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Full details for the selected job */}
      {selectedJob && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{selectedJob.title}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {selectedJob.location ? `${selectedJob.location} · ` : ''}
                {selectedJob.employment_type.replace('-', ' ')} ·{' '}
                <span className={selectedJob.status === 'open' ? 'text-green-700' : 'text-gray-500'}>{selectedJob.status}</span>
                {' · '}{selectedJob.applicant_count} applicant{selectedJob.applicant_count === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <p className="text-gray-700 text-sm mt-4 whitespace-pre-wrap">{selectedJob.description}</p>
        </div>
      )}

      {/* Candidates for the selected scope */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          {selectedJob ? `Candidates for ${selectedJob.title}` : 'General applicants'}
        </h2>
        <div className="flex items-center gap-2">
          {scope !== GENERAL && (
            <button
              onClick={() => setScope(GENERAL)}
              className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
            >
              View general applicants
            </button>
          )}
          <button
            onClick={handleDownloadZip}
            disabled={zipLoading || applications.length === 0}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-40 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            {zipLoading ? 'Zipping...' : 'Download resumes (.zip)'}
          </button>
        </div>
      </div>
      {zipError && <div className="text-red-600 text-sm mb-3">{zipError}</div>}

      {appsLoading ? (
        <div className="py-8"><Loader label="Loading candidates..." /></div>
      ) : appsError ? (
        <div className="text-red-500">{appsError}</div>
      ) : applications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
          No applications yet for this selection.
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resume</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {applications.map((application) => (
                <React.Fragment key={application.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-4 align-top">
                      <div className="font-medium text-gray-900">{application.full_name}</div>
                      {application.cover_letter && (
                        <button
                          onClick={() => setExpandedId(expandedId === application.id ? null : application.id)}
                          className="text-xs text-indigo-600 hover:underline mt-1"
                        >
                          {expandedId === application.id ? 'Hide cover letter' : 'View cover letter'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-gray-600">
                      <div>{application.email}</div>
                      {application.phone && <div className="text-gray-400">{application.phone}</div>}
                      {(application.current_ctc || application.expected_ctc) && (
                        <div className="text-gray-400 mt-1">
                          CTC: {application.current_ctc || '—'} → {application.expected_ctc || '—'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-gray-500 whitespace-nowrap">
                      {new Date(application.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 align-top text-sm">
                      {application.resume_url ? (
                        <a
                          href={application.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400">Unavailable</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <select
                        value={application.status}
                        onChange={(e) => handleStatusChange(application.id, e.target.value as Application['status'])}
                        className={`text-xs font-semibold rounded-full px-3 py-1 border-0 ${statusColor(application.status)}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {expandedId === application.id && application.cover_letter && (
                    <tr>
                      <td colSpan={5} className="px-4 pb-4 bg-gray-50">
                        <div className="text-sm text-gray-700 whitespace-pre-wrap border border-gray-200 rounded-lg p-4 bg-white">
                          {application.cover_letter}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCareersPanel;
