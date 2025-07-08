import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Marks from './components/Marks';
import Profile from './components/Profile';
import Library from './components/Library';
import Header from './components/Header';
import { supabase } from './supabaseClient';
import AdminPage from './components/AdminPage';
import SetPassword from './components/SetPassword';
import './App.css';

interface Student {
  id: number;
  studentId: string;
  name: string;
  email: string;
  department: string;
  year: number;
  dateOfBirth: string;
  semester: number;
  pfp_url?: string;
}

function App() {
  const [student, setStudent] = useState<Student | null>(() => {
    const stored = localStorage.getItem('student');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...parsed, semester: parsed.semester ?? 1 };
    }
    return null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('student'));
  const [adminUser, setAdminUser] = useState<any>(() => {
    const stored = localStorage.getItem('adminUser');
    return stored ? JSON.parse(stored) : null;
  });

  // Fetch latest student profile from Supabase
  const fetchLatestStudent = async (studentId: string, dateOfBirth: string) => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('student_id', studentId)
      .eq('date_of_birth', dateOfBirth)
      .single();
    if (data && !error) {
      const latestStudent: Student = {
        id: data.id,
        studentId: data.student_id,
        name: data.name,
        email: data.email,
        department: data.department,
        year: data.year,
        dateOfBirth: data.date_of_birth,
        semester: data.semester,
        pfp_url: data.pfp_url,
      };
      setStudent(latestStudent);
      localStorage.setItem('student', JSON.stringify(latestStudent));
      return latestStudent;
    }
    return null;
  };

  // On app mount, if student in localStorage, fetch latest profile
  useEffect(() => {
    const stored = localStorage.getItem('student');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.studentId && parsed.dateOfBirth) {
        fetchLatestStudent(parsed.studentId, parsed.dateOfBirth);
      }
    }
    // eslint-disable-next-line
  }, []);

  // On app mount, restore adminUser from localStorage if present
  useEffect(() => {
    const storedAdmin = localStorage.getItem('adminUser');
    if (storedAdmin) {
      setAdminUser(JSON.parse(storedAdmin));
    }
  }, []);

  const handleLogin = async (studentData: Student) => {
    // Fetch latest profile after login
    const latest = await fetchLatestStudent(studentData.studentId, studentData.dateOfBirth);
    setIsAuthenticated(true);
    if (!latest) {
      // fallback if fetch fails
      setStudent(studentData);
      localStorage.setItem('student', JSON.stringify(studentData));
    }
  };

  const handleLogout = () => {
    setStudent(null);
    setIsAuthenticated(false);
    localStorage.removeItem('student');
  };

  const handleProfileUpdate = (updatedStudent: Student) => {
    setStudent(updatedStudent);
    localStorage.setItem('student', JSON.stringify(updatedStudent));
  };

  const handleAdminLogin = (user: any) => {
    setAdminUser(user);
    localStorage.setItem('adminUser', JSON.stringify(user));
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    localStorage.removeItem('adminUser');
  };

  // Admin wrapper for Profile
  const AdminProfileWrapper = () => {
    const { studentId } = useParams();
    const [student, setStudent] = React.useState<Student | null>(null);
    React.useEffect(() => {
      const fetchStudent = async () => {
        const { data } = await supabase.from('students').select('*').eq('student_id', studentId).single();
        if (data) {
          setStudent({
            id: data.id,
            studentId: data.student_id,
            name: data.name,
            email: data.email,
            department: data.department,
            year: data.year,
            dateOfBirth: data.date_of_birth,
            semester: data.semester,
            pfp_url: data.pfp_url,
          });
        }
      };
      fetchStudent();
    }, [studentId]);
    if (!student) return <div>Loading...</div>;
    return <Profile student={student} onProfileUpdate={() => {}} adminView />;
  };

  // Admin wrapper for Marks
  const AdminMarksWrapper = () => {
    const { studentId } = useParams();
    const [student, setStudent] = React.useState<Student | null>(null);
    React.useEffect(() => {
      const fetchStudent = async () => {
        const { data } = await supabase.from('students').select('*').eq('student_id', studentId).single();
        if (data) {
          setStudent({
            id: data.id,
            studentId: data.student_id,
            name: data.name,
            email: data.email,
            department: data.department,
            year: data.year,
            dateOfBirth: data.date_of_birth,
            semester: data.semester,
            pfp_url: data.pfp_url,
          });
        }
      };
      fetchStudent();
    }, [studentId]);
    if (!student) return <div>Loading...</div>;
    return <Marks student={student} adminView />;
  };

  return (
    <Router>
      <div className="App">
        {isAuthenticated && student && (
          <Header student={student} onLogout={handleLogout} />
        )}
        
        <div className="container">
          <Routes>
            <Route 
              path="/" 
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Login onLogin={handleLogin} onAdminLogin={handleAdminLogin} />
                )
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                isAuthenticated ? (
                  <Dashboard student={student!} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/marks" 
              element={
                isAuthenticated ? (
                  <Marks student={student!} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/profile" 
              element={
                isAuthenticated ? (
                  <Profile student={student!} onProfileUpdate={handleProfileUpdate} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/library" 
              element={
                isAuthenticated ? (
                  <Library student={student!} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/admin" 
              element={
                adminUser ? (
                  <AdminPage adminUser={adminUser} onLogout={handleAdminLogout} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route path="/set-password" element={<SetPassword />} />
            <Route path="/admin/profile/:studentId" element={<AdminProfileWrapper />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App; 