import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Phone, MapPin, Calendar, BookOpen } from 'lucide-react';

interface Student {
  id: number;
  studentId: string;
  name: string;
  email: string;
  department: string;
  year: number;
  dateOfBirth: string;
}

interface ProfileData {
  id: number;
  student_id: string;
  name: string;
  email: string;
  department: string;
  year: number;
  semester: number;
  date_of_birth: string;
  phone: string;
  address: string;
}

interface ProfileProps {
  student: Student;
}

const Profile: React.FC<ProfileProps> = ({ student }) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.post('/api/profile', {
        studentId: student.studentId,
        dateOfBirth: student.dateOfBirth
      });
      if (response.data.success) {
        setProfile(response.data.profile);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="alert alert-error">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="card" style={{ maxWidth: 800, margin: '0 auto', padding: 0 }}>
        <div style={{ background: '#377dce', color: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: '1.5rem 2rem 1rem 2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 0 }}>Student Profile</h1>
          <p style={{ fontSize: '1.1rem', marginTop: 4, opacity: 0.95 }}>View and manage your personal information</p>
        </div>
        <div style={{ padding: '2rem' }}>
          <table style={{ width: '100%', fontSize: '1.1rem' }}>
            <tbody>
              <tr>
                <td className="font-semibold" style={{ width: '220px', padding: '12px 8px' }}>Full Name</td>
                <td>{profile?.name}</td>
              </tr>
              <tr>
                <td className="font-semibold" style={{ padding: '12px 8px' }}>Student ID</td>
                <td>{profile?.student_id}</td>
              </tr>
              <tr>
                <td className="font-semibold" style={{ padding: '12px 8px' }}>Email Address</td>
                <td>{profile?.email}</td>
              </tr>
              <tr>
                <td className="font-semibold" style={{ padding: '12px 8px' }}>Department</td>
                <td>{profile?.department}</td>
              </tr>
              <tr>
                <td className="font-semibold" style={{ padding: '12px 8px' }}>Year</td>
                <td>{profile?.year}</td>
              </tr>
              <tr>
                <td className="font-semibold" style={{ padding: '12px 8px' }}>Semester</td>
                <td>{profile?.semester}</td>
              </tr>
              <tr>
                <td className="font-semibold" style={{ padding: '12px 8px' }}>Date of Birth</td>
                <td>{profile?.date_of_birth}</td>
              </tr>
              <tr>
                <td className="font-semibold" style={{ padding: '12px 8px' }}>Phone Number</td>
                <td>{profile?.phone || 'Not provided'}</td>
              </tr>
              <tr>
                <td className="font-semibold" style={{ padding: '12px 8px' }}>Address</td>
                <td>{profile?.address || 'Not provided'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {/* Note */}
      <div className="card mt-8" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="alert alert-info">
          <h3 className="font-semibold mb-2">Important Note</h3>
          <p className="text-sm">
            For any changes to your personal information, please contact your department office. 
            This portal is for viewing purposes only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile; 