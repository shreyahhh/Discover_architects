import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { API_URL, authHeaders } from '../utils/api';
import Loader from '../components/ui/loader';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [userSubs, setUserSubs] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [subsError, setSubsError] = useState('');

  useEffect(() => {
    if (user) {
      fetchSubs();
    }
    // eslint-disable-next-line
  }, [user]);

  const fetchSubs = () => {
    if (!user) return;
    setLoadingSubs(true);
    setSubsError('');
    fetch(`${API_URL}/api/me/subscriptions`, { headers: authHeaders() })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load membership');
        return res.json();
      })
      .then(data => setUserSubs(data))
      .catch(() => setSubsError('Could not load your membership details. Please try again shortly.'))
      .finally(() => setLoadingSubs(false));
  };

  const handlePause = async (subId: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/me/subscriptions/${subId}/pause`, { method: 'POST', headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to pause');
      fetchSubs();
    } catch (e) {
      setSubsError('Failed to pause your subscription. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  const handleResume = async (subId: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/me/subscriptions/${subId}/resume`, { method: 'POST', headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to resume');
      fetchSubs();
    } catch (e) {
      setSubsError('Failed to resume your subscription. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Find the latest period for each subscription to determine the true current status
  type Period = { period_end?: string | null; status: string };
  const getLatestPeriod = (periods: Period[]): Period | null => {
    if (!periods || periods.length === 0) return null;
    // Find the period with period_end == null (ongoing), or the last one
    return periods.find((p: Period) => !p.period_end) || periods[periods.length - 1];
  };

  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  if (!user || user.role === 'admin') {
    return <Navigate to="/" />;
  }

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Your Membership Dashboard</h1>
      {infoMsg && (
        <div className="mb-4 text-center text-yellow-700 bg-yellow-100 border border-yellow-300 rounded px-4 py-2">{infoMsg}</div>
      )}
      {subsError && (
        <div className="mb-4 text-center text-red-700 bg-red-100 border border-red-300 rounded px-4 py-2">{subsError}</div>
      )}
      {loadingSubs ? (
        <div className="py-12"><Loader label="Loading membership..." /></div>
      ) : userSubs.length > 0 ? (
        <div className="space-y-8">
          {userSubs.map((sub, i) => {
            const periods = userSubs.filter(s => s.subscription_id === sub.subscription_id && s.period_id);
            if (userSubs.findIndex(s => s.subscription_id === sub.subscription_id) !== i) return null;
            const latestPeriod = getLatestPeriod(periods);
            const currentStatus = latestPeriod ? latestPeriod.status : sub.status;
            const statusColor = currentStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';

            // Calculate active days
            let activeDays = 0;
            const planDuration = sub.duration_months * 30; // fallback: 30 days per month
            periods.forEach(period => {
              if (period.status === 'active') {
                const start = dayjs(period.period_start);
                const end = period.period_end ? dayjs(period.period_end) : dayjs();
                activeDays += end.diff(start, 'day');
              }
            });

            return (
              <div key={sub.subscription_id} className="bg-white rounded-xl p-6 shadow border mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                  <div>
                    <div className="font-bold text-lg mb-1">Plan: {sub.plan_name}</div>
                    <div className="text-gray-700 mb-1">Start Date: {sub.start_date}</div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>Current Status: {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}</span>
                  </div>
                  <div className="mt-4 md:mt-0">
                    {currentStatus === 'active' ? (
                      <button className="px-4 py-2 bg-yellow-500 text-white rounded shadow hover:bg-yellow-600 transition" onClick={() => handlePause(sub.subscription_id)} disabled={actionLoading}>
                        {actionLoading ? 'Pausing...' : 'Pause'}
                      </button>
                    ) : (
                      <button className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition" onClick={() => handleResume(sub.subscription_id)} disabled={actionLoading}>
                        {actionLoading ? 'Resuming...' : 'Resume'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="font-semibold mb-2">Pause/Resume History:</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-left">From</th>
                          <th className="px-3 py-2 text-left">To</th>
                        </tr>
                      </thead>
                      <tbody>
                        {periods.length > 0 ? periods.map((period, idx) => (
                          <tr key={period.period_id + '-' + idx}>
                            <td className="px-3 py-2 capitalize">{period.status}</td>
                            <td className="px-3 py-2">{period.period_start}</td>
                            <td className="px-3 py-2">{period.period_end || <span className="italic text-gray-400">Ongoing</span>}</td>
                          </tr>
                        )) : (
                          <tr><td colSpan={3} className="px-3 py-2 text-center text-gray-400">No history available</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-2 text-sm text-gray-700 font-medium">
                    Active days: {activeDays}/{planDuration} days
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-10 text-center">
          <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No active membership yet</h2>
          <p className="text-gray-500 max-w-sm mx-auto mb-6">
            Choose a plan to unlock full access to Discover Architects — you'll see it here once you're subscribed.
          </p>
          <Link
            to="/#plans"
            className="inline-flex items-center px-6 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold shadow hover:from-indigo-600 hover:to-blue-600 transition"
          >
            View membership plans
          </Link>
        </div>
      )}
      <div className="text-center mt-8">
        <Link to="/" className="text-blue-600 hover:underline">Return Home</Link>
      </div>
    </div>
  );
};

export default UserDashboard; 