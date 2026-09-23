import React, { useEffect, useState } from 'react';
import Loader from '../components/ui/loader';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const GENERAL_APPLICATION = 'general';

interface JobPosting {
  id: number;
  title: string;
  description: string;
  location: string | null;
  employment_type: string;
  status: string;
}

const employmentTypeLabel = (t: string) => t.replace('-', ' ').replace(/^./, (c) => c.toUpperCase());

const Careers: React.FC = () => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState('');

  // The application form is collapsed until the visitor takes an action —
  // clicking "Apply" on a role, or "Submit your resume" for a general one.
  const [formOpen, setFormOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string>(GENERAL_APPLICATION);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentCtc, setCurrentCtc] = useState('');
  const [expectedCtc, setExpectedCtc] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      setJobsLoading(true);
      setJobsError('');
      try {
        const res = await fetch(`${API_URL}/api/jobs`);
        if (!res.ok) throw new Error('Failed to load job postings');
        const data = await res.json();
        setJobs(data);
      } catch (e) {
        setJobsError('Could not load current openings right now.');
      } finally {
        setJobsLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const openFormFor = (jobId: string) => {
    setSelectedJobId(jobId);
    setFormOpen(true);
    setSubmitted(false);
    setSubmitError('');
    requestAnimationFrame(() => {
      document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const closeForm = () => {
    setFormOpen(false);
    setSubmitError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) {
      setSubmitError('Please attach your resume.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    const formData = new FormData();
    formData.append('full_name', fullName);
    formData.append('email', email);
    if (phone) formData.append('phone', phone);
    if (currentCtc) formData.append('current_ctc', currentCtc);
    if (expectedCtc) formData.append('expected_ctc', expectedCtc);
    if (coverLetter) formData.append('cover_letter', coverLetter);
    formData.append('resume', resumeFile);

    const endpoint =
      selectedJobId === GENERAL_APPLICATION
        ? `${API_URL}/api/jobs/apply`
        : `${API_URL}/api/jobs/${selectedJobId}/apply`;

    try {
      const res = await fetch(endpoint, { method: 'POST', body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to submit application');
      }
      setSubmitted(true);
      setFullName('');
      setEmail('');
      setPhone('');
      setCurrentCtc('');
      setExpectedCtc('');
      setCoverLetter('');
      setResumeFile(null);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedJob = jobs.find((j) => String(j.id) === selectedJobId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-16 px-4">
        <div className="text-center mb-14">
          <h1
            className="text-5xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: 'Georgia, Times New Roman, Times, serif' }}
          >
            Careers
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto text-lg">
            Join a team shaping how people experience architecture and interior design.
          </p>
        </div>

        {/* Open positions */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-5" style={{ fontFamily: 'Georgia, Times New Roman, Times, serif' }}>
            Open positions
          </h2>
          {jobsLoading ? (
            <div className="py-8"><Loader label="Loading openings..." /></div>
          ) : jobsError ? (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5">{jobsError}</div>
          ) : jobs.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500">
              There are no open positions right now — but you can still submit your resume below.
            </div>
          ) : (
            <div className="grid gap-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                        {employmentTypeLabel(job.employment_type)}
                      </span>
                    </div>
                    {job.location && <p className="text-sm text-gray-500 mt-1">{job.location}</p>}
                    <p className="text-gray-600 mt-3 text-sm">{job.description}</p>
                  </div>
                  <button
                    onClick={() => openFormFor(String(job.id))}
                    className="shrink-0 px-6 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold hover:from-indigo-600 hover:to-blue-600 transition self-start"
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* General application prompt — collapsed until clicked */}
        {!formOpen && (
          <section className="rounded-3xl bg-gradient-to-br from-orange-400 via-pink-500 to-blue-600 p-8 sm:p-10 text-white text-center shadow-lg">
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Georgia, Times New Roman, Times, serif' }}>
              Don't see the right role?
            </h2>
            <p className="text-white/90 max-w-xl mx-auto mb-6">
              You can still submit your resume — we keep every submission on file, and when a matching position opens up, we'll review it and reach out.
            </p>
            <button
              onClick={() => openFormFor(GENERAL_APPLICATION)}
              className="px-8 py-3 rounded-full bg-white text-gray-900 font-semibold hover:bg-gray-100 transition"
            >
              Submit your resume
            </button>
          </section>
        )}

        {/* Application form — only rendered once opened */}
        {formOpen && (
          <section id="application-form" className="bg-white border border-gray-200 rounded-3xl shadow-lg p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-1">
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, Times New Roman, Times, serif' }}>
                {selectedJob ? `Apply for ${selectedJob.title}` : 'Submit your resume'}
              </h2>
              <button
                onClick={closeForm}
                className="text-gray-400 hover:text-gray-600 transition text-2xl leading-none"
                aria-label="Close form"
              >
                &times;
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              {selectedJob
                ? 'Fill in your details below and attach your resume.'
                : "No specific role selected — we'll keep your resume on file for future openings that match."}
            </p>

            {submitted ? (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-5">
                Thanks — your application has been received. We'll be in touch if there's a match.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {jobs.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <select
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                    >
                      <option value={GENERAL_APPLICATION}>General application (no specific role)</option>
                      {jobs.map((job) => (
                        <option key={job.id} value={job.id}>{job.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current CTC <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 6 LPA"
                      value={currentCtc}
                      onChange={(e) => setCurrentCtc(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected CTC <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 8 LPA"
                      value={expectedCtc}
                      onChange={(e) => setExpectedCtc(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cover letter (optional)</label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resume</label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">PDF or Word document.</p>
                </div>

                {submitError && <div className="text-red-600 text-sm">{submitError}</div>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit application'}
                </button>
              </form>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default Careers;
