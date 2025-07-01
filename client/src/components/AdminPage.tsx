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
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    student_id: '',
    name: '',
    email: '',
    department: '',
    year: '',
    semester: '',
    date_of_birth: '',
  });
  const [addError, setAddError] = useState('');

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

  const handleAddFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setAddForm({ ...addForm, [target.name]: target.value });
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    // Basic validation
    if (!addForm.student_id || !addForm.name || !addForm.email || !addForm.department || !addForm.year || !addForm.semester || !addForm.date_of_birth) {
      setAddError('Please fill all fields');
      return;
    }
    const { error } = await supabase.from('students').insert({
      student_id: addForm.student_id,
      name: addForm.name,
      email: addForm.email,
      department: addForm.department,
      year: Number(addForm.year),
      semester: Number(addForm.semester),
      date_of_birth: addForm.date_of_birth,
    });
    if (error) {
      setAddError('Failed to add student: ' + error.message);
      return;
    }
    setShowAddForm(false);
    setAddForm({ student_id: '', name: '', email: '', department: '', year: '', semester: '', date_of_birth: '' });
    // Refresh students
    const { data } = await supabase.from('students').select('*');
    setStudents(data || []);
  };

  return (
    <div className="py-8">
      <div className="card" style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <button className="btn btn-danger mb-4" onClick={onLogout}>Logout</button>
        <button className="btn mb-4 ml-4" style={{ background: '#a6192e', color: '#fff' }} onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : 'Add Student'}
        </button>
        {showAddForm && (
          <form onSubmit={handleAddStudent} className="card mb-6" style={{ maxWidth: 600, margin: '2rem auto', background: '#f7e6e9' }}>
            <h2 className="text-xl font-bold mb-4">Add New Student</h2>
            {addError && <div className="alert alert-error mb-2">{addError}</div>}
            <div className="form-group">
              <label className="form-label">Student ID</label>
              <input type="text" name="student_id" className="form-input" value={addForm.student_id} onChange={handleAddFormChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input type="text" name="name" className="form-input" value={addForm.name} onChange={handleAddFormChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" name="email" className="form-input" value={addForm.email} onChange={handleAddFormChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input type="text" name="department" className="form-input" value={addForm.department} onChange={handleAddFormChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Year</label>
              <input type="number" name="year" className="form-input" value={addForm.year} onChange={handleAddFormChange} required min={1} />
            </div>
            <div className="form-group">
              <label className="form-label">Semester</label>
              <input type="number" name="semester" className="form-input" value={addForm.semester} onChange={handleAddFormChange} required min={1} />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input type="date" name="date_of_birth" className="form-input" value={addForm.date_of_birth} onChange={handleAddFormChange} required />
            </div>
            <button className="btn mt-4" type="submit" style={{ background: '#a6192e', color: '#fff' }}>Add Student</button>
          </form>
        )}
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