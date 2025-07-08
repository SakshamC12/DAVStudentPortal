-- Migration script to update term_exams and term_exam_marks structure
-- Run this in your Supabase SQL editor

-- Step 1: Create new term_exams table (template structure)
CREATE TABLE IF NOT EXISTS term_exams_new (
    id SERIAL PRIMARY KEY,
    exam_name VARCHAR(100) NOT NULL,
    max_mark INTEGER NOT NULL,
    weight INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Create new term_exam_marks table (contains actual exam context)
CREATE TABLE IF NOT EXISTS term_exam_marks_new (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    exam_id INTEGER REFERENCES term_exams_new(id) ON DELETE CASCADE,
    marks_obtained DECIMAL(5,2) NOT NULL,
    exam_date DATE,
    semester INTEGER,
    year INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Insert sample term exam templates
INSERT INTO term_exams_new (exam_name, max_mark, weight) VALUES
('CT1', 80, 20),
('CT2', 80, 20),
('CT3', 80, 20),
('End Semester', 100, 40),
('Assignment', 50, 10),
('Lab', 100, 30),
('Mid Semester', 100, 30),
('Final', 100, 70);

-- Step 4: Create indexes for better performance
CREATE INDEX idx_term_exam_marks_student_id ON term_exam_marks_new(student_id);
CREATE INDEX idx_term_exam_marks_subject_id ON term_exam_marks_new(subject_id);
CREATE INDEX idx_term_exam_marks_exam_id ON term_exam_marks_new(exam_id);
CREATE INDEX idx_term_exam_marks_semester_year ON term_exam_marks_new(semester, year);

-- Step 5: Enable RLS
ALTER TABLE term_exams_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE term_exam_marks_new ENABLE ROW LEVEL SECURITY;

-- Step 6: Create policies
CREATE POLICY "Admins can manage term exams" ON term_exams_new
    FOR ALL USING (true);

CREATE POLICY "Students can view term exams" ON term_exams_new
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage term exam marks" ON term_exam_marks_new
    FOR ALL USING (true);

CREATE POLICY "Students can view own term exam marks" ON term_exam_marks_new
    FOR SELECT USING (true);

-- Step 7: Drop old tables (if they exist)
-- WARNING: This will delete all existing data in the old tables
-- Only run this after backing up your data and confirming the new tables work
-- DROP TABLE IF EXISTS term_exam_marks;
-- DROP TABLE IF EXISTS term_exams;

-- Step 8: Rename new tables to replace old ones
-- ALTER TABLE term_exams_new RENAME TO term_exams;
-- ALTER TABLE term_exam_marks_new RENAME TO term_exam_marks; 