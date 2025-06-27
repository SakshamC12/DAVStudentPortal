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
      <div className="navbar-content container flex items-center justify-between w-full">
        {/* Left: Logo/Title */}
        <div className="navbar-left flex items-center flex-shrink-0" style={{ minWidth: 220 }}>
          <img src="/DavLogo.svg" alt="DAV Logo" style={{ height: 40, width: 40, marginRight: 12 }} />
          <span className="navbar-title font-bold text-xl">DAV Student Portal</span>
        </div>
        {/* Center: Navigation Links */}
        <nav className="navbar-links flex-1 flex items-center justify-center gap-12">
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
        <div className="navbar-right flex items-center flex-shrink-0" style={{ minWidth: 120, justifyContent: 'flex-end' }}>
          <button
            onClick={onLogout}
            className="navbar-logout flex items-center px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut size={18} className="mr-2" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header; 