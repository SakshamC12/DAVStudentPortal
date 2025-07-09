import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import AdminLibrary from './AdminLibrary';
import AdminTermExams from './AdminTermExams';
import * as XLSX from 'xlsx';
import { LogOut } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'students' | 'library' | 'termexams'>('students');
  const [addTab, setAddTab] = useState<'manual' | 'bulk'>('manual');
  const [studentsToAdd, setStudentsToAdd] = useState<any[]>([{ student_id: '', name: '', email: '', department: '', year: '', semester: '', date_of_birth: '' }]);
  const [bulkStudents, setBulkStudents] = useState<any[]>([]);
  const [addError, setAddError] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const addFormRef = useRef<HTMLDivElement | null>(null);
  const [showStudentTemplate, setShowStudentTemplate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  useEffect(() => {
    if (showAddForm && addFormRef.current) {
      addFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showAddForm]);

  const handleAddRow = () => {
    setStudentsToAdd([...studentsToAdd, { student_id: '', name: '', email: '', department: '', year: '', semester: '', date_of_birth: '' }]);
  };

  const handleRemoveRow = (idx: number) => {
    setStudentsToAdd(studentsToAdd.filter((_, i) => i !== idx));
  };

  const handleCellChange = (idx: number, key: string, value: string) => {
    setStudentsToAdd(studentsToAdd.map((row, i) => i === idx ? { ...row, [key]: value } : row));
  };

  const handleSubmitAll = async () => {
    setAddLoading(true);
    setAddError('');
    try {
      const validRows = studentsToAdd.filter(s => s.student_id && s.name && s.email);
      if (validRows.length === 0) {
        setAddError('Please fill at least one valid student row.');
        setAddLoading(false);
        return;
      }
      const { error } = await supabase.from('students').insert(validRows);
      if (error) throw error;
      setStudentsToAdd([{ student_id: '', name: '', email: '', department: '', year: '', semester: '', date_of_birth: '' }]);
      setShowAddForm(false);
      const { data } = await supabase.from('students').select('*');
      setStudents(data || []);
    } catch (err: any) {
      setAddError('Failed to add students: ' + err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleBulkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array((evt.target as FileReader).result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const [headers, ...rows] = json;
      const students = rows.map((row: any) => ({
        student_id: row[0],
        name: row[1],
        email: row[2],
        department: row[3],
        year: row[4],
        semester: row[5],
        date_of_birth: row[6],
      })).filter(s => s.student_id && s.name && s.email);
      setBulkStudents(students);
      setBulkError('');
    };
    reader.readAsArrayBuffer(file);
  };

  const handleRemoveBulkRow = (idx: number) => {
    setBulkStudents(bulkStudents.filter((_, i) => i !== idx));
  };

  const handleBulkCellChange = (idx: number, key: string, value: string) => {
    setBulkStudents(bulkStudents.map((row, i) => i === idx ? { ...row, [key]: value } : row));
  };

  const handleBulkSubmit = async () => {
    setBulkLoading(true);
    setBulkError('');
    try {
      const { error } = await supabase.from('students').insert(bulkStudents);
      if (error) throw error;
      setBulkStudents([]);
      setShowAddForm(false);
      const { data } = await supabase.from('students').select('*');
      setStudents(data || []);
    } catch (err: any) {
      setBulkError('Failed to add students: ' + err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="py-8">
      <div className="card" style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem', position: 'relative' }}>
        <div className="admin-logout-wrapper">
          <button
            className="btn admin-logout-btn"
            onClick={onLogout}
            onMouseOver={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#fff';
              (e.currentTarget as HTMLButtonElement).style.color = '#a6192e';
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#a6192e';
              (e.currentTarget as HTMLButtonElement).style.color = '#fff';
            }}
            style={{
              background: '#a6192e',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1.1rem',
              borderRadius: 8,
              border: '2px solid #a6192e',
              padding: '0.75rem 2.5rem',
              transition: 'all 0.2s',
              cursor: 'pointer',
              zIndex: 20
            }}
          >
            Logout
          </button>
        </div>
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #eee' }}>
          <button
            onClick={() => setActiveTab('students')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: activeTab === 'students' ? '#a6192e' : 'transparent',
              color: activeTab === 'students' ? '#fff' : '#333',
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: activeTab === 'students' ? '2px solid #a6192e' : '2px solid transparent',
            }}
          >
            Student Management
          </button>
          <button
            onClick={() => setActiveTab('library')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: activeTab === 'library' ? '#a6192e' : 'transparent',
              color: activeTab === 'library' ? '#fff' : '#333',
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: activeTab === 'library' ? '2px solid #a6192e' : '2px solid transparent',
            }}
          >
            Library Management
          </button>
          <button
            onClick={() => setActiveTab('termexams')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: activeTab === 'termexams' ? '#a6192e' : 'transparent',
              color: activeTab === 'termexams' ? '#fff' : '#333',
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: activeTab === 'termexams' ? '2px solid #a6192e' : '2px solid transparent',
            }}
          >
            Term Exam Management
          </button>
        </div>
        
        
        {activeTab === 'students' && (
          <>
            {/* Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Search by Student ID or Name"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ minWidth: 320, maxWidth: 400, border: '1px solid #a6192e', borderRadius: 8, padding: '0.5rem 1rem', fontSize: 16 }}
              />
            </div>
            {loading ? (
              <div>Loading students...</div>
            ) : error ? (
              <div className="alert alert-error mb-4 text-red-600 text-sm text-center">{error}</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="marks-table" style={{ minWidth: 900, width: '100%' }}>
                  <thead>
                    <tr>
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
                    {students
                      .filter(student =>
                        student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        student.name.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((student) => (
                      <tr key={student.id} style={{ borderBottom: '1px solid #eee' }}>
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
                            <button
                              className="btn btn-sm"
                              style={{ background: '#ef4444', color: '#fff' }}
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to delete this student? This will remove all related data.')) {
                                  const { error } = await supabase.from('students').delete().eq('id', student.id);
                                  if (!error) {
                                    // Remove student from the current state
                                    setStudents(prev => prev.filter(s => s.id !== student.id));
                                  } else {
                                    alert('Failed to delete student.');
                                  }
                                }
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!showAddForm && (
              <button className="btn mt-4" style={{ background: '#a6192e', color: '#fff' }} onClick={() => setShowAddForm(true)}>
                Add Student
              </button>
            )}
            {showAddForm && (
              <div ref={addFormRef} className="card mb-6" style={{ maxWidth: 900, margin: '2rem auto', background: '#f7e6e9', position: 'relative' }}>
                <button className="btn mb-4" style={{ background: '#6b7280', color: '#fff', float: 'right' }} onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: 24, alignItems: 'center' }}>
                  <button
                    className="btn"
                    style={{ background: addTab === 'manual' ? '#a6192e' : '#fff', color: addTab === 'manual' ? '#fff' : '#a6192e', border: '2px solid #a6192e', fontWeight: 700, borderRadius: 8, padding: '0.5rem 1.5rem' }}
                    onClick={() => setAddTab('manual')}
                  >
                    Manual Entry
                  </button>
                  <button
                    className="btn"
                    style={{ background: addTab === 'bulk' ? '#a6192e' : '#fff', color: addTab === 'bulk' ? '#fff' : '#a6192e', border: '2px solid #a6192e', fontWeight: 700, borderRadius: 8, padding: '0.5rem 1.5rem' }}
                    onClick={() => setAddTab('bulk')}
                  >
                    Bulk Upload
                  </button>
                  {addTab === 'bulk' && (
                    <button
                      className="btn"
                      style={{ background: '#fff', color: '#a6192e', border: '2px solid #a6192e', fontWeight: 700, borderRadius: 8, padding: '0.5rem 1.5rem', marginLeft: 8 }}
                      onClick={() => setShowStudentTemplate(true)}
                    >
                      Example Template
                    </button>
                  )}
                </div>
                {addTab === 'manual' && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Add Students</h2>
                    {addError && <div className="alert alert-error mb-2">{addError}</div>}
                    <div style={{ overflowX: 'auto', marginTop: 16 }}>
                      <table className="marks-table" style={{ minWidth: 900, width: '100%' }}>
                        <thead>
                          <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>Year</th>
                            <th>Semester</th>
                            <th>Date of Birth</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentsToAdd.map((row, idx) => (
                            <tr key={idx}>
                              {['student_id', 'name', 'email', 'department', 'year', 'semester', 'date_of_birth'].map((key) => (
                                <td key={key}>
                                  <input
                                    type={key === 'year' || key === 'semester' ? 'number' : key === 'date_of_birth' ? 'date' : 'text'}
                                    value={row[key] || ''}
                                    onChange={e => handleCellChange(idx, key, (e.target as HTMLInputElement).value)}
                                    className="form-input"
                                    style={{ minWidth: 100 }}
                                  />
                                </td>
                              ))}
                              <td>
                                <button className="btn btn-sm" style={{ background: '#ef4444', color: '#fff' }} onClick={() => handleRemoveRow(idx)} type="button" disabled={studentsToAdd.length === 1}>Remove</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button className="btn mt-4" style={{ background: '#a6192e', color: '#fff' }} onClick={handleAddRow} type="button">Add Another</button>
                      <button className="btn mt-4" style={{ background: '#a6192e', color: '#fff', marginLeft: 16 }} onClick={handleSubmitAll} disabled={addLoading}>
                        {addLoading ? 'Submitting...' : 'Submit All'}
                      </button>
                    </div>
                  </div>
                )}
                {addTab === 'bulk' && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Bulk Upload Students</h2>
                    {bulkError && <div className="alert alert-error mb-2">{bulkError}</div>}
                    <input type="file" accept=".xlsx,.csv" onChange={handleBulkFileUpload} className="form-input mb-4" />
                    {showStudentTemplate && (
                      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1001, background: '#fff', borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.2)', padding: 40, maxWidth: 950 }}>
                        <button
                          className="btn btn-sm"
                          style={{ position: 'absolute', top: 20, right: 20, background: '#6b7280', color: '#fff', padding: '8px 24px', fontSize: 20 }}
                          onClick={() => setShowStudentTemplate(false)}
                        >
                          Close
                        </button>
                        <h3 className="text-lg font-bold mb-4" style={{ marginTop: 8 }}>Student Bulk Upload Example</h3>
                        <div style={{ overflowX: 'auto', marginBottom: 20 }}>
                          <table className="marks-table" style={{ minWidth: 1000, width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                            <thead>
                              <tr>
                                <th style={{ padding: '12px 18px', minWidth: 120, whiteSpace: 'nowrap' }}>Student ID</th>
                                <th style={{ padding: '12px 18px', minWidth: 160 }}>Name</th>
                                <th style={{ padding: '12px 18px', minWidth: 220 }}>Email</th>
                                <th style={{ padding: '12px 18px', minWidth: 160 }}>Department</th>
                                <th style={{ padding: '12px 18px', minWidth: 60 }}>Year</th>
                                <th style={{ padding: '12px 18px', minWidth: 90 }}>Semester</th>
                                <th style={{ padding: '12px 18px', minWidth: 120, whiteSpace: 'nowrap' }}>Date of Birth</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td style={{ padding: '10px 16px', minWidth: 120, whiteSpace: 'nowrap' }}>DAV2024001</td>
                                <td style={{ padding: '10px 16px', minWidth: 160 }}>Saksham Chaturvedi</td>
                                <td style={{ padding: '10px 16px', minWidth: 220 }}>saksham.c@davcollege.edu</td>
                                <td style={{ padding: '10px 16px', minWidth: 160 }}>Computer Science</td>
                                <td style={{ padding: '10px 16px', minWidth: 60 }}>2</td>
                                <td style={{ padding: '10px 16px', minWidth: 90 }}>4</td>
                                <td style={{ padding: '10px 16px', minWidth: 120, whiteSpace: 'nowrap' }}>2005-03-12</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div style={{ display: 'flex', gap: 20, marginTop: 16, justifyContent: 'center' }}>
                          <a
                            href="https://gfqexgwydnfhntearstw.supabase.co/storage/v1/object/public/templated//student_template.xlsx"
                            download
                            className="btn"
                            style={{ background: '#a6192e', color: '#fff', fontWeight: 700, fontSize: 18, padding: '16px 32px', borderRadius: 8 }}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Download Example Excel File
                          </a>
                          <a
                            href="https://gfqexgwydnfhntearstw.supabase.co/storage/v1/object/public/templated//student_template.xlsx"
                            className="btn"
                            style={{ background: '#fff', color: '#a6192e', border: '2px solid #a6192e', fontWeight: 700, fontSize: 18, padding: '16px 32px', borderRadius: 8 }}
                            onClick={e => {
                              e.preventDefault();
                              window.open('https://gfqexgwydnfhntearstw.supabase.co/storage/v1/object/public/templated//student_template.xlsx', '_blank');
                            }}
                          >
                            View Example Excel File
                          </a>
                        </div>
                      </div>
                    )}
                    {bulkStudents.length > 0 && (
                      <div style={{ overflowX: 'auto', marginTop: 16 }}>
                        <table className="marks-table" style={{ minWidth: 900, width: '100%' }}>
                          <thead>
                            <tr>
                              <th>Student ID</th>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Department</th>
                              <th>Year</th>
                              <th>Semester</th>
                              <th>Date of Birth</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bulkStudents.map((row, idx) => (
                              <tr key={idx}>
                                {['student_id', 'name', 'email', 'department', 'year', 'semester', 'date_of_birth'].map((key) => (
                                  <td key={key}>
                                    <input
                                      type={key === 'year' || key === 'semester' ? 'number' : key === 'date_of_birth' ? 'date' : 'text'}
                                      value={row[key] || ''}
                                      onChange={e => handleBulkCellChange(idx, key, (e.target as HTMLInputElement).value)}
                                      className="form-input"
                                      style={{ minWidth: 100 }}
                                    />
                                  </td>
                                ))}
                                <td>
                                  <button className="btn btn-sm" style={{ background: '#ef4444', color: '#fff' }} onClick={() => handleRemoveBulkRow(idx)} type="button">Remove</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <button className="btn mt-4" style={{ background: '#a6192e', color: '#fff' }} onClick={handleBulkSubmit} disabled={bulkLoading}>
                          {bulkLoading ? 'Submitting...' : 'Submit All'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'library' && (
          <AdminLibrary />
        )}

        {activeTab === 'termexams' && (
          <AdminTermExams />
        )}
      </div>
      <style>{`
        @media (max-width: 700px) {
          .admin-logout-wrapper {
            position: absolute;
            top: -56px;
            left: 0;
            width: 100%;
            display: flex;
            justify-content: center;
            z-index: 20;
          }
          .admin-logout-btn {
            margin: 0 auto;
            display: block;
          }
          .card {
            margin-top: 2.5rem !important;
          }
        }
        @media (min-width: 701px) {
          .admin-logout-wrapper {
            position: absolute;
            top: 32px;
            right: 32px;
            left: auto;
            width: auto;
            display: flex;
            justify-content: flex-end;
            z-index: 2;
          }
          .admin-logout-btn {
            margin: 0;
          }
          .card {
            margin-top: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPage; 