import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
  };

  return (
    <header className="relative top-0 left-0 right-0 z-20">
      {/* Black bar background */}
      <div className="absolute inset-0 w-full h-full bg-black z-0" />
      <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="flex justify-between h-16 items-center">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/">
                <img src="/logo.jpeg" alt="Architect Web Logo" className="h-10 w-auto" />
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-white font-bold text-lg drop-shadow-md">
                  Welcome, {user.username} ({user.role})
                </span>
                {/* Show My Profile icon for admin only */}
                {user.role === 'admin' && (
                  <button
                    className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition border-2 border-white shadow-lg"
                    title="My Profile"
                    onClick={() => navigate('/admin-profile')}
                    style={{ display: user.role === 'admin' ? 'inline-flex' : 'none', padding: 0 }}
                  >
                    <svg
                      className="w-10 h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                    </svg>
                  </button>
                )}
                {/* User Dashboard button for all users */}
                {user.role !== 'admin' && (
                  <button
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ml-2"
                    onClick={() => navigate('/user-dashboard')}
                  >
                    User Dashboard
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-2"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center px-4 py-2 border border-white text-sm font-medium rounded-md text-white bg-transparent hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header; 