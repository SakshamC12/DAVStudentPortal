import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { GraduationCap, Calendar, User, Lock, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Student {
  id: number;
  studentId: string;
  name: string;
  email: string;
  department: string;
  year: number;
  semester: number;
  dateOfBirth: string;
}

interface LoginProps {
  onLogin: (student: Student) => void;
  onAdminLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onAdminLogin }) => {
  const [studentId, setStudentId] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [adminMode, setAdminMode] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (adminMode) {
      // Admin login with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      });
      if (error || !data.user) {
        setError('Invalid admin credentials');
      } else {
        onAdminLogin(data.user);
        navigate('/admin');
      }
      setLoading(false);
      return;
    }

    // Student login as before
    try {
      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('student_id', studentId)
        .eq('date_of_birth', dateOfBirth)
        .single();

      if (error || !student) {
        setError('Invalid Student ID or Date of Birth');
      } else {
        onLogin({
          id: student.id,
          studentId: student.student_id,
          name: student.name,
          email: student.email,
          department: student.department,
          year: student.year,
          semester: student.semester,
          dateOfBirth: student.date_of_birth
        });
      }
    } catch (err: any) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStudentId(e.target.value);
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateOfBirth(e.target.value);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="card" style={{ maxWidth: '480px', width: '100%' }}>
        <div className="text-center flex items-center justify-center gap-3" style={{ background: '#a6192e', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: '1.2rem 2rem 0.5rem 2rem' }}>
          <img src="/DavLogo.svg" alt="DAV Logo" style={{ height: 48, width: 48 }} />
          <h1 className="text-3xl font-extrabold" style={{ color: '#fff', letterSpacing: 1, marginBottom: 0 }}>DAV Student Portal</h1>
        </div>
        <div style={{ background: '#fff', color: '#222', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: '2rem 2rem 1.2rem 2rem', marginBottom: 0 }}>
          <h2 className="text-xl font-semibold mb-2" style={{ fontWeight: 600 }}>Sign in to access your academic records</h2>
          <div className="flex justify-center mt-4 gap-6">
            <button
              className={`login-toggle-btn px-6 py-3 rounded transition-colors font-bold${!adminMode ? ' active' : ''}`}
              type="button"
              onClick={() => setAdminMode(false)}
              style={{
                background: !adminMode ? '#a6192e' : '#fff',
                color: !adminMode ? '#fff' : '#a6192e',
                border: '2px solid #fff',
                outline: '2px solid #a6192e',
                boxShadow: !adminMode ? '0 2px 8px rgba(166,25,46,0.08)' : 'none',
              }}
            >
              Student Login
            </button>
            <button
              className={`login-toggle-btn px-6 py-3 rounded transition-colors font-bold${adminMode ? ' active' : ''}`}
              type="button"
              onClick={() => setAdminMode(true)}
              style={{
                background: adminMode ? '#a6192e' : '#fff',
                color: adminMode ? '#fff' : '#a6192e',
                border: '2px solid #fff',
                outline: '2px solid #a6192e',
                boxShadow: adminMode ? '0 2px 8px rgba(166,25,46,0.08)' : 'none',
              }}
            >
              <Shield size={18} className="inline mr-2" /> Admin Login
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!adminMode ? (
            <>
              <div className="form-group">
                <label className="form-label">
                  <User size={16} className="inline mr-2" />
                  Student ID
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={studentId}
                  onChange={handleStudentIdChange}
                  placeholder="Enter your Student ID"
                  required
                />
              </div>
              <div className="form-group mt-4">
                <label className="form-label">
                  <Calendar size={16} className="inline mr-2" />
                  Date of Birth
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={dateOfBirth}
                  onChange={handleDobChange}
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">
                  <User size={16} className="inline mr-2" />
                  Admin Email
                </label>
                <input
                  type="email"
                  className="form-input"
                  value={adminEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminEmail(e.target.value)}
                  placeholder="Enter admin email"
                  required
                />
              </div>
              <div className="form-group mt-4">
                <label className="form-label">
                  <Lock size={16} className="inline mr-2" />
                  Password
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={adminPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn w-full mt-6"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="spinner mr-2" style={{ width: '20px', height: '20px' }}></div>
                Signing In...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Lock size={16} className="mr-2" />
                Sign In
              </div>
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>{!adminMode ? 'Use your Student ID and Date of Birth to access your records' : 'Admin access only'}</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
