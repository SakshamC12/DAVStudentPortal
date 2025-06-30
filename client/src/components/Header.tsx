import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Home, BookOpen, User } from 'lucide-react';

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
        {/* Nav Links */}
        <nav
          className="navbar-links"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2rem',
            flex: 1,
            minWidth: 0,
          }}
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
              >
                <Icon size={18} className="mr-2" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="navbar-logout flex items-center px-4 py-2 rounded-lg transition-colors"
          style={{ marginLeft: 12, minWidth: 120, fontWeight: 600, fontSize: '1.08rem' }}
        >
          <LogOut size={18} className="mr-2" />
          Logout
        </button>
      </div>
      {/* Responsive: Stack vertically on small screens */}
      <style>{`
        @media (max-width: 700px) {
          .navbar-content {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 0.5rem;
            padding: 0 0.5rem;
          }
          .navbar-links {
            flex-direction: column !important;
            gap: 0.5rem !important;
            width: 100%;
            margin: 0.5rem 0;
          }
          .navbar-logout {
            width: 100%;
            margin-left: 0 !important;
            margin-bottom: 0.5rem;
          }
          .navbar-left {
            margin-bottom: 0.5rem;
            justify-content: center;
          }
        }
      `}</style>
    </header>
  );
};

export default Header; 