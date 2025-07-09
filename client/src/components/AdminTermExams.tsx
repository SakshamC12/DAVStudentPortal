import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AdminTermExams: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'exams' | 'marks'>('exams');

  // Exams state
  const [exams, setExams] = useState<any[]>([]);
  const [examForm, setExamForm] = useState({
    id: '',
    exam_name: '',
    max_mark: '100',
    weight: '0',
  });
  const [examEditMode, setExamEditMode] = useState(false);
  const [examError, setExamError] = useState('');
  const [examLoading, setExamLoading] = useState(true);
  const [showAddExam, setShowAddExam] = useState(false);

  // Marks state
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [markForm, setMarkForm] = useState({
    id: '',
    student_id: '',
    subject_id: '',
    exam_id: '',
    marks_obtained: '',
    exam_date: '',
    semester: '',
    year: '',
  });
  const [markEditMode, setMarkEditMode] = useState(false);
  const [markError, setMarkError] = useState('');
  const [markLoading, setMarkLoading] = useState(true);
  const [showAddMark, setShowAddMark] = useState(false);

  // Manual and bulk entry state
  const [manualEntryExams, setManualEntryExams] = useState<any[]>([]);
  const [bulkEntryExams, setBulkEntryExams] = useState<any[]>([]);
  const [manualEntryMarks, setManualEntryMarks] = useState<any[]>([]);
  const [bulkEntryMarks, setBulkEntryMarks] = useState<any[]>([]);
  const [manualEntryExamForm, setManualEntryExamForm] = useState({
    id: '',
    exam_name: '',
    max_mark: '100',
    weight: '0',
  });
  const [manualEntryMarkForm, setManualEntryMarkForm] = useState({
    id: '',
    student_id: '',
    subject_id: '',
    exam_id: '',
    marks_obtained: '',
    exam_date: '',
    semester: '',
    year: '',
  });
  const [bulkEntryExamForm, setBulkEntryExamForm] = useState({
    id: '',
    exam_name: '',
    max_mark: '100',
    weight: '0',
  });
  const [bulkEntryMarkForm, setBulkEntryMarkForm] = useState({
    id: '',
    student_id: '',
    subject_id: '',
    exam_id: '',
    marks_obtained: '',
    exam_date: '',
    semester: '',
    year: '',
  });
  const [manualEntryExamError, setManualEntryExamError] = useState('');
  const [manualEntryMarkError, setManualEntryMarkError] = useState('');
  const [bulkEntryExamError, setBulkEntryExamError] = useState('');
  const [bulkEntryMarkError, setBulkEntryMarkError] = useState('');
  const [manualEntryExamLoading, setManualEntryExamLoading] = useState(true);
  const [manualEntryMarkLoading, setManualEntryMarkLoading] = useState(true);
  const [bulkEntryExamLoading, setBulkEntryExamLoading] = useState(true);
  const [bulkEntryMarkLoading, setBulkEntryMarkLoading] = useState(true);
  const [showManualEntryExam, setShowManualEntryExam] = useState(false);
  const [showManualEntryMark, setShowManualEntryMark] = useState(false);
  const [showBulkEntryExam, setShowBulkEntryExam] = useState(false);
  const [showBulkEntryMark, setShowBulkEntryMark] = useState(false);

  // Add at the top of the component, after useState imports:
  const [addMarkTab, setAddMarkTab] = useState<'manual' | 'bulk'>('manual');
  const addMarkFormRef = React.useRef<HTMLDivElement>(null);
  const [manualMarks, setManualMarks] = useState<any[]>([{ student_id: '', subject_id: '', exam_id: '', marks_obtained: '', exam_date: '', semester: '', year: '' }]);
  const [bulkMarkLoading, setBulkMarkLoading] = useState(false);
  const [bulkExamLoading, setBulkExamLoading] = useState(false);

  // Place these with the other useState hooks at the top:
  const [bulkExams, setBulkExams] = useState<any[]>([]);
  const [bulkExamRowErrors, setBulkExamRowErrors] = useState<string[]>([]);
  const [showExamTemplate, setShowExamTemplate] = useState(false);

  // Place this after all useState and before return:
  const selectedSubjectId = markForm.subject_id;
  const subjectMarks = marks.filter(m => m.subject_id === Number(selectedSubjectId));
  const subjectExamIds = subjectMarks.map(m => m.exam_id);
  const subjectExams = exams.filter(e => subjectExamIds.includes(e.id));
  const totalWeightage = subjectExams.reduce((sum, exam) => sum + (exam ? exam.weight : 0), 0);
  const selectedExam = exams.find(e => e.id === markForm.exam_id);
  const newMarkWeight = selectedExam ? selectedExam.weight : 0;
  const willExceed = totalWeightage + newMarkWeight > 100;
  const isFull = totalWeightage >= 100;

  // Add at the top of the component, after useState imports:
  const [bulkMarks, setBulkMarks] = useState<any[]>([]);
  const [bulkMarkRowErrors, setBulkMarkRowErrors] = useState<string[]>([]);
  const [showMarkTemplate, setShowMarkTemplate] = useState(false);

  // Add at the top of the component, after useState imports:
  const [addExamTab, setAddExamTab] = useState<'manual' | 'bulk'>('manual');
  const addExamFormRef = React.useRef<HTMLDivElement>(null);
  const [manualExams, setManualExams] = useState<any[]>([]);

  // Add at the top of the component, after useState imports:
  const [examSortKey, setExamSortKey] = useState<'exam_name' | 'max_mark'>('exam_name');
  const [examSortOrder, setExamSortOrder] = useState<'asc' | 'desc'>('asc');
  const [examSearch, setExamSearch] = useState('');

  // Add at the top of the component, after useState imports:
  const [markSearch, setMarkSearch] = useState('');

  // Add at the top with other useState hooks:
  const [manualExamRowErrors, setManualExamRowErrors] = useState<string[]>([]);

  // Add at the top with useState hooks:
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [showExamDeleteModal, setShowExamDeleteModal] = useState(false);
  const [selectedMarkIds, setSelectedMarkIds] = useState<string[]>([]);
  const [showMarkDeleteModal, setShowMarkDeleteModal] = useState(false);

  // Add at the top with useState hooks:
  const [examDeleteMode, setExamDeleteMode] = useState(false);
  const [markDeleteMode, setMarkDeleteMode] = useState(false);

  // Fetch exams, students, subjects, marks
  useEffect(() => {
    fetchExams();
    fetchStudents();
    fetchSubjects();
    fetchMarks();
  }, []);

  const fetchExams = async () => {
    setExamLoading(true);
    const { data, error } = await supabase.from('term_exams').select('*').order('exam_name', { ascending: true });
    if (!error) setExams(data || []);
    setExamLoading(false);
  };
  const fetchStudents = async () => {
    const { data } = await supabase.from('students').select('student_id, name, department, year, semester');
    setStudents(data || []);
  };
  const fetchSubjects = async () => {
    const { data, error } = await supabase.from('subjects').select('id, subject_name, department, year, semester');
    if (error) {
      console.error('Error fetching subjects:', error);
    }
    setSubjects(data || []);
  };
  const fetchMarks = async () => {
    setMarkLoading(true);
    const { data } = await supabase.from('term_exam_marks').select('*');
    setMarks(data || []);
    setMarkLoading(false);
  };

  // Exam form handlers
  const handleExamFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = (e.target as HTMLInputElement).name;
    const value = (e.target as HTMLInputElement).value;
    setExamForm({ ...examForm, [name]: value });
  };
  const handleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExamError('');
    if (!examForm.exam_name || !examForm.max_mark || !examForm.weight) {
      setExamError('Please fill all required fields');
      return;
    }
    if (examEditMode) {
      await supabase.from('term_exams').update({
        exam_name: examForm.exam_name,
        max_mark: Number(examForm.max_mark),
        weight: Number(examForm.weight),
      }).eq('id', examForm.id);
    } else {
      await supabase.from('term_exams').insert({
        exam_name: examForm.exam_name,
        max_mark: Number(examForm.max_mark),
        weight: Number(examForm.weight),
      });
    }
    setExamForm({ id: '', exam_name: '', max_mark: '100', weight: '0' });
    setExamEditMode(false);
    setShowAddExam(false);
    fetchExams();
  };
  const handleExamEdit = (exam: any) => {
    setExamForm({
      id: exam.id,
      exam_name: exam.exam_name,
      max_mark: exam.max_mark.toString(),
      weight: exam.weight.toString(),
    });
    setExamEditMode(true);
    setShowAddExam(true);
  };
  const handleExamDelete = async (id: string) => {
    await supabase.from('term_exams').delete().eq('id', id);
    fetchExams();
  };

  // Mark form handlers
  const handleMarkFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const name = (e.target as HTMLInputElement | HTMLSelectElement).name;
    const value = (e.target as HTMLInputElement | HTMLSelectElement).value;
    setMarkForm({ ...markForm, [name]: value });
  };
  const handleMarkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMarkError('');
    if (!markForm.student_id || !markForm.subject_id || !markForm.exam_id || !markForm.marks_obtained || !markForm.semester || !markForm.year) {
      setMarkError('Please fill all required fields');
      return;
    }
    if (selectedExam && Number(markForm.marks_obtained) > Number(selectedExam.max_mark)) {
      setMarkError(`Marks cannot exceed the exam's max mark (${selectedExam.max_mark})`);
      return;
    }
    if (willExceed && !markEditMode) {
      setMarkError('Adding this mark would exceed 100% total weightage for this subject.');
      return;
    }
    if (markEditMode) {
      await supabase.from('term_exam_marks').update({
        student_id: markForm.student_id,
        subject_id: Number(markForm.subject_id),
        exam_id: markForm.exam_id,
        marks_obtained: Number(markForm.marks_obtained),
        exam_date: markForm.exam_date || null,
        semester: Number(markForm.semester),
        year: Number(markForm.year),
      }).eq('id', markForm.id);
    } else {
      await supabase.from('term_exam_marks').insert({
        student_id: markForm.student_id,
        subject_id: Number(markForm.subject_id),
        exam_id: markForm.exam_id,
        marks_obtained: Number(markForm.marks_obtained),
        exam_date: markForm.exam_date || null,
        semester: Number(markForm.semester),
        year: Number(markForm.year),
      });
    }
    setMarkForm({ id: '', student_id: '', subject_id: '', exam_id: '', marks_obtained: '', exam_date: '', semester: '', year: '' });
    setMarkEditMode(false);
    setShowAddMark(false);
    fetchMarks();
  };
  const handleMarkEdit = (mark: any) => {
    setMarkForm({
      id: mark.id,
      student_id: mark.student_id,
      subject_id: mark.subject_id.toString(),
      exam_id: mark.exam_id,
      marks_obtained: mark.marks_obtained.toString(),
      exam_date: mark.exam_date || '',
      semester: mark.semester.toString(),
      year: mark.year.toString(),
    });
    setMarkEditMode(true);
    setShowAddMark(true);
  };
  const handleMarkDelete = async (id: string) => {
    await supabase.from('term_exam_marks').delete().eq('id', id);
    fetchMarks();
  };

  // Filter subjects for selected student
  const eligibleSubjects = React.useMemo(() => {
    const student = students.find((s) => s.student_id === markForm.student_id);
    console.log('Selected student:', student);
    console.log('All subjects:', subjects);
    if (!student) return [];
    const filtered = subjects.filter(
      (sub) => sub.department === student.department
    );
    console.log('Eligible subjects:', filtered);
    return filtered;
  }, [markForm.student_id, students, subjects]);

  // Format exam name for display: "Name(Max mark, weight)"
  const formatExamName = (exam: any) => {
    return `${exam.exam_name}(${exam.max_mark},${exam.weight})`;
  };

  // Add new handlers and state
  const handleManualMarkChange = (idx: number, key: string, value: string) => {
    setManualMarks(marks => marks.map((row, i) => i === idx ? { ...row, [key]: value } : row));
  };
  const handleAddManualMarkRow = () => setManualMarks([...manualMarks, { student_id: '', subject_id: '', exam_id: '', marks_obtained: '', exam_date: '', semester: '', year: '' }]);
  const handleRemoveManualMarkRow = (idx: number) => setManualMarks(marks => marks.filter((_, i) => i !== idx));
  const handleManualMarkSubmit = async () => {
    // Only keep valid rows
    const validRows = manualMarks.filter(row =>
      row.student_id && row.subject_id && row.exam_id && row.marks_obtained && row.exam_date && row.semester && row.year
    );
    if (validRows.length === 0) {
      alert('No valid marks to insert.');
      setManualMarks([{ student_id: '', subject_id: '', exam_id: '', marks_obtained: '', exam_date: '', semester: '', year: '' }]);
      setShowAddMark(false);
      fetchMarks();
      return;
    }
    const insertRows = validRows.map(row => ({
      student_id: row.student_id,
      subject_id: Number(row.subject_id),
      exam_id: row.exam_id,
      marks_obtained: Number(row.marks_obtained),
      exam_date: row.exam_date || null,
      semester: Number(row.semester),
      year: Number(row.year),
    }));
    const { error } = await supabase.from('term_exam_marks').insert(insertRows);
    if (error) {
      alert('Error inserting marks: ' + error.message);
      return;
    }
    setManualMarks([{ student_id: '', subject_id: '', exam_id: '', marks_obtained: '', exam_date: '', semester: '', year: '' }]);
    setShowAddMark(false);
    fetchMarks();
  };
  const handleBulkMarkFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target?.result;
      let rows: any[] = [];
      if (file.name.endsWith('.csv')) {
        const text = data as string;
        const lines = text.split(/\r?\n/).filter(Boolean);
        rows = lines.slice(1).map(line => {
          const vals = line.split(',');
          const student_id = findStudentId(vals[0]?.trim() || '');
          return {
            student: vals[0]?.trim() || '',
            subject: vals[1]?.trim() || '',
            exam: vals[2]?.trim() || '',
            marks_obtained: vals[3]?.trim() || '',
            exam_date: excelDateToISO(vals[4]?.trim() || ''),
            semester: vals[5]?.trim() || '',
            year: vals[6]?.trim() || '',
            student_id,
            subject_id: '', // will be set below
            exam_id: '', // will be set below
          };
        });
      } else {
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        rows = json.slice(1).map((row: any) => {
          const student_id = findStudentId(row[0]?.toString().trim() || '');
          return {
            student: row[0]?.toString().trim() || '',
            subject: row[1]?.toString().trim() || '',
            exam: row[2]?.toString().trim() || '',
            marks_obtained: row[3]?.toString().trim() || '',
            exam_date: excelDateToISO(row[4]?.toString().trim() || ''),
            semester: row[5]?.toString().trim() || '',
            year: row[6]?.toString().trim() || '',
            student_id,
            subject_id: '', // will be set below
            exam_id: '', // will be set below
          };
        });
      }
      // Set subject_id and exam_id for each row
      rows = rows.map(row => ({
        ...row,
        subject_id: findSubjectId(row.subject, row.student_id),
        exam_id: findExamId(row.exam),
      }));
      setBulkMarks(rows);
      setBulkMarkRowErrors(rows.map(validateBulkMarkRow));
    };
    if (file.name.endsWith('.csv')) reader.readAsText(file);
    else reader.readAsBinaryString(file);
  };
  const handleBulkMarkSubmit = async () => {
    // Validate all rows before submission
    const errors = bulkMarks.map(validateBulkMarkRow);
    setBulkMarkRowErrors(errors);
    const validRows = bulkMarks.filter((row, idx) => !errors[idx] && row.student_id && row.subject_id && row.exam_id && row.marks_obtained && row.exam_date && row.semester && row.year);
    if (validRows.length === 0) return;
    // Prepare data for insertion
    const insertRows = validRows.map(row => ({
      student_id: row.student_id,
      subject_id: row.subject_id,
      exam_id: row.exam_id,
      marks_obtained: Number(row.marks_obtained),
      exam_date: excelDateToISO(row.exam_date),
      semester: row.semester ? Number(row.semester) : null,
      year: row.year ? Number(row.year) : null,
    }));
    const { error } = await supabase.from('term_exam_marks').insert(insertRows);
    if (!error) {
      setBulkMarks([]);
      setBulkMarkRowErrors([]);
      setShowAddMark(false);
      fetchMarks();
    } else {
      alert('Error inserting marks: ' + error.message);
    }
  };

  const handleManualExamChange = (idx: number, key: string, value: string) => {
    setManualExams(exams => {
      const newExams = exams.map((row, i) => i === idx ? { ...row, [key]: value } : row);
      // Validate for duplicate
      const errors = newExams.map((row, i) => {
        if (!row.exam_name || !row.max_mark || !row.weight) return '';
        const duplicate = exams.some((e, j) =>
          j !== i &&
          e.exam_name.trim().toLowerCase() === row.exam_name.trim().toLowerCase() &&
          Number(e.max_mark) === Number(row.max_mark) &&
          Number(e.weight) === Number(row.weight)
        );
        if (duplicate || exams.some(e =>
          e.exam_name.trim().toLowerCase() === row.exam_name.trim().toLowerCase() &&
          Number(e.max_mark) === Number(row.max_mark) &&
          Number(e.weight) === Number(row.weight)
        )) {
          return 'Duplicate exam (name, max mark, and weight) already exists.';
        }
        return '';
      });
      setManualExamRowErrors(errors);
      return newExams;
    });
  };
  const handleAddManualExamRow = () => setManualExams([...manualExams, { exam_name: '', max_mark: '', weight: '' }]);
  const handleRemoveManualExamRow = (idx: number) => setManualExams(exams => exams.filter((_, i) => i !== idx));
  const handleManualExamSubmit = async () => {
    // Validate all rows
    const errors = manualExams.map((row, idx) => {
      if (!row.exam_name || !row.max_mark || !row.weight) return 'Please fill all required fields.';
      const duplicate = exams.some(e =>
        e.exam_name.trim().toLowerCase() === row.exam_name.trim().toLowerCase() &&
        Number(e.max_mark) === Number(row.max_mark) &&
        Number(e.weight) === Number(row.weight)
      );
      if (duplicate) return 'Duplicate exam (name, max mark, and weight) already exists.';
      return '';
    });
    setManualExamRowErrors(errors);
    if (errors.some(e => e)) return;
    // Prepare data for insertion
    const insertRows = manualExams.map(row => ({
      exam_name: row.exam_name,
      max_mark: Number(row.max_mark),
      weight: Number(row.weight),
    }));
    const { error } = await supabase.from('term_exams').insert(insertRows);
    if (error) {
      setManualExamRowErrors([error.message]);
      return;
    }
    setManualExams([{ exam_name: '', max_mark: '', weight: '' }]);
    setManualExamRowErrors([]);
    setShowAddExam(false);
    fetchExams();
  };
  const handleBulkExamInputChange = (idx: number, key: string, value: string) => {
    const newRows = [...bulkExams];
    newRows[idx][key] = value;
    // Validate row
    const errors = [...bulkExamRowErrors];
    errors[idx] = validateBulkExamRow(newRows[idx]);
    setBulkExamRowErrors(errors);
  };
  const handleRemoveBulkExamRow = (idx: number) => {
    setBulkExams(rows => rows.filter((_, i) => i !== idx));
    setBulkExamRowErrors(errors => errors.filter((_, i) => i !== idx));
  };
  function validateBulkExamRow(row: any) {
    if (!row.exam_name || !row.max_mark || !row.weight) return 'All fields required';
    if (isNaN(Number(row.max_mark)) || Number(row.max_mark) <= 0) return 'Max Mark must be a positive number';
    if (isNaN(Number(row.weight)) || Number(row.weight) < 0) return 'Weight must be a non-negative number';
    return '';
  }
  const handleBulkExamFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target?.result;
      let rows: any[] = [];
      if (file.name.endsWith('.csv')) {
        // Parse CSV
        const text = data as string;
        const lines = text.split(/\r?\n/).filter(Boolean);
        rows = lines.slice(1).map(line => {
          const vals = line.split(',');
          return {
            exam_name: vals[0]?.trim() || '',
            max_mark: vals[1]?.trim() || '',
            weight: vals[2]?.trim() || '',
          };
        });
      } else {
        // Parse XLSX
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        rows = json.slice(1).map((row: any) => ({
          exam_name: row[0]?.toString().trim() || '',
          max_mark: row[1]?.toString().trim() || '',
          weight: row[2]?.toString().trim() || '',
        }));
      }
      setBulkExams(rows);
      setBulkExamRowErrors(rows.map(validateBulkExamRow));
    };
    if (file.name.endsWith('.csv')) reader.readAsText(file);
    else reader.readAsBinaryString(file);
  };
  const handleBulkExamSubmit = async () => {
    setBulkExamLoading(true);
    const validRows = bulkExams.filter((row, idx) => !bulkExamRowErrors[idx]);
    if (validRows.length === 0) {
      setBulkExamLoading(false);
      return;
    }
    // Filter out duplicates
    const filteredRows = validRows.filter(row =>
      !exams.some(e =>
        e.exam_name.trim().toLowerCase() === row.exam_name.trim().toLowerCase() &&
        Number(e.max_mark) === Number(row.max_mark) &&
        Number(e.weight) === Number(row.weight)
      )
    );
    if (filteredRows.length !== validRows.length) {
      alert('Some duplicate exams were not added.');
    }
    if (filteredRows.length === 0) {
      setBulkExamLoading(false);
      return;
    }
    const { error } = await supabase.from('term_exams').insert(filteredRows.map(row => ({
      exam_name: row.exam_name,
      max_mark: Number(row.max_mark),
      weight: Number(row.weight),
    })));
    if (!error) {
      setBulkExams([]);
      setBulkExamRowErrors([]);
      setShowAddExam(false);
      fetchExams();
    }
    setBulkExamLoading(false);
  };

  // 1. Add useEffect for Add Mark auto-scroll
  React.useEffect(() => {
    if (showAddMark && addMarkFormRef.current) {
      addMarkFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showAddMark]);
  // 2. Add useEffect for Add Exam auto-scroll
  React.useEffect(() => {
    if (showAddExam && addExamFormRef.current) {
      addExamFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showAddExam]);

  const normalize = (val: string) => val.trim().toLowerCase().replace(/[_\s]+/g, '');
  const findStudentId = (val: string) => {
    const norm = normalize(val);
    const found = students.find(s => normalize(s.student_id) === norm || normalize(s.name) === norm);
    return found ? found.student_id : '';
  };
  const findSubjectId = (val: string, studentId: string) => {
    const student = students.find(s => s.student_id === studentId);
    if (!student) return '';
    const norm = normalize(val);
    const eligibleSubjects = subjects.filter(sub => sub.department === student.department);
    const found = eligibleSubjects.find(sub => normalize(sub.subject_name) === norm || normalize(sub.id.toString()) === norm);
    return found ? found.id : '';
  };
  const findExamId = (val: string) => {
    const norm = normalize(val);
    const found = exams.find(e => normalize(e.exam_name) === norm || normalize(e.id.toString()) === norm);
    return found ? found.id : '';
  };
  function validateBulkMarkRow(row: any) {
    if (!row.student_id) return 'Student not found';
    if (!row.subject_id) return 'Subject not found';
    if (!row.exam_id) return 'Exam not found';
    if (!row.marks_obtained) return 'Marks required';
    if (isNaN(Number(row.marks_obtained))) return 'Marks must be a number';
    if (!row.exam_date || !excelDateToISO(row.exam_date)) return 'Invalid or missing exam date (use DD-MM-YYYY or DD/MM/YYYY)';
    if (row.exam_id) {
      const exam = exams.find(e => e.id === row.exam_id);
      if (exam && Number(row.marks_obtained) > Number(exam.max_mark)) return `Marks cannot exceed max mark (${exam.max_mark})`;
    }
    return '';
  }
  const handleBulkMarkInputChange = (idx: number, key: string, value: string) => {
    const newRows = [...bulkMarks];
    if (key === 'student_id') {
      newRows[idx].student_id = value;
      // Update subject_id and exam_id if student changes
      newRows[idx].subject_id = '';
      newRows[idx].exam_id = '';
    } else if (key === 'subject_id') {
      newRows[idx].subject_id = value;
    } else if (key === 'exam_id') {
      newRows[idx].exam_id = value;
    } else {
      newRows[idx][key] = value;
    }
    setBulkMarks(newRows);
    const errors = [...bulkMarkRowErrors];
    errors[idx] = validateBulkMarkRow(newRows[idx]);
    setBulkMarkRowErrors(errors);
  };
  const handleRemoveBulkMarkRow = (idx: number) => {
    setBulkMarks(rows => rows.filter((_, i) => i !== idx));
    setBulkMarkRowErrors(errors => errors.filter((_, i) => i !== idx));
  };

  // Add a helper to format date for input type=date
  function formatDateForInput(dateStr: string) {
    if (!dateStr) return '';
    // Normalize slashes to dashes
    const norm = dateStr.replace(/\//g, '-');
    // Match D-M-YYYY or DD-MM-YYYY
    let m = norm.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (m) {
      const [_, d, mth, y] = m;
      return `${y}-${mth.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    // Match D-M-YY or DD-MM-YY
    m = norm.match(/^(\d{1,2})-(\d{1,2})-(\d{2})$/);
    if (m) {
      const [_, d, mth, y] = m;
      const fullYear = Number(y) < 50 ? `20${y}` : `19${y}`;
      return `${fullYear}-${mth.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(norm)) return norm;
    return '';
  }

  // Helper to convert Excel date numbers or strings to YYYY-MM-DD (robust, matches AdminLibrary)
  function excelDateToISO(dateVal: any) {
    if (typeof dateVal === 'number') {
      // Excel date number to JS date
      const jsDate = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
      return jsDate.toISOString().slice(0, 10);
    }
    if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      return dateVal;
    }
    // Try to parse as date string (DD-MM-YYYY or MM/DD/YYYY)
    if (typeof dateVal === 'string') {
      const parts = dateVal.split(/[\/-]/);
      if (parts.length === 3) {
        // Try DD-MM-YYYY or DD/MM/YYYY
        if (parts[2].length === 4) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        // Try YYYY-MM-DD
        if (parts[0].length === 4) {
          return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }
      }
    }
    return '';
  }

  const sortedExams = React.useMemo(() => {
    const sorted = [...exams];
    sorted.sort((a, b) => {
      if (examSortKey === 'exam_name') {
        const aName = a.exam_name.toLowerCase();
        const bName = b.exam_name.toLowerCase();
        if (aName < bName) return examSortOrder === 'asc' ? -1 : 1;
        if (aName > bName) return examSortOrder === 'asc' ? 1 : -1;
        return 0;
      } else {
        // max_mark
        const aMark = Number(a.max_mark);
        const bMark = Number(b.max_mark);
        return examSortOrder === 'asc' ? aMark - bMark : bMark - aMark;
      }
    });
    return sorted;
  }, [exams, examSortKey, examSortOrder]);

  const filteredExams = React.useMemo(() => {
    const term = examSearch.trim().toLowerCase();
    if (!term) return sortedExams;
    return sortedExams.filter(exam =>
      exam.exam_name.toLowerCase().includes(term) ||
      exam.max_mark.toString().includes(term)
    );
  }, [sortedExams, examSearch]);

  const filteredMarks = React.useMemo(() => {
    const term = markSearch.trim().toLowerCase();
    if (!term) return marks; // Show all marks if no search term
    return marks.filter(mark => {
      const student = students.find(s => s.student_id === mark.student_id);
      const subject = subjects.find(sub => sub.id === mark.subject_id);
      return (
        (student && (student.student_id.toLowerCase().includes(term) || student.name.toLowerCase().includes(term))) ||
        (subject && subject.subject_name.toLowerCase().includes(term))
      );
    });
  }, [markSearch, marks, students, subjects]);

  // Handler for selecting exams
  const handleExamCheckbox = (id: string, checked: boolean) => {
    setSelectedExamIds(prev => checked ? [...prev, id] : prev.filter(eid => eid !== id));
  };
  const handleSelectAllExams = (checked: boolean) => {
    setSelectedExamIds(checked ? filteredExams.map(e => e.id) : []);
  };
  // Handler for selecting marks
  const handleMarkCheckbox = (id: string, checked: boolean) => {
    setSelectedMarkIds(prev => checked ? [...prev, id] : prev.filter(mid => mid !== id));
  };
  const handleSelectAllMarks = (checked: boolean) => {
    setSelectedMarkIds(checked ? filteredMarks.map(m => m.id) : []);
  };
  // Mass delete handlers
  const handleDeleteSelectedExams = async () => {
    setShowExamDeleteModal(false);
    if (selectedExamIds.length === 0) return;
    await supabase.from('term_exams').delete().in('id', selectedExamIds);
    setSelectedExamIds([]);
    fetchExams();
  };
  const handleDeleteSelectedMarks = async () => {
    setShowMarkDeleteModal(false);
    if (selectedMarkIds.length === 0) return;
    await supabase.from('term_exam_marks').delete().in('id', selectedMarkIds);
    setSelectedMarkIds([]);
    fetchMarks();
  };

  // Handler for toggling selection mode:
  const handleExamDeleteMode = () => {
    setExamDeleteMode(true);
    setSelectedExamIds([]);
  };
  const handleCancelExamDeleteMode = () => {
    setExamDeleteMode(false);
    setSelectedExamIds([]);
  };
  const handleMarkDeleteMode = () => {
    setMarkDeleteMode(true);
    setSelectedMarkIds([]);
  };
  const handleCancelMarkDeleteMode = () => {
    setMarkDeleteMode(false);
    setSelectedMarkIds([]);
  };

  // In the add exam/mark card (manual and bulk entry), replace the Cancel button with an 'X' icon at the top right for mobile view:
  // 1. Add a utility to detect mobile view:
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 700;

  return (
    <div className="py-8">
      <div className="card" style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
        <h1 className="text-2xl font-bold mb-4">Term Exam Management</h1>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #eee' }}>
          <button
            onClick={() => setActiveTab('exams')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: activeTab === 'exams' ? '#a6192e' : 'transparent',
              color: activeTab === 'exams' ? '#fff' : '#333',
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: activeTab === 'exams' ? '2px solid #a6192e' : '2px solid transparent',
            }}
          >
            Manage Exams
          </button>
          <button
            onClick={() => setActiveTab('marks')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: activeTab === 'marks' ? '#a6192e' : 'transparent',
              color: activeTab === 'marks' ? '#fff' : '#333',
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: activeTab === 'marks' ? '2px solid #a6192e' : '2px solid transparent',
            }}
          >
            Manage Marks
          </button>
        </div>

        {/* Exams Tab */}
        {activeTab === 'exams' && (
          <>
            {/* Sort & Search Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontWeight: 600, fontSize: 14 }}>Sort by</label>
                <select value={examSortKey} onChange={e => setExamSortKey(e.target.value as 'exam_name' | 'max_mark')} className="form-input" style={{ minWidth: 90, fontSize: 14, padding: '2px 8px', height: 32 }}>
                  <option value="exam_name">Name</option>
                  <option value="max_mark">Max Mark</option>
                </select>
                <button
                  className="btn btn-sm"
                  style={{ background: '#a6192e', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 14, height: 32, padding: '0 12px' }}
                  onClick={() => setExamSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                  type="button"
                >
                  {examSortOrder === 'asc' ? 'Asc' : 'Desc'}
                </button>
                {/* Delete Multiple Button (inline with sort controls) */}
                {!examDeleteMode ? (
                  <button
                    className="btn btn-sm"
                    style={{ background: '#a6192e', color: '#fff', fontWeight: 700, borderRadius: 8, padding: '0 20px', height: 32, fontSize: 16, marginLeft: 8, whiteSpace: 'nowrap' }}
                    onClick={handleExamDeleteMode}
                  >
                    Delete Multiple
                  </button>
                ) : (
                  <>
                    <button
                      className="btn btn-sm"
                      style={{ background: '#6b7280', color: '#fff', fontWeight: 700, borderRadius: 8, padding: '0 16px', height: 32, fontSize: 16, marginLeft: 8, whiteSpace: 'nowrap' }}
                      onClick={handleCancelExamDeleteMode}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ background: selectedExamIds.length ? '#ef4444' : '#ccc', color: '#fff', fontWeight: 700, borderRadius: 8, padding: '0 16px', height: 32, fontSize: 16, whiteSpace: 'nowrap' }}
                      onClick={() => setShowExamDeleteModal(true)}
                      disabled={selectedExamIds.length === 0}
                    >
                      Delete Selected ({selectedExamIds.length})
                    </button>
                  </>
                )}
              </div>
              <input
                type="text"
                placeholder="Search by Name or Max Mark"
                value={examSearch}
                onChange={e => setExamSearch(e.target.value)}
                className="form-input"
                style={{ minWidth: 220, maxWidth: 320, fontSize: 14, height: 32, border: '1px solid #a6192e', borderRadius: 8, padding: '2px 12px' }}
              />
            </div>
            {exams.length === 0 ? (
              <div className="card text-center">No exams found.</div>
            ) : (
              <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 340, borderRadius: 12, boxShadow: '0 2px 8px 0 #f3eaea', background: '#fff' }}>
                <table className="marks-table" style={{ minWidth: 700, width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr>
                      {examDeleteMode && (
                        <th style={{ width: 36, textAlign: 'center' }}>
                          <input type="checkbox" checked={selectedExamIds.length === filteredExams.length && filteredExams.length > 0} onChange={e => setSelectedExamIds(e.target.checked ? filteredExams.map(e => e.id) : [])} />
                        </th>
                      )}
                      <th style={{ padding: '12px 18px', paddingLeft: 24, textAlign: 'left' }}>Exam Name</th>
                      <th style={{ padding: '12px 18px', textAlign: 'left' }}>Max Mark</th>
                      <th style={{ padding: '12px 18px', textAlign: 'left' }}>Weight</th>
                      <th style={{ minWidth: 140, textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExams.map((exam) => (
                      <tr key={exam.id} style={{ height: 64, borderBottom: '8px solid transparent' }}>
                        {examDeleteMode && (
                          <td style={{ textAlign: 'center' }}>
                            <input type="checkbox" checked={selectedExamIds.includes(exam.id)} onChange={e => setSelectedExamIds(e.target.checked ? [...selectedExamIds, exam.id] : selectedExamIds.filter(id => id !== exam.id))} />
                          </td>
                        )}
                        <td style={{ padding: '10px 16px', paddingLeft: 24 }}>{exam.exam_name}</td>
                        <td style={{ padding: '10px 16px' }}>{exam.max_mark}</td>
                        <td style={{ padding: '10px 16px' }}>{exam.weight}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button className="btn btn-sm" style={{ background: '#3b82f6', color: '#fff' }} onClick={() => handleExamEdit(exam)}>Edit</button>
                            <button className="btn btn-sm" style={{ background: '#ef4444', color: '#fff' }} onClick={() => handleExamDelete(exam.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!showAddExam && (
              <button
                className="btn mb-4"
                style={{ background: '#a6192e', color: '#fff', marginTop: 32 }} // Added marginTop for spacing
                onClick={() => {
                  setShowAddExam((v) => {
                    if (!v && manualExams.length === 0) setManualExams([{ exam_name: '', max_mark: '', weight: '' }]);
                    return !v;
                  });
                  setExamEditMode(false);
                  setExamForm({ id: '', exam_name: '', max_mark: '100', weight: '0' });
                }}
              >
                Add Exam
              </button>
            )}
            {showAddExam && !examEditMode && (
              <div ref={addExamFormRef} className="card mb-6" style={{ background: '#f7e6e9', marginTop: 24, maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
                {isMobile ? (
                  <button
                    className="btn"
                    style={{ position: 'absolute', top: 12, right: 16, background: 'transparent', color: '#a6192e', fontSize: 28, border: 'none', zIndex: 2, padding: 0, minWidth: 36, minHeight: 36, lineHeight: 1 }}
                    aria-label="Close"
                    onClick={() => setShowAddExam(false)}
                  >
                    ×
                  </button>
                ) : (
                  <button className="btn mb-4" style={{ background: '#6b7280', color: '#fff', float: 'right' }} onClick={() => setShowAddExam(false)}>
                    Cancel
                  </button>
                )}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: 24 }}>
                  <button
                    className="btn"
                    style={{ background: addExamTab === 'manual' ? '#a6192e' : '#fff', color: addExamTab === 'manual' ? '#fff' : '#a6192e', border: '2px solid #a6192e', fontWeight: 700, borderRadius: 8, padding: '0.5rem 1.5rem' }}
                    onClick={() => setAddExamTab('manual')}
                  >
                    Manual Entry
                  </button>
                  <button
                    className="btn"
                    style={{ background: addExamTab === 'bulk' ? '#a6192e' : '#fff', color: addExamTab === 'bulk' ? '#fff' : '#a6192e', border: '2px solid #a6192e', fontWeight: 700, borderRadius: 8, padding: '0.5rem 1.5rem' }}
                    onClick={() => setAddExamTab('bulk')}
                  >
                    Bulk Upload
                  </button>
                  {addExamTab === 'bulk' && (
                    <button
                      className="btn"
                      style={{ background: '#fff', color: '#a6192e', border: '2px solid #a6192e', fontWeight: 700, borderRadius: 8, padding: '0.5rem 1.5rem', marginLeft: 8 }}
                      onClick={() => setShowExamTemplate(true)}
                      type="button"
                    >
                      Example Template
                    </button>
                  )}
                </div>
                {addExamTab === 'manual' && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Add Exams</h2>
                    <div style={{ overflowX: 'auto', marginTop: 16 }}>
                      <table className="marks-table" style={{ minWidth: 700, width: '100%' }}>
                        <thead>
                          <tr>
                            <th>Exam Name</th>
                            <th>Max Mark</th>
                            <th>Weight</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {manualExams.map((row, idx) => (
                            <React.Fragment key={idx}>
                              <tr>
                                <td><input type="text" value={row.exam_name} onChange={e => handleManualExamChange(idx, 'exam_name', (e.target as HTMLInputElement).value)} className="form-input" /></td>
                                <td><input type="number" value={row.max_mark} onChange={e => handleManualExamChange(idx, 'max_mark', (e.target as HTMLInputElement).value)} className="form-input" min={1} /></td>
                                <td><input type="number" value={row.weight} onChange={e => handleManualExamChange(idx, 'weight', (e.target as HTMLInputElement).value)} className="form-input" min={0} /></td>
                                <td><button className="btn btn-sm" style={{ background: '#ef4444', color: '#fff' }} onClick={() => handleRemoveManualExamRow(idx)} type="button" disabled={manualExams.length === 1}>Remove</button></td>
                              </tr>
                              {manualExamRowErrors[idx] && (
                                <tr>
                                  <td colSpan={4} style={{ color: 'red', fontSize: 13, background: '#fff0f0', textAlign: 'left', paddingLeft: 12 }}>{manualExamRowErrors[idx]}</td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                      <button className="btn mt-4" style={{ background: '#a6192e', color: '#fff' }} onClick={handleAddManualExamRow} type="button">Add Another</button>
                      <button className="btn mt-4" style={{ background: '#a6192e', color: '#fff', marginLeft: 16 }} onClick={handleManualExamSubmit}>Submit All</button>
                    </div>
                  </div>
                )}
                {addExamTab === 'bulk' && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Bulk Upload Exams</h2>
                    <input type="file" accept=".xlsx,.csv" onChange={handleBulkExamFile} className="form-input mb-4" />
                    {showExamTemplate && (
                      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1001, background: '#fff', borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.2)', padding: 40, maxWidth: 900 }}>
                        <button
                          className="btn btn-sm"
                          style={{ position: 'absolute', top: 20, right: 20, background: '#6b7280', color: '#fff', padding: '8px 24px', fontSize: 20 }}
                          onClick={() => setShowExamTemplate(false)}
                        >
                          Close
                        </button>
                        <h3 className="text-lg font-bold mb-4" style={{ marginTop: 8 }}>Exam Bulk Upload Example</h3>
                        <div style={{ overflowX: 'auto', marginBottom: 20 }}>
                          <table className="marks-table" style={{ minWidth: 700, width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'center' }}>
                            <thead>
                              <tr>
                                <th style={{ padding: '12px 18px', minWidth: 180, textAlign: 'center' }}>Exam Name</th>
                                <th style={{ padding: '12px 18px', minWidth: 120, textAlign: 'center' }}>Max Mark</th>
                                <th style={{ padding: '12px 18px', minWidth: 120, textAlign: 'center' }}>Weight</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td style={{ padding: '10px 16px', minWidth: 180, textAlign: 'center' }}>Mid Term 1</td>
                                <td style={{ padding: '10px 16px', minWidth: 120, textAlign: 'center' }}>50</td>
                                <td style={{ padding: '10px 16px', minWidth: 120, textAlign: 'center' }}>20</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div style={{ display: 'flex', gap: 20, marginTop: 16, justifyContent: 'center' }}>
                          <a
                            href="https://gfqexgwydnfhntearstw.supabase.co/storage/v1/object/public/templated//exam_template.xlsx"
                            download
                            className="btn"
                            style={{ background: '#a6192e', color: '#fff', fontWeight: 700, fontSize: 18, padding: '16px 32px', borderRadius: 8 }}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Download Example Excel File
                          </a>
                          <a
                            href="https://gfqexgwydnfhntearstw.supabase.co/storage/v1/object/public/templated//exam_template.xlsx"
                            className="btn"
                            style={{ background: '#fff', color: '#a6192e', border: '2px solid #a6192e', fontWeight: 700, fontSize: 18, padding: '16px 32px', borderRadius: 8 }}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Example Excel File
                          </a>
                        </div>
                      </div>
                    )}
                    {bulkExams.length > 0 && (
                      <div style={{ overflowX: 'auto', marginBottom: 16, marginTop: 16 }}>
                        <table className="marks-table" style={{ minWidth: 700, width: '100%' }}>
                          <thead>
                            <tr>
                              <th>Exam Name</th>
                              <th>Max Mark</th>
                              <th>Weight</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bulkExams.map((row, idx) => (
                              <tr key={idx}>
                                <td>
                                  <input type="text" value={row.exam_name} onChange={e => handleBulkExamInputChange(idx, 'exam_name', (e.target as HTMLInputElement).value)} className="form-input" />
                                  {bulkExamRowErrors[idx] && bulkExamRowErrors[idx].toLowerCase().includes('exam name') && (
                                    <div style={{ color: 'red', fontSize: 13 }}>{bulkExamRowErrors[idx]}</div>
                                  )}
                                </td>
                                <td>
                                  <input type="number" value={row.max_mark} onChange={e => handleBulkExamInputChange(idx, 'max_mark', (e.target as HTMLInputElement).value)} className="form-input" min={1} />
                                  {bulkExamRowErrors[idx] && bulkExamRowErrors[idx].toLowerCase().includes('max mark') && (
                                    <div style={{ color: 'red', fontSize: 13 }}>{bulkExamRowErrors[idx]}</div>
                                  )}
                                </td>
                                <td>
                                  <input type="number" value={row.weight} onChange={e => handleBulkExamInputChange(idx, 'weight', (e.target as HTMLInputElement).value)} className="form-input" min={0} />
                                  {bulkExamRowErrors[idx] && bulkExamRowErrors[idx].toLowerCase().includes('weight') && (
                                    <div style={{ color: 'red', fontSize: 13 }}>{bulkExamRowErrors[idx]}</div>
                                  )}
                                </td>
                                <td><button className="btn btn-sm" style={{ background: '#ef4444', color: '#fff' }} onClick={() => handleRemoveBulkExamRow(idx)} type="button">Remove</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <button className="btn mt-4" style={{ background: '#a6192e', color: '#fff' }} onClick={handleBulkExamSubmit} disabled={bulkExamLoading || bulkExams.length === 0}>
                      {bulkExamLoading ? 'Submitting...' : 'Submit All'}
                    </button>
                  </div>
                )}
              </div>
            )}
            {showAddExam && examEditMode && (
              <div ref={addExamFormRef} className="card mb-6" style={{ background: '#f7e6e9', marginTop: 24, maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
                {isMobile ? (
                  <button
                    className="btn"
                    style={{ position: 'absolute', top: 12, right: 16, background: 'transparent', color: '#a6192e', fontSize: 28, border: 'none', zIndex: 2, padding: 0, minWidth: 36, minHeight: 36, lineHeight: 1 }}
                    aria-label="Close"
                    onClick={() => { setShowAddExam(false); setExamEditMode(false); setExamForm({ id: '', exam_name: '', max_mark: '100', weight: '0' }); }}
                  >
                    ×
                  </button>
                ) : (
                  <button className="btn mb-4" style={{ background: '#6b7280', color: '#fff', float: 'right' }} onClick={() => { setShowAddExam(false); setExamEditMode(false); setExamForm({ id: '', exam_name: '', max_mark: '100', weight: '0' }); }}>
                    Cancel
                  </button>
                )}
                <h2 className="text-xl font-bold mb-4">Edit Exam</h2>
                <form onSubmit={handleExamSubmit}>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <input type="text" name="exam_name" placeholder="Exam Name" value={examForm.exam_name} onChange={handleExamFormChange} className="form-input" required style={{ flex: 1 }} />
                    <input type="number" name="max_mark" placeholder="Max Mark" value={examForm.max_mark} onChange={handleExamFormChange} className="form-input" required min={1} style={{ flex: 1 }} />
                    <input type="number" name="weight" placeholder="Weight" value={examForm.weight} onChange={handleExamFormChange} className="form-input" required min={0} style={{ flex: 1 }} />
                  </div>
                  <button className="btn mt-4" style={{ background: '#3b82f6', color: '#fff' }} type="submit">Update Exam</button>
                </form>
              </div>
            )}
          </>
        )}

        {/* Marks Tab */}
        {activeTab === 'marks' && (
          <div>
            {/* Search Bar for Marks */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {!markDeleteMode ? (
                  <button
                    className="btn btn-sm"
                    style={{ background: '#a6192e', color: '#fff', fontWeight: 700, borderRadius: 8, padding: '0 16px', height: 32 }}
                    onClick={handleMarkDeleteMode}
                  >
                    Delete Multiple
                  </button>
                ) : (
                  <>
                    <button
                      className="btn btn-sm"
                      style={{ background: '#6b7280', color: '#fff', fontWeight: 700, borderRadius: 8, padding: '0 16px', height: 32 }}
                      onClick={handleCancelMarkDeleteMode}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ background: selectedMarkIds.length ? '#ef4444' : '#ccc', color: '#fff', fontWeight: 700, borderRadius: 8, padding: '0 16px', height: 32 }}
                      onClick={() => setShowMarkDeleteModal(true)}
                      disabled={selectedMarkIds.length === 0}
                    >
                      Delete Selected ({selectedMarkIds.length})
                    </button>
                  </>
                )}
              </div>
              <input
                type="text"
                placeholder="Search by Student ID, Name, or Subject"
                value={markSearch}
                onChange={e => setMarkSearch(e.target.value)}
                className="form-input"
                style={{ minWidth: 320, maxWidth: 400, border: '1px solid #a6192e', borderRadius: 8, padding: '0.5rem 1rem', fontSize: 15 }}
              />
            </div>
            {marks.length === 0 ? (
              <div className="card text-center">No marks found.</div>
            ) : (
              <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 340, borderRadius: 12, boxShadow: '0 2px 8px 0 #f3eaea', background: '#fff' }}>
                <table className="marks-table" style={{ minWidth: 900, width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr>
                      {markDeleteMode && (
                        <th style={{ width: 36, textAlign: 'center' }}>
                          <input type="checkbox" checked={selectedMarkIds.length === filteredMarks.length && filteredMarks.length > 0} onChange={e => setSelectedMarkIds(e.target.checked ? filteredMarks.map(m => m.id) : [])} />
                        </th>
                      )}
                      <th style={{ padding: '12px 18px', paddingLeft: 24, textAlign: 'left' }}>Student</th>
                      <th style={{ padding: '12px 18px', textAlign: 'left' }}>Subject</th>
                      <th style={{ padding: '12px 18px', textAlign: 'left' }}>Exam</th>
                      <th style={{ padding: '12px 18px', textAlign: 'left' }}>Marks</th>
                      <th style={{ padding: '12px 18px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '12px 18px', textAlign: 'left' }}>Semester</th>
                      <th style={{ padding: '12px 18px', textAlign: 'left' }}>Year</th>
                      <th style={{ minWidth: 140, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMarks.map((mark) => (
                      <tr key={mark.id}>
                        {markDeleteMode && (
                          <td style={{ textAlign: 'center' }}>
                            <input type="checkbox" checked={selectedMarkIds.includes(mark.id)} onChange={e => setSelectedMarkIds(e.target.checked ? [...selectedMarkIds, mark.id] : selectedMarkIds.filter(id => id !== mark.id))} />
                          </td>
                        )}
                        <td style={{ padding: '10px 16px', paddingLeft: 24 }}>{students.find((s) => s.student_id === mark.student_id)?.name || mark.student_id}</td>
                        <td style={{ padding: '10px 16px' }}>{subjects.find((sub) => sub.id === mark.subject_id)?.subject_name || mark.subject_id}</td>
                        <td style={{ padding: '10px 16px' }}>{exams.find((exam) => exam.id === mark.exam_id) ? formatExamName(exams.find((exam) => exam.id === mark.exam_id)) : mark.exam_id}</td>
                        <td style={{ padding: '10px 16px' }}>{mark.marks_obtained}</td>
                        <td style={{ padding: '10px 16px' }}>{mark.exam_date ? new Date(mark.exam_date).toLocaleDateString() : '-'}</td>
                        <td style={{ padding: '10px 16px' }}>{mark.semester}</td>
                        <td style={{ padding: '10px 16px' }}>{mark.year}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button className="btn btn-sm" style={{ background: '#3b82f6', color: '#fff' }} onClick={() => handleMarkEdit(mark)}>Edit</button>
                            <button className="btn btn-sm" style={{ background: '#ef4444', color: '#fff' }} onClick={() => handleMarkDelete(mark.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!showAddMark && (
              <button
                className="btn"
                style={{ background: '#a6192e', color: '#fff', marginTop: 24 }}
                onClick={() => {
                  setShowAddMark(true);
                  setMarkEditMode(false);
                  setMarkForm({ id: '', student_id: '', subject_id: '', exam_id: '', marks_obtained: '', exam_date: '', semester: '', year: '' });
                }}
              >
                Add Mark
              </button>
            )}
            {showAddMark && !markEditMode && (
              <div ref={addMarkFormRef} className="card mb-6" style={{ background: '#f7e6e9', marginTop: 24, maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
                {isMobile ? (
                  <button
                    className="btn"
                    style={{ position: 'absolute', top: 12, right: 16, background: 'transparent', color: '#a6192e', fontSize: 28, border: 'none', zIndex: 2, padding: 0, minWidth: 36, minHeight: 36, lineHeight: 1 }}
                    aria-label="Close"
                    onClick={() => setShowAddMark(false)}
                  >
                    ×
                  </button>
                ) : (
                  <button className="btn mb-4" style={{ background: '#6b7280', color: '#fff', float: 'right' }} onClick={() => setShowAddMark(false)}>
                    Cancel
                  </button>
                )}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: 24 }}>
                  <button
                    className="btn"
                    style={{ background: addMarkTab === 'manual' ? '#a6192e' : '#fff', color: addMarkTab === 'manual' ? '#fff' : '#a6192e', border: '2px solid #a6192e', fontWeight: 700, borderRadius: 8, padding: '0.5rem 1.5rem' }}
                    onClick={() => setAddMarkTab('manual')}
                  >
                    Manual Entry
                  </button>
                  <button
                    className="btn"
                    style={{ background: addMarkTab === 'bulk' ? '#a6192e' : '#fff', color: addMarkTab === 'bulk' ? '#fff' : '#a6192e', border: '2px solid #a6192e', fontWeight: 700, borderRadius: 8, padding: '0.5rem 1.5rem' }}
                    onClick={() => setAddMarkTab('bulk')}
                  >
                    Bulk Upload
                  </button>
                  {addMarkTab === 'bulk' && (
                    <button
                      className="btn"
                      style={{ background: '#fff', color: '#a6192e', border: '2px solid #a6192e', fontWeight: 700, borderRadius: 8, padding: '0.5rem 1.5rem', marginLeft: 8 }}
                      onClick={() => setShowMarkTemplate(true)}
                      type="button"
                    >
                      Example Template
                    </button>
                  )}
                </div>
                {addMarkTab === 'manual' && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Add Marks</h2>
                    <div style={{ overflowX: 'auto', marginTop: 16 }}>
                      <table className="marks-table" style={{ minWidth: 700, width: '100%' }}>
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Subject</th>
                            <th>Exam</th>
                            <th>Marks Obtained</th>
                            <th>Exam Date</th>
                            <th>Semester</th>
                            <th>Year</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {manualMarks.map((row, idx) => (
                            <tr key={idx}>
                              <td>
                                <select value={row.student_id || ''} onChange={e => handleManualMarkChange(idx, 'student_id', (e.target as HTMLSelectElement).value)} className="form-input">
                                  <option value="">Select Student</option>
                                  {students.map(s => (
                                    <option key={s.student_id} value={s.student_id}>{s.name} ({s.student_id})</option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <select value={row.subject_id} onChange={e => handleManualMarkChange(idx, 'subject_id', (e.target as HTMLSelectElement).value)} className="form-input" disabled={!row.student_id}>
                                  <option value="">Select Subject</option>
                                  {(() => {
                                    const student = students.find(s => s.student_id === row.student_id);
                                    return subjects.filter(sub => student && sub.department === student.department).map(sub => (
                                      <option key={sub.id} value={sub.id}>{sub.subject_name}</option>
                                    ));
                                  })()}
                                </select>
                              </td>
                              <td>
                                <select value={row.exam_id} onChange={e => handleManualMarkChange(idx, 'exam_id', (e.target as HTMLSelectElement).value)} className="form-input" disabled={!row.subject_id}>
                                  <option value="">Select Exam</option>
                                  {exams.map(exam => (
                                    <option key={exam.id} value={exam.id}>{formatExamName(exam)}</option>
                                  ))}
                                </select>
                              </td>
                              <td><input type="number" value={row.marks_obtained} onChange={e => handleManualMarkChange(idx, 'marks_obtained', (e.target as HTMLInputElement).value)} className="form-input" min={0} disabled={!row.exam_id} /></td>
                              <td><input type="date" value={row.exam_date} onChange={e => handleManualMarkChange(idx, 'exam_date', (e.target as HTMLInputElement).value)} className="form-input" /></td>
                              <td><input type="number" value={row.semester} onChange={e => handleManualMarkChange(idx, 'semester', (e.target as HTMLInputElement).value)} className="form-input" min={1} /></td>
                              <td><input type="number" value={row.year} onChange={e => handleManualMarkChange(idx, 'year', (e.target as HTMLInputElement).value)} className="form-input" min={1} /></td>
                              <td><button className="btn btn-sm" style={{ background: '#ef4444', color: '#fff' }} onClick={() => handleRemoveManualMarkRow(idx)} type="button" disabled={manualMarks.length === 1}>Remove</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button className="btn mt-4" style={{ background: '#a6192e', color: '#fff' }} onClick={handleAddManualMarkRow} type="button">Add Another</button>
                      <button className="btn mt-4" style={{ background: '#a6192e', color: '#fff', marginLeft: 16 }} onClick={handleManualMarkSubmit}>Submit All</button>
                    </div>
                  </div>
                )}
                {addMarkTab === 'bulk' && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Bulk Upload Marks</h2>
                    <input type="file" accept=".xlsx,.csv" onChange={handleBulkMarkFile} className="form-input mb-4" />
                    {showMarkTemplate && (
                      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1001, background: '#fff', borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.2)', padding: 40, maxWidth: 900 }}>
                        <button
                          className="btn btn-sm"
                          style={{ position: 'absolute', top: 20, right: 20, background: '#6b7280', color: '#fff', padding: '8px 24px', fontSize: 20 }}
                          onClick={() => setShowMarkTemplate(false)}
                        >
                          Close
                        </button>
                        <h3 className="text-lg font-bold mb-4" style={{ marginTop: 8 }}>Mark Bulk Upload Example</h3>
                        <div style={{ overflowX: 'auto', marginBottom: 20 }}>
                          <table className="marks-table" style={{ minWidth: 900, width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'center' }}>
                            <thead>
                              <tr>
                                <th style={{ padding: '12px 18px', minWidth: 140, textAlign: 'center' }}>Student</th>
                                <th style={{ padding: '12px 18px', minWidth: 140, textAlign: 'center' }}>Subject</th>
                                <th style={{ padding: '12px 18px', minWidth: 140, textAlign: 'center' }}>Exam</th>
                                <th style={{ padding: '12px 18px', minWidth: 120, textAlign: 'center' }}>Marks Obtained</th>
                                <th style={{ padding: '12px 18px', minWidth: 120, textAlign: 'center' }}>Exam Date</th>
                                <th style={{ padding: '12px 18px', minWidth: 100, textAlign: 'center' }}>Semester</th>
                                <th style={{ padding: '12px 18px', minWidth: 100, textAlign: 'center' }}>Year</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td style={{ padding: '10px 16px', minWidth: 140, textAlign: 'center' }}>DAV2024001</td>
                                <td style={{ padding: '10px 16px', minWidth: 140, textAlign: 'center' }}>Mathematics</td>
                                <td style={{ padding: '10px 16px', minWidth: 140, textAlign: 'center' }}>Mid Term 1</td>
                                <td style={{ padding: '10px 16px', minWidth: 120, textAlign: 'center' }}>45</td>
                                <td style={{ padding: '10px 16px', minWidth: 120, textAlign: 'center' }}>23-06-2025</td>
                                <td style={{ padding: '10px 16px', minWidth: 100, textAlign: 'center' }}>2</td>
                                <td style={{ padding: '10px 16px', minWidth: 100, textAlign: 'center' }}>2025</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div style={{ display: 'flex', gap: 20, marginTop: 16, justifyContent: 'center' }}>
                          <a
                            href="https://gfqexgwydnfhntearstw.supabase.co/storage/v1/object/public/templated//mark_template.xlsx"
                            download
                            className="btn"
                            style={{ background: '#a6192e', color: '#fff', fontWeight: 700, fontSize: 18, padding: '16px 32px', borderRadius: 8 }}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Download Example Excel File
                          </a>
                          <a
                            href="https://gfqexgwydnfhntearstw.supabase.co/storage/v1/object/public/templated//mark_template.xlsx"
                            className="btn"
                            style={{ background: '#fff', color: '#a6192e', border: '2px solid #a6192e', fontWeight: 700, fontSize: 18, padding: '16px 32px', borderRadius: 8 }}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Example Excel File
                          </a>
                        </div>
                      </div>
                    )}
                    {bulkMarks.length > 0 && (
                      <div style={{ overflowX: 'auto', marginBottom: 16, marginTop: 16 }}>
                        <table className="marks-table" style={{ minWidth: 900, width: '100%' }}>
                          <thead>
                            <tr>
                              <th>Student</th>
                              <th>Subject</th>
                              <th>Exam</th>
                              <th>Marks Obtained</th>
                              <th>Exam Date</th>
                              <th>Semester</th>
                              <th>Year</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bulkMarks.map((row, idx) => {
                              // Find eligible subjects for the selected student
                              const student = students.find(s => s.student_id === row.student_id);
                              const eligibleSubjects = student ? subjects.filter(sub => sub.department === student.department) : subjects;
                              return (
                                <tr key={idx}>
                                  <td>
                                    <select
                                      value={row.student_id || ''}
                                      onChange={e => handleBulkMarkInputChange(idx, 'student_id', e.target.value)}
                                      className="form-input"
                                    >
                                      <option value="">Select Student</option>
                                      {students.map(s => (
                                        <option key={s.student_id} value={s.student_id}>{s.name} ({s.student_id})</option>
                                      ))}
                                    </select>
                                    {bulkMarkRowErrors[idx] && bulkMarkRowErrors[idx].toLowerCase().includes('student') && (
                                      <div style={{ color: 'red', fontSize: 13 }}>{bulkMarkRowErrors[idx]}</div>
                                    )}
                                  </td>
                                  <td>
                                    <select
                                      value={row.subject_id || ''}
                                      onChange={e => handleBulkMarkInputChange(idx, 'subject_id', e.target.value)}
                                      className="form-input"
                                      disabled={!row.student_id}
                                    >
                                      <option value="">Select Subject</option>
                                      {eligibleSubjects.map(sub => (
                                        <option key={sub.id} value={sub.id}>{sub.subject_name}</option>
                                      ))}
                                    </select>
                                    {bulkMarkRowErrors[idx] && bulkMarkRowErrors[idx].toLowerCase().includes('subject') && (
                                      <div style={{ color: 'red', fontSize: 13 }}>{bulkMarkRowErrors[idx]}</div>
                                    )}
                                  </td>
                                  <td>
                                    <select
                                      value={row.exam_id || ''}
                                      onChange={e => handleBulkMarkInputChange(idx, 'exam_id', e.target.value)}
                                      className="form-input"
                                    >
                                      <option value="">Select Exam</option>
                                      {exams.map(ex => (
                                        <option key={ex.id} value={ex.id}>{ex.exam_name}</option>
                                      ))}
                                    </select>
                                    {bulkMarkRowErrors[idx] && bulkMarkRowErrors[idx].toLowerCase().includes('exam') && (
                                      <div style={{ color: 'red', fontSize: 13 }}>{bulkMarkRowErrors[idx]}</div>
                                    )}
                                  </td>
                                  <td>
                                    <input type="number" value={row.marks_obtained} onChange={e => handleBulkMarkInputChange(idx, 'marks_obtained', (e.target as HTMLInputElement).value)} className="form-input" />
                                    {bulkMarkRowErrors[idx] && bulkMarkRowErrors[idx].toLowerCase().includes('marks') && (
                                      <div style={{ color: 'red', fontSize: 13 }}>{bulkMarkRowErrors[idx]}</div>
                                    )}
                                  </td>
                                  <td>
                                    <input
                                      type="date"
                                      value={row.exam_date ? (excelDateToISO(row.exam_date) ?? '') : ''}
                                      onChange={e => handleBulkMarkInputChange(idx, 'exam_date', (e.target as HTMLInputElement).value)}
                                      className="form-input"
                                    />
                                  </td>
                                  <td>
                                    <input type="number" value={row.semester} onChange={e => handleBulkMarkInputChange(idx, 'semester', (e.target as HTMLInputElement).value)} className="form-input" />
                                  </td>
                                  <td>
                                    <input type="number" value={row.year} onChange={e => handleBulkMarkInputChange(idx, 'year', (e.target as HTMLInputElement).value)} className="form-input" />
                                  </td>
                                  <td><button className="btn btn-sm" style={{ background: '#ef4444', color: '#fff' }} onClick={() => handleRemoveBulkMarkRow(idx)} type="button">Remove</button></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <button className="btn mt-4" style={{ background: '#a6192e', color: '#fff' }} onClick={handleBulkMarkSubmit} disabled={bulkMarkLoading}>
                      {bulkMarkLoading ? 'Submitting...' : 'Submit All'}
                    </button>
                  </div>
                )}
              </div>
            )}
            {showAddMark && markEditMode && (
              <div ref={addMarkFormRef} className="card mb-6" style={{ background: '#f7e6e9', marginTop: 24, maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
                {isMobile ? (
                  <button
                    className="btn"
                    style={{ position: 'absolute', top: 12, right: 16, background: 'transparent', color: '#a6192e', fontSize: 28, border: 'none', zIndex: 2, padding: 0, minWidth: 36, minHeight: 36, lineHeight: 1 }}
                    aria-label="Close"
                    onClick={() => { setShowAddMark(false); setMarkEditMode(false); setMarkForm({ id: '', student_id: '', subject_id: '', exam_id: '', marks_obtained: '', exam_date: '', semester: '', year: '' }); }}
                  >
                    ×
                  </button>
                ) : (
                  <button className="btn mb-4" style={{ background: '#6b7280', color: '#fff', float: 'right' }} onClick={() => { setShowAddMark(false); setMarkEditMode(false); setMarkForm({ id: '', student_id: '', subject_id: '', exam_id: '', marks_obtained: '', exam_date: '', semester: '', year: '' }); }}>
                    Cancel
                  </button>
                )}
                <h2 className="text-xl font-bold mb-4">Edit Mark</h2>
                <form onSubmit={handleMarkSubmit}>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <select name="student_id" value={markForm.student_id} onChange={handleMarkFormChange} className="form-input" required style={{ flex: 1 }} disabled>
                      <option value="">Select Student</option>
                      {students.map(s => (
                        <option key={s.student_id} value={s.student_id}>{s.name} ({s.student_id})</option>
                      ))}
                    </select>
                    <select name="subject_id" value={markForm.subject_id} onChange={handleMarkFormChange} className="form-input" required style={{ flex: 1 }}>
                      <option value="">Select Subject</option>
                      {(() => {
                        const student = students.find(s => s.student_id === markForm.student_id);
                        return subjects.filter(sub => student && sub.department === student.department).map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.subject_name}</option>
                        ));
                      })()}
                    </select>
                    <select name="exam_id" value={markForm.exam_id} onChange={handleMarkFormChange} className="form-input" required style={{ flex: 1 }}>
                      <option value="">Select Exam</option>
                      {exams.map(exam => (
                        <option key={exam.id} value={exam.id}>{formatExamName(exam)}</option>
                      ))}
                    </select>
                    <input type="number" name="marks_obtained" placeholder="Marks Obtained" value={markForm.marks_obtained} onChange={handleMarkFormChange} className="form-input" required min={0} style={{ flex: 1 }} />
                    <input type="date" name="exam_date" placeholder="Exam Date" value={markForm.exam_date} onChange={handleMarkFormChange} className="form-input" style={{ flex: 1 }} />
                    <input type="number" name="semester" placeholder="Semester" value={markForm.semester} onChange={handleMarkFormChange} className="form-input" required min={1} style={{ flex: 1 }} />
                    <input type="number" name="year" placeholder="Year" value={markForm.year} onChange={handleMarkFormChange} className="form-input" required min={1} style={{ flex: 1 }} />
                  </div>
                  <button className="btn mt-4" style={{ background: '#3b82f6', color: '#fff' }} type="submit">Update Mark</button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 700px) {
          .termexams-tabs-scrollable {
            overflow-x: auto;
            white-space: nowrap;
            width: 100vw;
            margin-bottom: 1rem;
            box-sizing: border-box;
            padding: 0 1rem;
          }
          .termexams-tabs-scrollable .tab-btn {
            display: inline-block;
            min-width: 120px;
            width: auto;
            margin-right: 0.5rem;
            font-size: 1rem;
            box-sizing: border-box;
          }
          .admin-termexams, .card {
            width: 100vw !important;
            max-width: 100vw !important;
            min-width: 0 !important;
            box-sizing: border-box;
            margin: 0 auto !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .card.mb-6 {
            max-width: 95vw !important;
            margin-left: auto !important;
            margin-right: auto !important;
            padding-left: 8px !important;
            padding-right: 8px !important;
          }
          .card.mb-6 input,
          .card.mb-6 select {
            max-width: 320px;
            margin-left: auto;
            margin-right: auto;
            display: block;
          }
          .mobile-x-btn { display: block !important; }
          .desktop-cancel-btn { display: none !important; }
        }
        @media (min-width: 701px) {
          .mobile-x-btn { display: none !important; }
          .desktop-cancel-btn { display: block !important; }
        }
      `}</style>
      {showExamDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, minWidth: 320, boxShadow: '0 4px 32px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>Delete {selectedExamIds.length} Exams?</h2>
            <p style={{ marginBottom: 24 }}>Are you sure you want to delete the selected exams? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
              <button className="btn" style={{ background: '#6b7280', color: '#fff' }} onClick={() => setShowExamDeleteModal(false)}>Cancel</button>
              <button className="btn" style={{ background: '#ef4444', color: '#fff' }} onClick={handleDeleteSelectedExams}>Delete</button>
            </div>
          </div>
        </div>
      )}
      {showMarkDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, minWidth: 320, boxShadow: '0 4px 32px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>Delete {selectedMarkIds.length} Marks?</h2>
            <p style={{ marginBottom: 24 }}>Are you sure you want to delete the selected marks? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
              <button className="btn" style={{ background: '#6b7280', color: '#fff' }} onClick={() => setShowMarkDeleteModal(false)}>Cancel</button>
              <button className="btn" style={{ background: '#ef4444', color: '#fff' }} onClick={handleDeleteSelectedMarks}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTermExams; 