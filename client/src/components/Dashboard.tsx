import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, User, TrendingUp, Calendar, Library } from 'lucide-react';

interface Student {
  id: number;
  studentId: string;
  name: string;
  email: string;
  department: string;
  year: number;
  dateOfBirth: string;
  pfp_url?: string;
}

interface DashboardProps {
  student: Student;
}

const Dashboard: React.FC<DashboardProps> = ({ student }) => {
  const quickActions = [
    {
      title: 'View Marks',
      description: 'Check your academic performance',
      icon: BookOpen,
      path: '/marks',
      color: 'bg-blue-500'
    },
    {
      title: 'Library',
      description: 'View your borrowed books',
      icon: Library,
      path: '/library',
      color: 'bg-purple-500'
    },
    {
      title: 'Profile',
      description: 'Update your personal information',
      icon: User,
      path: '/profile',
      color: 'bg-green-500'
    }
  ];

  return (
    <div className="py-8">
      {/* Student Info Card with header */}
      <div className="card mb-8" style={{ padding: 0 }}>
        <div style={{ background: '#377dce', color: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: '1.5rem 2rem 1rem 2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 0 }}>Dashboard</h1>
          <p style={{ fontSize: '1.1rem', marginTop: 4, opacity: 0.95 }}>Welcome back, {student.name}!</p>
        </div>
        <div style={{ padding: '2rem' }}>
          <h2 className="text-xl font-bold mb-4">Student Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <table style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <td className="font-semibold pr-4 pb-2" style={{ width: '140px' }}>Student ID</td>
                    <td>{student.studentId}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold pr-4 pb-2">Name</td>
                    <td>{student.name}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold pr-4 pb-2">Department</td>
                    <td>{student.department}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold pr-4 pb-2">Year</td>
                    <td>{student.year}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex flex-col items-center justify-center">
              {/* Profile Picture */}
              <div style={{ marginBottom: 12 }}>
                <img
                  src={student.pfp_url ? `${student.pfp_url}?${Date.now()}` : '/default_pfp.png'}
                  alt="Profile"
                  style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', background: '#eee' }}
                />
              </div>
              <h3 className="text-lg font-semibold">{student.name}</h3>
              <p className="text-gray-600">{student.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Card with header */}
      <div className="card mb-8" style={{ padding: 0 }}>
        <div style={{ background: '#377dce', color: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: '1.2rem 2rem 1rem 2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 0 }}>Quick Actions</h2>
        </div>
        <div style={{ padding: '2rem' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.path}
                  to={action.path}
                  className="quick-action-btn flex items-center gap-4"
                  style={{ minHeight: '120px', border: '2px solid #222', borderRadius: '12px', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', padding: '2rem', textDecoration: 'none', transition: 'box-shadow 0.2s, border-color 0.2s' }}
                >
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mr-4`}>
                    <Icon size={28} color="white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1" style={{ color: '#222' }}>{action.title}</h3>
                    <p className="text-base text-gray-700" style={{ color: '#444' }}>{action.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Made by Card */}
      <div className="card" style={{ textAlign: 'center', padding: '2rem', marginTop: '2rem' }}>
        <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Made by Saksham Chaturvedi.</span>
      </div>
    </div>
  );
};

export default Dashboard; 