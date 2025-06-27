-- DAV Student Portal Database Schema (Updated)
-- This file contains the SQL schema for the student portal database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Students table
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    date_of_birth DATE NOT NULL,
    phone VARCHAR(15),
    address TEXT
);

-- Subjects table (with max_mark and pass_mark)
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    subject_code VARCHAR(20) UNIQUE NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    credits INTEGER NOT NULL,
    max_mark INTEGER NOT NULL,
    pass_mark INTEGER NOT NULL
);

-- Marks table (no created_at/updated_at)
CREATE TABLE marks (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    marks_obtained DECIMAL(5,2) NOT NULL,
    exam_date DATE
);

-- Create indexes for better performance
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_department ON students(department);
CREATE INDEX idx_marks_student_id ON marks(student_id);
CREATE INDEX idx_marks_semester ON marks(semester);
CREATE INDEX idx_subjects_department ON subjects(department);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marks_updated_at BEFORE UPDATE ON marks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing

-- Sample students
INSERT INTO students (student_id, name, email, department, year, semester, date_of_birth, phone, address) VALUES
('DAV2024001', 'Saksham Chaturvedi', 'saksham.c@davcollege.edu', 'Computer Science', 2, 4, '2005-03-12', '+91-9876543210', 'OMR, Chennai, Tamil Nadu'),
('DAV2024002', 'Shamsher Sirohi', 'shamsher.s@davcollege.edu', 'Law', 2, 3, '2004-11-21', '+91-8711910288', 'Whitefield, Bangalore, Karnataka'),
('DAV2024003', 'Akshaj Deepak', 'akshaj.d@davcollege.edu', 'Mechanical', 1, 1, '2005-06-10', '+91-3788110092', 'Rover Street, Trivandrum, Kerala');

-- Sample subjects (with max_mark and pass_mark)
INSERT INTO subjects (subject_code, subject_name, department, credits, max_mark, pass_mark) VALUES
('21MAB204T', 'PROBABILITY AND QUEUEING THEORY', 'Computer Science', 4, 100, 50),
('21CSC204J', 'DESIGN AND ANALYSIS OF ALGORITHMS', 'Computer Science', 4, 100, 50),
('21CSC205P', 'DATABASE MANAGEMENT SYSTEMS', 'Computer Science', 4, 100, 50),
('21CSC206T', 'ARTIFICIAL INTELLIGENCE', 'Computer Science', 3, 100, 50),
('21CSE253T', 'INTERNET OF THINGS', 'Computer Science', 3, 100, 50),
('21PDH209T', 'SOCIAL ENGINEERING', 'Computer Science', 2, 100, 50),
('21LEM202T', 'UNIVERSAL HUMAN VALUES - II: UNDERSTANDING HARMONY AND ETHICAL HUMAN CONDUCT', 'Computer Science', 3, 100, 50),
('21LAWADR1', 'Alternative Dispute Resolution', 'Law', 3, 100, 50),
('21LAWIPR2', 'Intellectual Property Rights', 'Law', 3, 90, 45),
('21LAWECO3', 'Legal Economics', 'Law', 3, 100, 50),
('21LAWSOC4', 'Sociology of Law', 'Law', 3, 100, 50),
('21MECTHE1', 'Thermal Engineering', 'Mechanical', 3, 100, 50),
('21MECMAN2', 'Manufacturing Processes', 'Mechanical', 3, 100, 50),
('21MECDYN3', 'Engineering Dynamics', 'Mechanical', 3, 90, 45),
('21MECMAT4', 'Materials Science', 'Mechanical', 3, 100, 50);

-- Sample marks for John Doe (DAV2024001)
INSERT INTO marks (student_id, subject_id, semester, marks_obtained, exam_date) VALUES
(1, 1, 4, 95, '2025-05-10'),
(1, 2, 4, 90, '2025-05-12'),
(1, 3, 4, 88, '2025-05-14'),
(1, 4, 4, 87, '2025-05-16'),
(1, 5, 4, 85, '2025-05-18'),
(1, 6, 4, 80, '2025-05-20'),
(1, 7, 4, 95, '2025-05-22'),
-- Shamsher (Law)
(2, 8, 3, 74, '2024-04-25'), -- Alternative Dispute Resolution
(2, 9, 3, 66, '2024-04-27'), -- Intellectual Property Rights
(2, 10, 3, 81, '2024-04-29'), -- Legal Economics
(2, 11, 3, 72, '2024-05-01'), -- Sociology of Law

-- Akshaj (Mech)
(3, 12, 1, 68, '2024-01-25'), -- Thermal Engineering
(3, 13, 1, 71, '2024-01-27'), -- Manufacturing Processes
(3, 14, 1, 62, '2024-01-29'), -- Engineering Dynamics
(3, 15, 1, 76, '2024-02-01'); -- Materials Science;

-- View for display with grade and pass/fail logic
CREATE OR REPLACE VIEW student_marks_display AS
SELECT
    st.student_id,
    s.subject_code,
    s.subject_name,
    s.credits,
    s.max_mark,
    s.pass_mark,
    m.marks_obtained,
    m.exam_date,
    CASE
        WHEN m.marks_obtained < s.pass_mark THEN 'F'
        WHEN (m.marks_obtained / s.max_mark) * 100 >= 85 THEN 'A'
        WHEN (m.marks_obtained / s.max_mark) * 100 >= 70 THEN 'B'
        WHEN (m.marks_obtained / s.max_mark) * 100 >= 50 THEN 'C'
        WHEN (m.marks_obtained >= s.pass_mark) THEN 'D'
        ELSE 'F'
    END AS grade,
    CASE
        WHEN m.marks_obtained >= s.pass_mark THEN 'PASS'
        ELSE 'FAIL'
    END AS result
FROM marks m
JOIN students st ON m.student_id = st.id
JOIN subjects s ON m.subject_id = s.id;

-- Grant necessary permissions (adjust as needed for your Supabase setup)
-- These are example permissions - adjust based on your RLS policies
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Create policies for secure access
-- Students can only view their own data
CREATE POLICY "Students can view own data" ON students
    FOR SELECT USING (true); -- In production, add proper authentication checks

CREATE POLICY "Students can view own marks" ON marks
    FOR SELECT USING (true); -- In production, add proper authentication checks

CREATE POLICY "Students can view subjects" ON subjects
    FOR SELECT USING (true); 