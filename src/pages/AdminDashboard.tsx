import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface UserProfile {
  id: number;
  email: string;
  username: string;
  role: string;
  user_created_at: string;
  profile_created_at: string;
  updated_at: string;
}

interface Plan {
  id: number;
  name: string;
  duration_months: number;
}

type Period = { period_id: number | null; period_start: string | null; period_end: string | null; status: string | null };

interface Subscription {
  subscription_id: number;
  start_date: string;
  plan_name: string;
  duration_months: number;
  period_id: number | null;
  period_start: string | null;
  period_end: string | null;
  status: 'active' | 'paused' | null;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<Record<number, Subscription[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAll();
    }
    // eslint-disable-next-line
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const usersRes = await fetch('http://localhost:5000/api/admin/users');
      const usersData = await usersRes.json();
      setUsers(usersData);
      const plansRes = await fetch('http://localhost:5000/api/admin/plans');
      const plansData = await plansRes.json();
      setPlans(plansData);
      // Fetch subscriptions for each user
      const allSubs: Record<number, Subscription[]> = {};
      for (const u of usersData) {
        const subRes = await fetch(`http://localhost:5000/api/admin/user/${u.id}/subscriptions`);
        allSubs[u.id] = await subRes.json();
      }
      setSubs(allSubs);
    } catch (e) {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get the latest period for a subscription
  const getLatestPeriod = (periods: Period[]): Period | null => {
    if (!periods || periods.length === 0) return null;
    return periods.find((p: Period) => !p.period_end) || periods[periods.length - 1];
  };

  // Group users by plan
  const usersByPlan: Record<string, UserProfile[]> = {};
  users.forEach(u => {
    const userSubs = subs[u.id] || [];
    const planNames = Array.from(new Set(userSubs.map(s => s.plan_name)));
    planNames.forEach(plan => {
      if (!usersByPlan[plan]) usersByPlan[plan] = [];
      usersByPlan[plan].push(u);
    });
  });

  // Filter users by search
  const filterUsers = (userList: UserProfile[]) => {
    if (!search.trim()) return userList;
    const s = search.trim().toLowerCase();
    return userList.filter(u => u.username.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
  };

  // Render plan log for selected user
  const renderUserPlanLog = (userId: number) => {
    const userSubs = subs[userId] || [];
    if (userSubs.length === 0) return <div className="text-gray-500">No plans found for this user.</div>;
    // Only show one card per subscription
    return userSubs.map((sub, i) => {
      const periods = userSubs.filter(s => s.subscription_id === sub.subscription_id && s.period_id);
      if (userSubs.findIndex(s => s.subscription_id === sub.subscription_id) !== i) return null;
      const latestPeriod = getLatestPeriod(periods);
      const currentStatus = latestPeriod ? latestPeriod.status : sub.status;
      const statusColor = currentStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
      return (
        <div key={sub.subscription_id} className="mb-10">
          <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-bold text-lg mb-1">Plan: {sub.plan_name}</div>
              <div className="text-gray-700 mb-1">Start Date: {sub.start_date}</div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>Current Status: {currentStatus ? currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1) : "Unknown"}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="font-semibold mb-2">Pause/Resume History:</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-separate border-spacing-y-2 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-indigo-100">
                    <th className="px-4 py-3 text-left rounded-tl-xl">Status</th>
                    <th className="px-4 py-3 text-left">From</th>
                    <th className="px-4 py-3 text-left rounded-tr-xl">To</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.length > 0 ? periods.map((period, idx) => {
                    const isCurrent = !period.period_end;
                    return (
                      <tr key={period.period_id + '-' + idx} className={
                        `${isCurrent ? 'bg-green-50 font-bold text-green-900' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} rounded-xl`}
                      >
                        <td className="px-4 py-2 capitalize rounded-l-xl">{period.status}</td>
                        <td className="px-4 py-2">{period.period_start}</td>
                        <td className="px-4 py-2 rounded-r-xl">{period.period_end || <span className="italic text-gray-400">Ongoing</span>}</td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={3} className="px-4 py-2 text-center text-gray-400">No history available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    });
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">You do not have permission to view this page.</p>
        <Link to="/" className="text-blue-600 hover:underline">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-2" style={{ background: 'linear-gradient(135deg, #f0f4f8 0%, #e0e7ef 100%)' }}>
      <h1 className="text-4xl font-extrabold mb-6 text-center text-indigo-900 tracking-tight drop-shadow-lg">Admin: Membership Plans Overview</h1>
      <div className="flex justify-center mb-10">
        <input
          type="text"
          placeholder="Search by username or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-md px-5 py-3 border border-gray-300 rounded-xl shadow focus:outline-none focus:ring-2 focus:ring-indigo-300 text-lg"
        />
      </div>
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : (
        <div className="space-y-16">
          {/* Pro Plans Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-indigo-800 text-center">Pro Plans</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {filterUsers(usersByPlan['Pro'] || []).length === 0 && <div className="text-gray-400 col-span-2 italic">No users with Pro plan.</div>}
              {filterUsers(usersByPlan['Pro'] || []).map(u => (
                <div key={u.id} className={`rounded-2xl p-6 bg-gradient-to-br from-transparent via-indigo-50 to-blue-100 shadow-2xl hover:shadow-indigo-400/60 transition-transform duration-200 hover:scale-105 cursor-pointer flex flex-col gap-1 ${selectedUserId === u.id ? 'ring-4 ring-indigo-300' : ''}`} onClick={() => setSelectedUserId(u.id)}>
                  <div className="font-semibold text-xl text-indigo-900">{u.username}</div>
                  <div className="text-gray-600 text-base">{u.email}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Standard Plans Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-purple-800 text-center">Standard Plans</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {filterUsers(usersByPlan['Standard'] || []).length === 0 && <div className="text-gray-400 col-span-2 italic">No users with Standard plan.</div>}
              {filterUsers(usersByPlan['Standard'] || []).map(u => (
                <div key={u.id} className={`rounded-2xl p-6 bg-gradient-to-br from-transparent via-purple-50 to-indigo-100 shadow-2xl hover:shadow-purple-400/60 transition-transform duration-200 hover:scale-102 cursor-pointer flex flex-col gap-1 ${selectedUserId === u.id ? 'ring-4 ring-purple-300' : ''}`} onClick={() => setSelectedUserId(u.id)}>
                  <div className="font-semibold text-xl text-purple-900">{u.username}</div>
                  <div className="text-gray-600 text-base">{u.email}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Selected User Plan Log */}
          {selectedUserId && (
            <div className="mt-16 bg-gradient-to-br from-transparent via-blue-50 to-indigo-100 rounded-2xl shadow-2xl p-10 border-2 border-indigo-100">
              <h2 className="text-2xl font-bold mb-8 text-center text-indigo-800">Plan Log for <span className="text-indigo-900">{users.find(u => u.id === selectedUserId)?.username}</span></h2>
              {renderUserPlanLog(selectedUserId)}
              <div className="text-center mt-8">
                <button className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-indigo-200 transition font-semibold shadow" onClick={() => setSelectedUserId(null)}>Back to List</button>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="text-center mt-16">
        <Link to="/" className="text-blue-600 hover:underline font-medium text-lg">Return Home</Link>
      </div>
    </div>
  );
};

export default AdminDashboard; 