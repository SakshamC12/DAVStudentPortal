import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, Mail, Phone, MapPin, Calendar, BookOpen } from 'lucide-react';

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
  gender?: string;
  blood_group?: string;
  secondary_email?: string;
}

interface Guardian {
  id: number;
  student_id: number;
  guardian_name: string;
  guardian_contact: string;
  relation: string;
}

interface ProfileProps {
  student: Student;
}

const Profile: React.FC<ProfileProps> = ({ student }) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('students')
        .select('*')
        .eq('student_id', student.studentId)
        .eq('date_of_birth', student.dateOfBirth)
        .single();
      if (profileError || !profile) {
        setError('Invalid Student ID or Date of Birth');
        setLoading(false);
        return;
      }
      setProfile(profile);
      // Fetch guardians
      const { data: guardians, error: guardiansError } = await supabase
        .from('guardians')
        .select('*')
        .eq('student_id', profile.id);
      if (!guardiansError && guardians) {
        setGuardians(guardians);
      }
    } catch (err: any) {
      setError('Failed to fetch profile');
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
        <div style={{ background: '#a6192e', color: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: '1.5rem 2rem 1rem 2rem' }}>
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
                <td className="font-semibold" style={{ padding: '12px 8px' }}>Secondary Email</td>
                <td>{profile?.secondary_email || 'Not provided'}</td>
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
                <td className="font-semibold" style={{ padding: '12px 8px' }}>Gender</td>
                <td>{profile?.gender || 'Not provided'}</td>
              </tr>
              <tr>
                <td className="font-semibold" style={{ padding: '12px 8px' }}>Blood Group</td>
                <td>{profile?.blood_group || 'Not provided'}</td>
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
      {/* Guardians Table */}
      <div className="card mt-8" style={{ maxWidth: 800, margin: '0 auto', padding: 0 }}>
        <div style={{ background: '#a6192e', color: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: '1.2rem 2rem 1rem 2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 0 }}>Guardians</h2>
        </div>
        <div style={{ padding: '2rem' }}>
          {guardians.length === 0 ? (
            <p className="text-gray-600">No guardians listed for this student.</p>
          ) : (
            <table style={{ width: '100%', fontSize: '1.05rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 8px', color: '#a6192e' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', color: '#a6192e' }}>Contact</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', color: '#a6192e' }}>Relation</th>
                </tr>
              </thead>
              <tbody>
                {guardians.map((g) => (
                  <tr key={g.id}>
                    <td style={{ padding: '10px 8px' }}>{g.guardian_name}</td>
                    <td style={{ padding: '10px 8px' }}>{g.guardian_contact}</td>
                    <td style={{ padding: '10px 8px' }}>{g.relation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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