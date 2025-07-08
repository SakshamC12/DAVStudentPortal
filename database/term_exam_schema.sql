-- Term Exam Schema (Updated Structure)
-- term_exams becomes a template, term_exam_marks contains semester/year context

-- Term Exams table (template structure)
CREATE TABLE term_exams (
    id SERIAL PRIMARY KEY,
    exam_name VARCHAR(100) NOT NULL,
    max_mark INTEGER NOT NULL,
    weight INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Term Exam Marks table (contains actual exam context)
CREATE TABLE term_exam_marks (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    exam_id INTEGER REFERENCES term_exams(id) ON DELETE CASCADE,
    marks_obtained DECIMAL(5,2) NOT NULL,
    exam_date DATE,
    semester INTEGER,
    year INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_term_exam_marks_student_id ON term_exam_marks(student_id);
CREATE INDEX idx_term_exam_marks_subject_id ON term_exam_marks(subject_id);
CREATE INDEX idx_term_exam_marks_exam_id ON term_exam_marks(exam_id);
CREATE INDEX idx_term_exam_marks_semester_year ON term_exam_marks(semester, year);

-- Sample term exam templates
INSERT INTO term_exams (exam_name, max_mark, weight) VALUES
('CT1', 80, 20),
('CT2', 80, 20),
('CT3', 80, 20),
('End Semester', 100, 40),
('Assignment', 50, 10),
('Lab', 100, 30),
('Mid Semester', 100, 30),
('Final', 100, 70);

-- Enable RLS
ALTER TABLE term_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE term_exam_marks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage term exams" ON term_exams
    FOR ALL USING (true); -- In production, add proper admin authentication

CREATE POLICY "Students can view term exams" ON term_exams
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage term exam marks" ON term_exam_marks
    FOR ALL USING (true); -- In production, add proper admin authentication

CREATE POLICY "Students can view own term exam marks" ON term_exam_marks
    FOR SELECT USING (true); -- In production, add proper student authentication 