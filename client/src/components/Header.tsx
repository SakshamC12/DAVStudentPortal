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
    <header className="navbar flex flex-col md:flex-row items-center justify-between w-full px-2 md:px-0">
      <div className="navbar-content container flex flex-col md:flex-row items-center justify-between w-full">
        {/* Left: Logo/Title */}
        <div className="navbar-left flex items-center flex-shrink-0 w-full md:w-auto mb-2 md:mb-0" style={{ minWidth: 0 }}>
          <img src="/DavLogo.svg" alt="DAV Logo" style={{ height: 40, width: 40, maxWidth: '100%', objectFit: 'contain', marginRight: 12 }} />
          <span className="navbar-title font-bold text-xl truncate">DAV Student Portal</span>
        </div>
        {/* Center: Navigation Links */}
        <nav className="navbar-links flex-1 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12 w-full md:w-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`navbar-link flex items-center px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'navbar-link-active'
                    : 'navbar-link-inactive'
                }`}
              >
                <Icon size={18} className="mr-2" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {/* Right: Logout Button */}
        <button
          onClick={onLogout}
          className="navbar-logout flex items-center px-4 py-2 rounded-lg transition-colors mt-2 md:mt-0 w-full md:w-auto justify-center md:justify-end"
          style={{ maxWidth: 180 }}
        >
          <LogOut size={18} className="mr-2" />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header; 