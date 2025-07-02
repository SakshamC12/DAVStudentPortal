-- Library Tables for DAV Student Portal
-- Run this in your Supabase SQL editor

-- Books table (catalog)
CREATE TABLE books (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn TEXT,
    total_copies INTEGER NOT NULL,
    available_copies INTEGER
);

-- Book borrowings table (records of borrowings)
CREATE TABLE book_borrowings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES students(student_id) ON DELETE CASCADE,
    issue_date DATE NOT NULL,
    return_date DATE NOT NULL,
    actual_return_date DATE,
    late_fee NUMERIC(10,2)
);

-- Create indexes for better performance
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_book_borrowings_student_id ON book_borrowings(student_id);
CREATE INDEX idx_book_borrowings_book_id ON book_borrowings(book_id);
CREATE INDEX idx_book_borrowings_return_date ON book_borrowings(return_date);

-- Enable RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_borrowings ENABLE ROW LEVEL SECURITY;

-- Create policies for secure access
CREATE POLICY "Books are viewable by all" ON books
    FOR SELECT USING (true);

CREATE POLICY "Book borrowings are viewable by all" ON book_borrowings
    FOR SELECT USING (true);

CREATE POLICY "Admins can insert books" ON books
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update books" ON books
    FOR UPDATE USING (true);

CREATE POLICY "Admins can insert borrowings" ON book_borrowings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update borrowings" ON book_borrowings
    FOR UPDATE USING (true);

-- Insert sample books for testing
INSERT INTO books (title, author, isbn, total_copies, available_copies) VALUES
('Introduction to Computer Science', 'John Smith', '978-0123456789', 5, 5),
('Data Structures and Algorithms', 'Jane Doe', '978-0987654321', 3, 3),
('Database Management Systems', 'Bob Johnson', '978-1122334455', 4, 4),
('Web Development Fundamentals', 'Alice Brown', '978-5566778899', 6, 6),
('Machine Learning Basics', 'Charlie Wilson', '978-9988776655', 2, 2),
('Software Engineering Principles', 'Diana Davis', '978-4433221100', 4, 4),
('Computer Networks', 'Eve Miller', '978-6677889900', 3, 3),
('Operating Systems', 'Frank Garcia', '978-1122334455', 5, 5);

-- Insert sample borrowings for testing
INSERT INTO book_borrowings (book_id, student_id, issue_date, return_date) VALUES
((SELECT id FROM books WHERE title = 'Introduction to Computer Science' LIMIT 1), 'DAV2024001', '2024-01-15', '2024-02-15'),
((SELECT id FROM books WHERE title = 'Data Structures and Algorithms' LIMIT 1), 'DAV2024001', '2024-01-20', '2024-02-20'),
((SELECT id FROM books WHERE title = 'Database Management Systems' LIMIT 1), 'DAV2024002', '2024-01-10', '2024-02-10'),
((SELECT id FROM books WHERE title = 'Web Development Fundamentals' LIMIT 1), 'DAV2024003', '2024-01-05', '2024-02-05');

-- Update available copies after borrowings
UPDATE books SET available_copies = available_copies - 1 WHERE id IN (
    SELECT book_id FROM book_borrowings WHERE actual_return_date IS NULL
); 