import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

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
                  <th>ID</th>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Year</th>
                  <th>Semester</th>
                  <th>Date of Birth</th>
                  <th>Profile</th>
                  <th>Marks</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.id}</td>
                    <td>{student.student_id}</td>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>{student.department}</td>
                    <td>{student.year}</td>
                    <td>{student.semester}</td>
                    <td>{student.date_of_birth}</td>
                    <td>
                      {student.pfp_url ? (
                        <img src={student.pfp_url} alt="pfp" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>
                      <a href={`/admin/profile/${student.student_id}`} className="btn btn-sm" style={{ background: '#a6192e', color: '#fff', marginRight: 4 }}>View Profile</a>
                    </td>
                    <td>
                      <a href={`/admin/marks/${student.student_id}`} className="btn btn-sm" style={{ background: '#a6192e', color: '#fff' }}>View Marks</a>
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