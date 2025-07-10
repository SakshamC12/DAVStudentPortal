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
  const [activeTab, setActiveTab] = useState<'students' | 'library' | 'termexams'>(() => {
    const savedTab = localStorage.getItem('adminActiveTab');
    if (savedTab === 'students' || savedTab === 'library' || savedTab === 'termexams') {
      return savedTab;
    }
    return 'students';
  });
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
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // 1. Add a utility to detect mobile view:
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 700;

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

  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);

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

  const handleDeleteSelected = () => {
    if (!selectedStudents.length) return;
    setShowDeleteModal(true);
  };

  const confirmDeleteSelected = async () => {
    setDeleteLoading(true);
    try {
      const { error } = await supabase.from('students').delete().in('id', selectedStudents);
      if (error) throw error;
      setStudents(prev => prev.filter(s => !selectedStudents.includes(s.id)));
      setSelectedStudents([]);
      setDeleteMode(false);
      setShowDeleteModal(false);
    } catch (err) {
      alert('Failed to delete selected students.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="py-8">
      <div className="card" style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem', position: 'relative' }}>
        <button
          className="btn admin-logout-btn"
          onClick={onLogout}
          aria-label="Logout"
          style={{ position: 'absolute', top: 16, right: 16, zIndex: 100, fontSize: 28, background: 'transparent', border: 'none', color: '#a6192e', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <LogOut />
          <span className="logout-text" style={{ marginLeft: 8, fontSize: 18, fontWeight: 600 }}>Logout</span>
        </button>
        <div className="admin-header-row">
          <h1 className="text-2xl font-bold mb-4" style={{ margin: 0 }}>Admin Dashboard</h1>
        </div>
        <div className="admin-tabs-scrollable">
          {/* Main admin dashboard tabs */}
          {/* Replace static tab row with a horizontally scrollable flex row on mobile */}
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
        </div>
        
        
        {activeTab === 'students' && (
          <>
            {/* Delete Multiple Button - always visible above search bar and table */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', marginBottom: 24 }}>
              {!deleteMode ? (
                <button
                  className="btn"
                  style={{ background: '#a6192e', color: '#fff', fontWeight: 600, borderRadius: 8, padding: '0.5rem 1.5rem', fontSize: 16, boxShadow: '0 2px 8px #f3eaea', marginRight: 12 }}
                  onClick={() => setDeleteMode(true)}
                >
                  Delete Multiple
                </button>
              ) : (
                <>
                  <button
                    className="btn"
                    style={{ background: '#ef4444', color: '#fff', fontWeight: 600, borderRadius: 8, padding: '0.5rem 1.5rem', fontSize: 16, boxShadow: '0 2px 8px #f3eaea', marginRight: 12 }}
                    onClick={() => setDeleteMode(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn"
                    style={{ background: selectedStudents.length ? '#a6192e' : '#ccc', color: '#fff', fontWeight: 600, borderRadius: 8, padding: '0.5rem 1.5rem', fontSize: 16, boxShadow: '0 2px 8px #f3eaea' }}
                    disabled={!selectedStudents.length || deleteLoading}
                    onClick={handleDeleteSelected}
                  >
                    {deleteLoading ? 'Deleting...' : `Delete Selected (${selectedStudents.length})`}
                  </button>
                </>
              )}
            </div>
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
                      {deleteMode && <th></th>}
                      <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Student ID</th>
                      <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Name</th>
                      <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Email</th>
                      <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Department</th>
                      <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Year</th>
                      <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Semester</th>
                      <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Date of Birth</th>
                      <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Profile</th>
                      <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Actions</th>
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
                          {deleteMode && (
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedStudents.includes(student.id)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedStudents(prev => [...prev, student.id]);
                                  } else {
                                    setSelectedStudents(prev => prev.filter(id => id !== student.id));
                                  }
                                }}
                              />
                            </td>
                          )}
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
                                onClick={() => setStudentToDelete(student)}
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
                {isMobile ? (
                  <button
                    className="btn"
                    style={{ position: 'absolute', top: 12, right: 16, background: 'transparent', color: '#a6192e', fontSize: 28, border: 'none', zIndex: 2, padding: 0, minWidth: 36, minHeight: 36, lineHeight: 1 }}
                    aria-label="Close"
                    onClick={() => setShowAddForm(false)}
                  >
                    ×
                  </button>
                ) : (
                  <button className="btn mb-4" style={{ background: '#6b7280', color: '#fff', float: 'right' }} onClick={() => setShowAddForm(false)}>
                    Cancel
                  </button>
                )}
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
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(2px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.2)', padding: 40, minWidth: 320, maxWidth: '90vw', textAlign: 'center' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Confirm Deletion</h2>
            <div style={{ marginBottom: 24 }}>Are you sure you want to delete {selectedStudents.length} entr{selectedStudents.length === 1 ? 'y' : 'ies'}?</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              <button
                className="btn"
                style={{ background: '#6b7280', color: '#fff', fontWeight: 600, borderRadius: 8, padding: '0.5rem 1.5rem', minWidth: 100 }}
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className="btn"
                style={{ background: '#a6192e', color: '#fff', fontWeight: 600, borderRadius: 8, padding: '0.5rem 1.5rem', minWidth: 100 }}
                onClick={confirmDeleteSelected}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      {studentToDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 320, boxShadow: '0 4px 32px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>Delete Student</h3>
            <p style={{ marginBottom: 24 }}>Are you sure you want to delete <b>{studentToDelete.name}</b>? This will remove all related data.</p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
              <button
                className="btn"
                style={{ background: '#6b7280', color: '#fff', minWidth: 90 }}
                onClick={() => setStudentToDelete(null)}
              >
                Cancel
              </button>
              <button
                className="btn"
                style={{ background: '#ef4444', color: '#fff', minWidth: 90 }}
                onClick={async () => {
                  const { error } = await supabase.from('students').delete().eq('id', studentToDelete.id);
                  if (!error) {
                    setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
                  } else {
                    alert('Failed to delete student.');
                  }
                  setStudentToDelete(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @media (max-width: 700px) {
          .admin-dashboard, .card {
            width: 100vw !important;
            max-width: 100vw !important;
            min-width: 0 !important;
            box-sizing: border-box;
            margin: 0 auto !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .admin-header-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100vw;
            margin-bottom: 1rem;
            padding: 0 1rem;
            box-sizing: border-box;
            position: relative;
          }
          .admin-logout-btn {
            position: absolute;
            top: 0.5rem;
            right: 1rem;
            z-index: 100;
            font-size: 28px !important;
            padding: 0.25rem 0.5rem !important;
            background: transparent !important;
            border: none !important;
            color: #a6192e !important;
            box-shadow: none !important;
            border-radius: 50% !important;
            min-width: 0 !important;
            min-height: 0 !important;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .admin-logout-btn:active {
            background: #f3eaea !important;
          }
          .admin-tabs-scrollable {
            overflow-x: auto;
            white-space: nowrap;
            width: 100vw;
            margin-bottom: 1rem;
            box-sizing: border-box;
            padding: 0 1rem;
          }
          .admin-tabs-scrollable .tab-btn {
            display: inline-block;
            min-width: 120px;
            width: auto;
            margin-right: 0.5rem;
            font-size: 1rem;
            box-sizing: border-box;
          }
          .admin-dashboard .search-bar, .card .search-bar, .form-input[type='text'] {
            width: 100vw !important;
            min-width: 0 !important;
            margin-bottom: 1rem !important;
            box-sizing: border-box;
            padding: 0 1rem;
          }
          .marks-table, .admin-dashboard table {
            min-width: 600px !important;
            width: 100vw !important;
          }
          .table-responsive, .admin-dashboard .table-responsive {
            overflow-x: auto !important;
            max-width: 100vw !important;
          }
          .tab-btn, .admin-dashboard .tab-btn {
            width: auto;
            min-width: 120px;
            box-sizing: border-box;
            font-size: 1rem;
          }
          .mobile-x-btn { display: none !important; }
          .desktop-cancel-btn { display: block !important; }
        }
        @media (min-width: 701px) {
          .admin-header-row {
            margin-bottom: 2rem;
            padding: 0;
            align-items: flex-end;
            position: relative;
          }
          .admin-header-row h1 {
            margin-bottom: 0;
            margin-top: 0.5rem;
            width: 100%;
            text-align: left;
            margin-right: 2.5rem;
          }
          .admin-logout-btn {
            position: absolute;
            top: 0;
            right: 0;
            z-index: 100;
            font-size: 28px !important;
            background: transparent !important;
            border: none !important;
            color: #a6192e !important;
            box-shadow: none !important;
            border-radius: 50% !important;
            min-width: 0 !important;
            min-height: 0 !important;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
        .admin-logout-btn {
          position: absolute !important;
          top: 16px !important;
          right: 16px !important;
          z-index: 100 !important;
          font-size: 28px !important;
          background: transparent !important;
          border: none !important;
          color: #a6192e !important;
          box-shadow: none !important;
          border-radius: 50% !important;
          min-width: 0 !important;
          min-height: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .logout-text {
          display: none;
        }
        @media (min-width: 701px) {
          .logout-text {
            display: inline;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPage; 