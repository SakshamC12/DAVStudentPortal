import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BookOpen, TrendingUp, Calendar, Filter } from 'lucide-react';

interface Student {
  id: number;
  studentId: string;
  name: string;
  email: string;
  department: string;
  year: number;
  dateOfBirth: string;
  semester: number;
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
  semester: number;
}

interface MarksProps {
  student: Student;
  adminView?: boolean;
}

const Marks: React.FC<MarksProps> = ({ student, adminView }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'final' | 'term'>('final');

  // State for term exams
  const [termExams, setTermExams] = useState<any[]>([]);
  const [termExamMarks, setTermExamMarks] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [termLoading, setTermLoading] = useState(true);
  const [termError, setTermError] = useState('');

  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Add a filter by semester dropdown to the term exam tab
  // 1. Compute available semesters from termExamMarks
  const getAvailableTermSemesters = () => {
    const semesters = [...new Set(termExamMarks.map(mark => mark.semester))].sort((a, b) => a - b);
    return semesters;
  };
  // 2. Add state for selectedTermSemester
  const [selectedTermSemester, setSelectedTermSemester] = useState<string>('all');
  // 3. Filter termExams based on whether they have marks in the selected semester
  const filteredTermExams = selectedTermSemester === 'all' ? termExams : termExams.filter(exam =>
    termExamMarks.some(mark => mark.exam_id === exam.id && String(mark.semester) === selectedTermSemester)
  );

  // 1. Compute available subject semesters from subjects
  const getAvailableSubjectSemesters = () => {
    const semesters = [...new Set(subjects.map(sub => sub.semester))].sort((a, b) => a - b);
    return semesters;
  };
  // 2. Add state for selectedSubjectSemester
  const [selectedSubjectSemester, setSelectedSubjectSemester] = useState<string>('all');
  // 3. Filter subjects by selectedSubjectSemester
  const filteredSubjects = selectedSubjectSemester === 'all' ? subjects : subjects.filter(sub => String(sub.semester) === selectedSubjectSemester);

  const [expandedSubjectId, setExpandedSubjectId] = useState<string | number | null>(null);

  useEffect(() => {
    fetchSubjects();
    fetchTermData(); // Fetch term exam data on initial load
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    // filterMarksBySemester(); // No longer needed
    // eslint-disable-next-line
  }, [subjects, selectedSubjectSemester]); // Depend on subjects and selectedSubjectSemester

  // Remove fetchTermData from the useEffect that depends on activeTab

  const fetchSubjects = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: subs, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('department', student.department)
        .order('subject_code');
      if (error) throw error;
      setSubjects(subs || []);
    } catch (err: any) {
      setError('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchTermData = async () => {
    setTermLoading(true);
    setTermError('');
    try {
      // Fetch all term exam templates
      const { data: exams, error: examsError } = await supabase
        .from('term_exams')
        .select('*')
        .order('exam_name', { ascending: true });
      if (examsError) throw examsError;
      setTermExams(exams || []);

      // Fetch all term exam marks for the student
      const { data: marks, error: marksError } = await supabase
        .from('term_exam_marks')
        .select('*')
        .eq('student_id', student.studentId);
      if (marksError) throw marksError;
      setTermExamMarks(marks || []);
    } catch (err) {
      setTermError('Failed to fetch term exam data');
    } finally {
      setTermLoading(false);
    }
  };

  // Helper to get mark for a subject/exam
  const getTermMark = (subjectId: string, examId: string) => {
    const mark = termExamMarks.find(
      (m) => m.subject_id === subjectId && m.exam_id === examId
    );
    return mark ? mark.marks_obtained : '-';
  };

  // Helper to calculate total (normalized to 100)
  const getNormalizedTotal = (subjectId: string) => {
    let total = 0;
    let totalWeight = 0;
    termExams.forEach((exam) => {
      const mark = termExamMarks.find(
        (m) => m.subject_id === subjectId && m.exam_id === exam.id
      );
      if (mark) {
        total += (mark.marks_obtained / exam.max_mark) * exam.weight;
        totalWeight += exam.weight;
      }
    });
    // Normalize to 100
    return totalWeight > 0 ? ((total / totalWeight) * 100).toFixed(2) : '-';
  };

  // Helper to get grade (reuse existing logic or simple mapping)
  const getGrade = (normalized: number) => {
    if (normalized >= 85) return 'A';
    if (normalized >= 70) return 'B';
    if (normalized >= 50) return 'C';
    return 'F';
  };

  // Helper to get breakdown for a subject
  const getBreakdownRows = (subjectId: string) => {
    return termExams.map((exam) => {
      const mark = termExamMarks.find(
        (m) => m.subject_id === subjectId && m.exam_id === exam.id
      );
      const contribution = mark ? ((mark.marks_obtained / exam.max_mark) * exam.weight) : 0;
      return {
        exam_name: exam.exam_name,
        exam_date: mark ? mark.exam_date : null,
        max_mark: exam.max_mark,
        weight: exam.weight,
        marks_obtained: mark ? mark.marks_obtained : '-',
        contribution: mark ? contribution.toFixed(2) : '-',
      };
    });
  };

  // Format exam name for display: "Name(Max mark, weight)"
  const formatExamName = (exam: any) => {
    return `${exam.exam_name}(${exam.max_mark},${exam.weight})`;
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
      {/* Tabs */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          className={`tab-btn ${activeTab === 'final' ? 'active' : ''}`}
          onClick={() => setActiveTab('final')}
          style={{
            marginRight: 16,
            background: activeTab === 'final' ? '#a6192e' : '#fff',
            color: activeTab === 'final' ? '#fff' : '#a6192e',
            border: '2px solid #a6192e',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: '1.1rem',
            padding: '0.75rem 2rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: activeTab === 'final' ? '0 2px 8px rgba(166,25,46,0.08)' : 'none'
          }}
        >
          Final Marks
        </button>
        <button
          className={`tab-btn ${activeTab === 'term' ? 'active' : ''}`}
          onClick={() => setActiveTab('term')}
          style={{
            background: activeTab === 'term' ? '#a6192e' : '#fff',
            color: activeTab === 'term' ? '#fff' : '#a6192e',
            border: '2px solid #a6192e',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: '1.1rem',
            padding: '0.75rem 2rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: activeTab === 'term' ? '0 2px 8px rgba(166,25,46,0.08)' : 'none'
          }}
        >
          Term Exam Marks
        </button>
      </div>

      {/* Final Marks Tab (corrected) */}
      {activeTab === 'final' && (
        <div className="py-8">
          {/* Academic Performance Card with header */}
          <div className="card" style={{ padding: 0, maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ background: '#a6192e', color: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: '1.5rem 2rem 1rem 2rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 0 }}>Academic Performance</h1>
              <p style={{ fontSize: '1.1rem', marginTop: 4, opacity: 0.95 }}>View your marks, grades, and pass/fail status for all subjects with 100% term exam weightage</p>
            </div>
            {/* Student Info Section */}
            <div style={{ padding: '1.5rem 2rem 0.5rem 2rem', borderBottom: '1px solid #eee', background: '#faf6f6', display: 'flex', gap: '2.5rem', fontSize: '1.1rem', fontWeight: 500 }}>
              <div><span style={{ color: '#a6192e', fontWeight: 700 }}>Student ID:</span> {student.studentId}</div>
              <div><span style={{ color: '#a6192e', fontWeight: 700 }}>Name:</span> {student.name}</div>
              <div><span style={{ color: '#a6192e', fontWeight: 700 }}>Department:</span> {student.department}</div>
            </div>
            <div style={{ padding: '2rem' }}>
              {subjects.length === 0 ? (
                <div className="card text-center">
                  <BookOpen size={48} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">No Subjects Available</h3>
                  <p className="text-gray-600">Your marks will appear here once they are published by your department.</p>
                </div>
              ) : (
                <>
                  {/* Semester Filter */}
                  <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Filter size={20} style={{ color: '#a6192e' }} />
                      <span style={{ fontWeight: 600, color: '#333' }}>Filter by Semester:</span>
                    </div>
                    <select
                      value={selectedSubjectSemester}
                      onChange={(e) => setSelectedSubjectSemester(e.target.value)}
                      style={{
                        padding: '0.5rem 1rem',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        backgroundColor: '#fff',
                        color: '#333',
                        cursor: 'pointer',
                        minWidth: '150px'
                      }}
                    >
                      <option value="all">All Semesters</option>
                      {getAvailableSubjectSemesters().map(semester => (
                        <option key={semester} value={semester}>
                          Semester {semester}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 16, padding: '1rem', marginTop: '1rem' }}>
                    <div className="marks-table-container" style={{ overflowX: 'auto' }}>
                      <table className="marks-table" style={{ minWidth: 700, width: '100%' }}>
                        <thead>
                          <tr>
                            <th style={{ minWidth: 40, textAlign: 'left', paddingRight: 16 }}>S.No.</th>
                            <th style={{ minWidth: 120, textAlign: 'left', paddingRight: 16 }}>Course Code</th>
                            <th className="subject-name" style={{ minWidth: 260, textAlign: 'left', paddingRight: 24 }}>Subject Name</th>
                            <th style={{ minWidth: 80, textAlign: 'center' }}>Credits</th>
                            <th style={{ minWidth: 100, textAlign: 'center' }}>Max Mark</th>
                            <th style={{ minWidth: 100, textAlign: 'center' }}>Pass Mark</th>
                            <th style={{ minWidth: 120, textAlign: 'center' }}>Marks Obtained</th>
                            <th style={{ minWidth: 120, textAlign: 'center' }}>Date Attended</th>
                            <th style={{ padding: '0 16px', textAlign: 'center' }}>Semester</th>
                            <th style={{ textAlign: 'center', padding: '0 16px' }}>Grade</th>
                            <th style={{ textAlign: 'center', padding: '0 16px' }}>Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSubjects
                            .filter(subject => {
                              // Only show subjects with 100 total term exam weightage
                              const subjectMarks = termExamMarks.filter(m => m.subject_id === subject.id);
                              const totalWeightage = subjectMarks.reduce((sum, mark) => {
                                const exam = termExams.find(e => e.id === mark.exam_id);
                                return sum + (exam ? exam.weight : 0);
                              }, 0);
                              return totalWeightage === 100;
                            })
                            .map((subject, idx) => {
                              // Calculate normalized total and grade
                              const subjectMarks = termExamMarks.filter(m => m.subject_id === subject.id);
                              const normalizedTotal = subjectMarks.reduce((sum, mark) => {
                                const exam = termExams.find(e => e.id === mark.exam_id);
                                return sum + (exam ? (mark.marks_obtained / exam.max_mark) * exam.weight : 0);
                              }, 0);
                              let grade = '-';
                              if (normalizedTotal >= 85) grade = 'A';
                              else if (normalizedTotal >= 70) grade = 'B';
                              else if (normalizedTotal >= 50) grade = 'C';
                              else grade = 'F';
                              // Find the first mark for date attended, pass mark, max mark, credits
                              const firstMark = termExamMarks.find(m => m.subject_id === subject.id);
                              return (
                                <tr key={subject.id}>
                                  <td style={{ textAlign: 'left', minWidth: 40, paddingRight: 16 }}>{idx + 1}</td>
                                  <td style={{ textAlign: 'left', minWidth: 120, paddingRight: 16 }}>{subject.subject_code}</td>
                                  <td className="subject-name" style={{ textAlign: 'left', minWidth: 260, paddingRight: 24 }}>{subject.subject_name}</td>
                                  <td style={{ textAlign: 'center', minWidth: 80 }}>{subject.credits}</td>
                                  <td style={{ textAlign: 'center', minWidth: 100 }}>{firstMark ? firstMark.max_mark : '-'}</td>
                                  <td style={{ textAlign: 'center', minWidth: 100 }}>{firstMark ? firstMark.pass_mark : '-'}</td>
                                  <td style={{ textAlign: 'center', minWidth: 120 }}>{normalizedTotal.toFixed(2)}</td>
                                  <td style={{ textAlign: 'center', minWidth: 120 }}>{firstMark && firstMark.exam_date ? new Date(firstMark.exam_date).toLocaleDateString() : '-'}</td>
                                  <td style={{ textAlign: 'center', padding: '0 16px' }}>{firstMark ? firstMark.semester : '-'}</td>
                                  <td style={{ textAlign: 'center', padding: '0 16px' }}>
                                    <span className={`badge ${grade === 'A' ? 'badge-success' : grade === 'B' ? 'badge-warning' : grade === 'C' ? 'badge-warning' : grade === 'F' ? 'badge-danger' : ''}`}>{grade}</span>
                                  </td>
                                  <td style={{ textAlign: 'center', padding: '0 16px' }}>
                                    <span className={`badge ${grade !== 'F' ? 'badge-success' : 'badge-danger'}`}>{grade !== 'F' ? 'PASS' : 'FAIL'}</span>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          {/* Made by Card */}
          <div className="card" style={{ textAlign: 'center', padding: '2rem', marginTop: '2rem' }}>
            <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Made by Saksham Chaturvedi.</span>
          </div>
        </div>
      )}

      {/* Term Exam Marks Tab */}
      {activeTab === 'term' && !termLoading && !termError && (
        <div style={{ maxWidth: 900, margin: '0 auto', marginTop: 32 }}>
          <style>{`
            .subject-marks-table {
              width: 100%;
              border-collapse: collapse;
              background: #fff;
              border-radius: 8px;
              overflow: hidden;
              margin-bottom: 0;
            }
            .subject-marks-table th, .subject-marks-table td {
              border: 1px solid #bfc9d1;
              padding: 8px 12px;
              text-align: center;
              font-size: 1rem;
            }
            .subject-marks-table th {
              background: #e8f0fa;
              font-weight: 700;
            }
            .subject-marks-table tr:last-child td {
              border-bottom: 1px solid #bfc9d1;
            }
          `}</style>
          {filteredSubjects.map(subject => {
            // Find all marks for this subject
            const subjectMarks = termExamMarks.filter(m => m.subject_id === subject.id);
            if (subjectMarks.length === 0) return null;
            // Calculate total weightage
            const totalWeightage = subjectMarks.reduce((sum, mark) => {
              const exam = termExams.find(e => e.id === mark.exam_id);
              return sum + (exam ? exam.weight : 0);
            }, 0);
            // Calculate normalized total
            const normalizedTotal = subjectMarks.reduce((sum, mark) => {
              const exam = termExams.find(e => e.id === mark.exam_id);
              return sum + (exam ? (mark.marks_obtained / exam.max_mark) * exam.weight : 0);
            }, 0);
            // Calculate grade
            let grade = '-';
            if (totalWeightage === 100) {
              if (normalizedTotal >= 85) grade = 'A';
              else if (normalizedTotal >= 70) grade = 'B';
              else if (normalizedTotal >= 50) grade = 'C';
              else grade = 'F';
            }
            return (
              <div key={subject.id} style={{ marginBottom: 40, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ fontWeight: 700, fontSize: '1.15rem', padding: '1.25rem 2rem 0.5rem 2rem', textAlign: 'left' }}>
                  {subject.subject_name} ({subject.subject_code})
                </div>
                <div style={{ padding: '1.5rem 2rem' }}>
                  <div className="marks-table-container" style={{ overflowX: 'auto' }}>
                    <table className="subject-marks-table">
                      <thead>
                        <tr>
                          <th>Sl.No.</th>
                          <th>Component</th>
                          <th>Max. Mark</th>
                          <th>Weightage %</th>
                          <th>Scored Mark</th>
                          <th>Weightage Mark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjectMarks.map((mark, idx) => {
                          const exam = termExams.find(e => e.id === mark.exam_id);
                          if (!exam) return null;
                          const weightageMark = ((mark.marks_obtained / exam.max_mark) * exam.weight).toFixed(2);
                          return (
                            <tr key={mark.id}>
                              <td>{idx + 1}</td>
                              <td>{exam.exam_name}</td>
                              <td>{exam.max_mark}</td>
                              <td>{exam.weight}</td>
                              <td>{mark.marks_obtained}</td>
                              <td>{weightageMark}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {totalWeightage === 100 && (
                    <div style={{ marginTop: 16, fontWeight: 600, textAlign: 'right' }}>
                      Normalized Total: {normalizedTotal.toFixed(2)} / 100<br />
                      Grade: {grade}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Marks; 