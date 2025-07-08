import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  if (isHomePage) {
    return (
      <>
        <Header />
        {children}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
};

export default Layout; 