import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Marks from './components/Marks';
import Profile from './components/Profile';
import Header from './components/Header';
import './App.css';

interface Student {
  id: number;
  studentId: string;
  name: string;
  email: string;
  department: string;
  year: number;
  dateOfBirth: string;
}

function App() {
  const [student, setStudent] = useState<Student | null>(() => {
    const stored = localStorage.getItem('student');
    return stored ? JSON.parse(stored) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('student'));

  const handleLogin = (studentData: Student) => {
    setStudent(studentData);
    setIsAuthenticated(true);
    localStorage.setItem('student', JSON.stringify(studentData));
  };

  const handleLogout = () => {
    setStudent(null);
    setIsAuthenticated(false);
    localStorage.removeItem('student');
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
                  <Login onLogin={handleLogin} />
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
                  <Profile student={student!} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App; 