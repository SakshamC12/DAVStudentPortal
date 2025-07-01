import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

interface Subject {
  id: number;
  subject_code: string;
  subject_name: string;
  credits: number;
  max_mark: number;
  pass_mark: number;
}

interface Mark {
  id: number;
  subject_id: number;
  marks_obtained: number;
  exam_date: string;
  semester: number;
  subject: Subject;
}

interface Student {
  id: number;
  student_id: string;
  name: string;
  department: string;
  year: number;
  semester: number;
}

const AdminMarks: React.FC = () => {
  const { student_id } = useParams<{ student_id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMark, setEditMark] = useState<Mark | null>(null);
  const [form, setForm] = useState({ subject_id: '', marks_obtained: '', exam_date: '', semester: '' });
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [addNewSubject, setAddNewSubject] = useState(false);
  const [newSubject, setNewSubject] = useState({
    subject_code: '',
    subject_name: '',
    credits: '',
    max_mark: '',
    pass_mark: '',
  });

  useEffect(() => {
    fetchStudentAndMarks();
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // eslint-disable-next-line
  }, [student_id, showForm]);

  const fetchStudentAndMarks = async () => {
    setLoading(true);
    setError('');
    // Fetch student
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('student_id', student_id)
      .single();
    if (studentError || !studentData) {
      setError('Failed to fetch student');
      setLoading(false);
      return;
    }
    setStudent(studentData);
    // Fetch marks with subject info
    const { data: marksData, error: marksError } = await supabase
      .from('marks')
      .select('*, subject:subjects(*)')
      .eq('student_id', studentData.id);
    if (marksError) {
      setError('Failed to fetch marks');
      setLoading(false);
      return;
    }
    setMarks(marksData || []);
    // Fetch subjects for student's department
    const { data: subjectsData, error: subjectsError } = await supabase
      .from('subjects')
      .select('*')
      .eq('department', studentData.department);
    if (subjectsError) {
      setError('Failed to fetch subjects');
      setLoading(false);
      return;
    }
    setSubjects(subjectsData || []);
    setLoading(false);
  };

  const handleAddClick = () => {
    setForm({ subject_id: '', marks_obtained: '', exam_date: '', semester: student ? String(student.semester) : '' });
    setFormMode('add');
    setShowForm(true);
    setEditMark(null);
  };

  const handleEditClick = (mark: Mark) => {
    setForm({
      subject_id: String(mark.subject_id),
      marks_obtained: String(mark.marks_obtained),
      exam_date: mark.exam_date ? mark.exam_date.substring(0, 10) : '',
      semester: String(mark.semester),
    });
    setFormMode('edit');
    setShowForm(true);
    setEditMark(mark);
  };

  const handleDelete = async (markId: number) => {
    if (!window.confirm('Are you sure you want to delete this mark entry?')) return;
    await supabase.from('marks').delete().eq('id', markId);
    fetchStudentAndMarks();
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.currentTarget;
    if (addNewSubject && name in newSubject) {
      setNewSubject({ ...newSubject, [name]: value });
    } else {
      setForm({ ...form, [name]: value });
      if (name === 'subject_id' && value === 'add_new') {
        setAddNewSubject(true);
      } else if (name === 'subject_id') {
        setAddNewSubject(false);
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    let subjectId = form.subject_id;
    if (addNewSubject) {
      // Insert new subject
      const { data: inserted, error: subErr } = await supabase.from('subjects').insert({
        subject_code: newSubject.subject_code,
        subject_name: newSubject.subject_name,
        credits: Number(newSubject.credits),
        max_mark: Number(newSubject.max_mark),
        pass_mark: Number(newSubject.pass_mark),
        department: student.department,
      }).select().single();
      if (subErr || !inserted) {
        setError('Failed to add new subject');
        return;
      }
      subjectId = inserted.id;
      await fetchStudentAndMarks(); // refresh subjects list
    }
    if (formMode === 'add') {
      await supabase.from('marks').insert({
        student_id: student.id,
        subject_id: Number(subjectId),
        marks_obtained: Number(form.marks_obtained),
        exam_date: form.exam_date,
        semester: Number(form.semester),
      });
    } else if (formMode === 'edit' && editMark) {
      await supabase.from('marks').update({
        subject_id: Number(subjectId),
        marks_obtained: Number(form.marks_obtained),
        exam_date: form.exam_date,
        semester: Number(form.semester),
      }).eq('id', editMark.id);
    }
    setShowForm(false);
    setAddNewSubject(false);
    setNewSubject({ subject_code: '', subject_name: '', credits: '', max_mark: '', pass_mark: '' });
    fetchStudentAndMarks();
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!student) return <div className="alert alert-error">Student not found</div>;

  return (
    <div className="py-8">
      <div className="card" style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
        <h1 className="text-2xl font-bold mb-4">Manage Marks for {student.name} ({student.student_id})</h1>
        <button className="btn mb-4" onClick={() => navigate(-1)}>Back</button>
        <button className="btn mb-4 ml-4" style={{ background: '#a6192e', color: '#fff' }} onClick={handleAddClick}>Add Mark</button>
        <div style={{ overflowX: 'auto' }}>
          <table className="marks-table" style={{ minWidth: 700, width: '100%' }}>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Semester</th>
                <th>Marks Obtained</th>
                <th>Exam Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {marks.map((mark) => (
                <tr key={mark.id}>
                  <td>{mark.subject ? `${mark.subject.subject_code} - ${mark.subject.subject_name}` : mark.subject_id}</td>
                  <td>{mark.semester}</td>
                  <td>{mark.marks_obtained}</td>
                  <td>{mark.exam_date ? new Date(mark.exam_date).toLocaleDateString() : '-'}</td>
                  <td>
                    <button className="btn btn-sm mr-2" style={{ background: '#f7e6e9', color: '#a6192e' }} onClick={() => handleEditClick(mark)}>Edit</button>
                    <button className="btn btn-sm" style={{ background: '#eee', color: '#a6192e' }} onClick={() => handleDelete(mark.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showForm && (
          <form ref={formRef} onSubmit={handleFormSubmit} className="card mt-6" style={{ maxWidth: 500, margin: '2rem auto 0 auto' }}>
            <h2 className="text-xl font-bold mb-4">{formMode === 'add' ? 'Add Mark' : 'Edit Mark'}</h2>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <select name="subject_id" className="form-input" value={addNewSubject ? 'add_new' : form.subject_id} onChange={handleFormChange} required>
                <option value="">Select Subject</option>
                {subjects.map(subj => (
                  <option key={subj.id} value={subj.id}>{subj.subject_code} - {subj.subject_name}</option>
                ))}
                <option value="add_new">Add New Subject</option>
              </select>
              {addNewSubject && (
                <div className="mt-4 p-2" style={{ background: '#f7e6e9', borderRadius: 8 }}>
                  <div className="form-group">
                    <label className="form-label">Subject Code</label>
                    <input type="text" name="subject_code" className="form-input" value={newSubject.subject_code} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject Name</label>
                    <input type="text" name="subject_name" className="form-input" value={newSubject.subject_name} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Credits</label>
                    <input type="number" name="credits" className="form-input" value={newSubject.credits} onChange={handleFormChange} required min={1} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Mark</label>
                    <input type="number" name="max_mark" className="form-input" value={newSubject.max_mark} onChange={handleFormChange} required min={1} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pass Mark</label>
                    <input type="number" name="pass_mark" className="form-input" value={newSubject.pass_mark} onChange={handleFormChange} required min={0} />
                  </div>
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Semester</label>
              <input type="number" name="semester" className="form-input" value={form.semester} onChange={handleFormChange} required min={1} max={student.semester} />
            </div>
            <div className="form-group">
              <label className="form-label">Marks Obtained</label>
              <input type="number" name="marks_obtained" className="form-input" value={form.marks_obtained} onChange={handleFormChange} required min={0} max={subjects.find(s => s.id === Number(form.subject_id))?.max_mark || 100} />
            </div>
            <div className="form-group">
              <label className="form-label">Exam Date</label>
              <input type="date" name="exam_date" className="form-input" value={form.exam_date} onChange={handleFormChange} required />
            </div>
            <button className="btn mt-4" type="submit" style={{ background: '#a6192e', color: '#fff' }}>{formMode === 'add' ? 'Add Mark' : 'Update Mark'}</button>
            <button className="btn btn-secondary mt-4 ml-4" type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminMarks; 