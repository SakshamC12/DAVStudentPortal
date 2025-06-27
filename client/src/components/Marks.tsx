import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BookOpen, TrendingUp, Calendar } from 'lucide-react';

interface Student {
  id: number;
  studentId: string;
  name: string;
  email: string;
  department: string;
  year: number;
  dateOfBirth: string;
}

interface MarkDisplay {
  subject_code: string;
  subject_name: string;
  credits: number;
  max_mark: number;
  pass_mark: number;
  marks_obtained: number;
  exam_date: string;
  grade: string;
  result: string;
  semester?: number; // Optional, if you want to group by semester
}

interface MarksProps {
  student: Student;
}

const Marks: React.FC<MarksProps> = ({ student }) => {
  const [marks, setMarks] = useState<MarkDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMarks();
    // eslint-disable-next-line
  }, []);

  const fetchMarks = async () => {
    try {
      const { data: marks, error } = await supabase
        .from('student_marks_display')
        .select('*')
        .eq('student_id', student.studentId);
      if (error) {
        setError('Failed to fetch marks');
      } else {
        setMarks(marks || []);
      }
    } catch (err: any) {
      setError('Failed to fetch marks');
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
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Academic Performance Card with header */}
      <div className="card" style={{ padding: 0, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ background: '#a6192e', color: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: '1.5rem 2rem 1rem 2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 0 }}>Academic Performance</h1>
          <p style={{ fontSize: '1.1rem', marginTop: 4, opacity: 0.95 }}>View your marks, grades, and pass/fail status for all subjects</p>
        </div>
        {/* Student Info Section */}
        <div style={{ padding: '1.5rem 2rem 0.5rem 2rem', borderBottom: '1px solid #eee', background: '#faf6f6', display: 'flex', gap: '2.5rem', fontSize: '1.1rem', fontWeight: 500 }}>
          <div><span style={{ color: '#a6192e', fontWeight: 700 }}>Student ID:</span> {student.studentId}</div>
          <div><span style={{ color: '#a6192e', fontWeight: 700 }}>Name:</span> {student.name}</div>
          <div><span style={{ color: '#a6192e', fontWeight: 700 }}>Department:</span> {student.department}</div>
        </div>
        <div style={{ padding: '2rem' }}>
          {marks.length === 0 ? (
            <div className="card text-center">
              <BookOpen size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No Marks Available</h3>
              <p className="text-gray-600">Your marks will appear here once they are published by your department.</p>
            </div>
          ) : (
            <div className="card overflow-x-auto" style={{ boxShadow: 'none', margin: 0, padding: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>Course Code</th>
                    <th>Subject Name</th>
                    <th>Credits</th>
                    <th>Max Mark</th>
                    <th>Pass Mark</th>
                    <th>Marks Obtained</th>
                    <th>Exam Date</th>
                    <th>Grade</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.map((mark, idx) => (
                    <tr key={mark.subject_code}>
                      <td>{idx + 1}</td>
                      <td>{mark.subject_code}</td>
                      <td>{mark.subject_name}</td>
                      <td>{mark.credits}</td>
                      <td>{mark.max_mark}</td>
                      <td>{mark.pass_mark}</td>
                      <td>{mark.marks_obtained}</td>
                      <td>{mark.exam_date ? new Date(mark.exam_date).toLocaleDateString() : '-'}</td>
                      <td>
                        <span className={`badge ${mark.grade === 'A' ? 'badge-success' : mark.grade === 'B' ? 'badge-warning' : mark.grade === 'C' ? 'badge-warning' : mark.grade === 'F' ? 'badge-danger' : ''}`}>{mark.grade}</span>
                      </td>
                      <td>
                        <span className={`badge ${mark.result === 'PASS' ? 'badge-success' : 'badge-danger'}`}>{mark.result}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Made by Card */}
      <div className="card" style={{ textAlign: 'center', padding: '2rem', marginTop: '2rem' }}>
        <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Made by Saksham Chaturvedi.</span>
      </div>
    </div>
  );
};

export default Marks; 