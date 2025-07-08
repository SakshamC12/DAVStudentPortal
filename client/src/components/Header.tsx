import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Home, BookOpen, User, Menu, X, Library } from 'lucide-react';

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
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/marks', label: 'Marks', icon: BookOpen },
    { path: '/library', label: 'Library', icon: Library },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const handleLogout = () => {
    onLogout();
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div
        className="navbar-content container"
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'nowrap',
          minHeight: 64,
          width: '100%',
          padding: '0 1rem',
        }}
      >
        {/* Left: Logo/Title */}
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <img
            src="/DavLogo.svg"
            alt="DAV Logo"
            style={{ height: 40, width: 40, maxWidth: '100%', objectFit: 'contain', marginRight: 12 }}
          />
          <span className="navbar-title font-bold text-xl truncate" style={{ color: '#a6192e', whiteSpace: 'nowrap' }}>
            DAV Student Portal
          </span>
        </div>
        {/* Center: Nav Links */}
        <nav className="navbar-links" style={{ flex: 2, display: 'flex', justifyContent: 'center', gap: 48 }}>
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
              >
                <Icon size={18} className="mr-2" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {/* Right: Logout Button */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onLogout}
            className="navbar-logout flex items-center px-4 py-2 rounded-lg transition-colors"
            style={{ marginLeft: 12, minWidth: 120, fontWeight: 600, fontSize: '1.08rem' }}
          >
            <LogOut size={18} className="mr-2" />
            Logout
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div
          className="mobile-menu"
          style={{
            position: 'absolute',
            top: 64,
            left: 0,
            right: 0,
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '1rem 0'
          }}
        >
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setMobileMenuOpen(false);
                navigate(item.path);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#a6192e',
                fontWeight: 700,
                fontSize: '1.2rem',
                margin: '0.5rem 0'
              }}
            >
              {item.icon && <item.icon style={{ marginRight: 8 }} />}
              {item.label}
            </button>
          ))}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            style={{
              background: '#a6192e',
              color: '#fff',
              fontWeight: 700,
              borderRadius: 8,
              border: '2px solid #a6192e',
              padding: '0.75rem 2rem',
              marginTop: 16,
              fontSize: '1.1rem'
            }}
          >
            Logout
          </button>
        </div>
      )}
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
        /* Responsive navbar styles */
        @media (max-width: 600px) {
          .navbar-content {
            padding: 0 0.5rem !important;
          }
          .navbar-links {
            overflow-x: auto !important;
            flex-wrap: nowrap !important;
            gap: 24px !important;
            min-width: 0 !important;
          }
          .navbar-links > * {
            flex: 0 0 auto !important;
          }
          .navbar-links, .navbar-content .btn-logout {
            display: none !important;
          }
          .hamburger {
            display: block !important;
          }
        }
        @media (min-width: 601px) {
          .mobile-menu {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};

export default Header; 