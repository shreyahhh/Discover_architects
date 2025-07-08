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
  const [subs, setSubs] = useState<Record<number, Subscription[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

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

  // Filter users by search
  const filterUsers = (userList: UserProfile[]) => {
    if (!search.trim()) return userList;
    const s = search.trim().toLowerCase();
    return userList.filter(u => u.username.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
  };

  const getSubscriptionInfo = (userId: number): { planName: string; status: string } => {
    const userSubs = subs[userId] || [];
    if (userSubs.length === 0) return { planName: 'No Plan', status: 'N/A' };

    const activeSub = userSubs.find(s => s.status === 'active') || userSubs[0];
    return {
      planName: activeSub.plan_name,
      status: activeSub.status || 'Unknown',
    };
  };

  const renderPlanHistoryModal = () => {
    if (selectedUserId === null) return null;

    const selectedUser = users.find(u => u.id === selectedUserId);
    if (!selectedUser) return null;

    const userSubs = subs[selectedUserId] || [];

    const getLatestPeriod = (periods: Period[]): Period | null => {
      if (!periods || periods.length === 0) return null;
      return periods.find((p: Period) => !p.period_end) || periods[periods.length - 1];
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              Plan History: <span className="text-indigo-600">{selectedUser.username}</span>
            </h2>
            <button
              onClick={() => setSelectedUserId(null)}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div className="p-6">
            {userSubs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No subscription history found for this user.</div>
            ) : (
              Array.from(new Map(userSubs.map(item => [item['subscription_id'], item])).values()).map((sub, i) => {
                const periods = userSubs.filter(s => s.subscription_id === sub.subscription_id && s.period_id);
                const latestPeriod = getLatestPeriod(periods);
                const currentStatus = latestPeriod?.status || sub.status;
                const statusColor = currentStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';

                return (
                  <div key={sub.subscription_id} className="mb-8 last:mb-0">
                    <div className="mb-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="font-bold text-lg text-gray-800">Plan: {sub.plan_name}</div>
                      <div className="text-sm text-gray-600">Start Date: {new Date(sub.start_date).toLocaleDateString()}</div>
                      <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                        Status: {currentStatus ? currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1) : "Unknown"}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Pause/Resume History:</h4>
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr className="text-left">
                              <th className="px-4 py-2 font-medium text-gray-600">Status</th>
                              <th className="px-4 py-2 font-medium text-gray-600">From</th>
                              <th className="px-4 py-2 font-medium text-gray-600">To</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {periods.length > 0 ? periods.map((period, idx) => (
                              <tr key={period.period_id + '-' + idx} className="bg-white">
                                <td className="px-4 py-2 capitalize">{period.status}</td>
                                <td className="px-4 py-2">{period.period_start ? new Date(period.period_start).toLocaleDateString() : '-'}</td>
                                <td className="px-4 py-2">{period.period_end ? new Date(period.period_end).toLocaleDateString() : <span className="italic text-gray-500">Ongoing</span>}</td>
                              </tr>
                            )) : (
                              <tr><td colSpan={3} className="px-4 py-4 text-center text-gray-400">No pause/resume history available.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
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

  const filteredUsers = filterUsers(users);

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage user subscriptions and view membership details.
          </p>
        </header>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by username or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map(u => {
                  const subInfo = getSubscriptionInfo(u.id);
                  const statusColor = subInfo.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : subInfo.status === 'paused'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800';

                  return (
                    <tr key={u.id} className="hover:bg-gray-50 cursor-pointer transition" onClick={() => setSelectedUserId(u.id)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subInfo.planName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                          {subInfo.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {renderPlanHistoryModal()}
        <div className="text-center mt-8">
          <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 