import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

interface AdminPageProps {
  adminUser: any;
  onLogout: () => void;
}

interface Student {
  id: number;
  student_id: string;
  name: string;
  email: string;
  department: string;
  year: number;
  semester: number;
  date_of_birth: string;
  pfp_url?: string;
}

const AdminPage: React.FC<AdminPageProps> = ({ adminUser, onLogout }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError('');
      const { data, error } = await supabase.from('students').select('*');
      if (error) {
        setError('Failed to fetch students');
      } else {
        setStudents(data || []);
      }
      setLoading(false);
    };
    fetchStudents();
  }, []);

  return (
    <div className="py-8">
      <div className="card" style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <button className="btn btn-danger mb-4" onClick={onLogout}>Logout</button>
        {loading ? (
          <div>Loading students...</div>
        ) : error ? (
          <div className="alert alert-error mb-4 text-red-600 text-sm text-center">{error}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="marks-table" style={{ minWidth: 900, width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>ID</th>
                  <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Student ID</th>
                  <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Name</th>
                  <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Email</th>
                  <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Department</th>
                  <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Year</th>
                  <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Semester</th>
                  <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Date of Birth</th>
                  <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Profile</th>
                  <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Marks</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{student.id}</td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{student.student_id}</td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{student.name}</td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{student.email}</td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{student.department}</td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{student.year}</td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{student.semester}</td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{student.date_of_birth}</td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      {student.pfp_url ? (
                        <img src={student.pfp_url} alt="pfp" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link to={`/admin/profile/${student.student_id}`} className="btn btn-sm" style={{ background: '#a6192e', color: '#fff' }}>View Profile</Link>
                        <Link to={`/admin/marks/${student.student_id}`} className="btn btn-sm" style={{ background: '#a6192e', color: '#fff' }}>View Marks</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage; 