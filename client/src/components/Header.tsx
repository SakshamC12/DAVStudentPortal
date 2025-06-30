import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Home, BookOpen, User, Menu, X } from 'lucide-react';

interface Student {
  id: number;
  studentId: string;
  name: string;
  email: string;
  department: string;
  year: number;
  dateOfBirth: string;
}

interface HeaderProps {
  student: Student;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ student, onLogout }) => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/marks', label: 'Marks', icon: BookOpen },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <header className="navbar">
      <div
        className="navbar-content container"
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          minHeight: 64,
          width: '100%',
          padding: '0 1rem',
        }}
      >
        {/* Logo/Title */}
        <div
          className="navbar-left flex items-center flex-shrink-0"
          style={{ minWidth: 0, display: 'flex', alignItems: 'center' }}
        >
          <img
            src="/DavLogo.svg"
            alt="DAV Logo"
            style={{ height: 40, width: 40, maxWidth: '100%', objectFit: 'contain', marginRight: 12 }}
          />
          <span className="navbar-title font-bold text-xl truncate" style={{ color: '#a6192e' }}>
            DAV Student Portal
          </span>
        </div>
        {/* Hamburger Icon (mobile only) */}
        <button
          className="navbar-hamburger md:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((open) => !open)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            marginLeft: 12,
            cursor: 'pointer',
            padding: 8,
            zIndex: 110,
          }}
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
        {/* Nav Links & Logout (desktop or mobile menu open) */}
        <nav
          className={`navbar-links${menuOpen ? ' open' : ''}`}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`navbar-link flex items-center px-3 py-2 rounded-lg transition-colors ${
                  isActive ? 'navbar-link-active' : 'navbar-link-inactive'
                }`}
                style={{ fontWeight: 500, fontSize: '1.08rem', whiteSpace: 'nowrap' }}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={18} className="mr-2" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={onLogout}
          className={`navbar-logout${menuOpen ? ' open' : ''} flex items-center px-4 py-2 rounded-lg transition-colors`}
          style={{ marginLeft: 12, minWidth: 120, fontWeight: 600, fontSize: '1.08rem' }}
        >
          <LogOut size={18} className="mr-2" />
          Logout
        </button>
      </div>
      {/* Responsive: Hamburger menu for mobile */}
      <style>{`
        @media (max-width: 700px) {
          .navbar-hamburger {
            display: block !important;
          }
          .navbar-links,
          .navbar-logout {
            display: none !important;
          }
          .navbar-links.open,
          .navbar-logout.open {
            display: flex !important;
            flex-direction: column !important;
            width: 100%;
            margin: 0.5rem 0;
            background: #fff;
            box-shadow: 0 4px 16px rgba(166, 25, 46, 0.08);
            border-radius: 0 0 12px 12px;
            z-index: 109;
          }
          .navbar-links.open {
            gap: 0.5rem !important;
          }
          .navbar-logout.open {
            margin-left: 0 !important;
            margin-bottom: 0.5rem;
          }
        }
      `}</style>
    </header>
  );
};

export default Header; 