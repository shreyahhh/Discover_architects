import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
  };

  const goToProfile = () => {
    navigate(user?.role === 'admin' ? '/admin-profile' : '/user-dashboard');
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-20 bg-black/90 backdrop-blur-md border-b border-white/10 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.5)]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center shrink-0">
              <img src="/logo.jpeg" alt="Architect Web Logo" className="h-9 w-auto" />
            </Link>
          </div>

          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={goToProfile}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-white/10 transition group"
                title={user.role === 'admin' ? 'My Profile' : 'My Dashboard'}
              >
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold shrink-0 ring-2 ring-white/20 group-hover:ring-white/40 transition">
                  {user.username.charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:block text-white text-sm font-semibold">
                  {user.username}
                </span>
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-1.5 rounded-full border border-white/25 text-white text-sm font-medium hover:bg-white/10 hover:border-white/40 transition"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/login"
                className="px-4 py-1.5 rounded-full border border-white/25 text-white text-sm font-medium hover:bg-white/10 hover:border-white/40 transition"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-sm font-semibold shadow-md hover:from-indigo-600 hover:to-blue-600 transition"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
