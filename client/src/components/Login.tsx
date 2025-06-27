import React, { useState } from 'react';
import axios from 'axios';
import { GraduationCap, Calendar, User, Lock } from 'lucide-react';

interface Student {
  id: number;
  studentId: string;
  name: string;
  email: string;
  department: string;
  year: number;
  dateOfBirth: string;
}

interface LoginProps {
  onLogin: (student: Student) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [studentId, setStudentId] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/student', {
        studentId,
        dateOfBirth
      });

      if (response.data.success) {
        onLogin({
          ...response.data.student,
          dateOfBirth: dateOfBirth
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <GraduationCap size={48} color="#667eea" />
          </div>
          <h1 className="text-2xl font-bold mb-2">DAV Student Portal</h1>
          <p className="text-gray-600">Sign in to access your academic records</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <User size={16} className="inline mr-2" />
              Student ID
            </label>
            <input
              type="text"
              className="form-input"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter your Student ID"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Calendar size={16} className="inline mr-2" />
              Date of Birth
            </label>
            <input
              type="date"
              className="form-input"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn w-full"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="spinner" style={{ width: '20px', height: '20px', marginRight: '8px' }}></div>
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
          <p>Use your Student ID and Date of Birth to access your records</p>
        </div>
      </div>
    </div>
  );
};

export default Login; 