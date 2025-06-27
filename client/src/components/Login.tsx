import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { GraduationCap, Calendar, User, Lock } from 'lucide-react';

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
    setStudentId((e.target as HTMLInputElement).value);
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateOfBirth((e.target as HTMLInputElement).value);
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
          <div className="alert alert-error mb-4 text-red-600 text-sm text-center">
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
          <p>Use your Student ID and Date of Birth to access your records</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
