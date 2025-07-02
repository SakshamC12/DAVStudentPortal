-- Library Safety Constraints and Validation
-- Run this in your Supabase SQL editor after the main library_schema.sql

-- 1. Prevent negative available copies
ALTER TABLE books 
ADD CONSTRAINT check_available_copies 
CHECK (available_copies >= 0);

-- 2. Ensure available copies don't exceed total copies
ALTER TABLE books 
ADD CONSTRAINT check_copies_logic 
CHECK (available_copies <= total_copies);

-- 3. Ensure return date is after issue date
ALTER TABLE book_borrowings 
ADD CONSTRAINT check_date_logic 
CHECK (return_date >= issue_date);

-- 4. Ensure actual return date is after issue date (if provided)
ALTER TABLE book_borrowings 
ADD CONSTRAINT check_actual_return_date 
CHECK (actual_return_date IS NULL OR actual_return_date >= issue_date);

-- 5. Function to verify copy counts are correct
CREATE OR REPLACE FUNCTION verify_book_copies()
RETURNS TABLE(book_id UUID, book_title TEXT, expected_available INTEGER, actual_available INTEGER, discrepancy INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.title,
        b.total_copies - COUNT(bb.id) as expected_available,
        b.available_copies as actual_available,
        (b.total_copies - COUNT(bb.id)) - b.available_copies as discrepancy
    FROM books b
    LEFT JOIN book_borrowings bb ON b.id = bb.book_id AND bb.actual_return_date IS NULL
    GROUP BY b.id, b.title, b.total_copies, b.available_copies
    HAVING b.available_copies != (b.total_copies - COUNT(bb.id));
END;
$$ LANGUAGE plpgsql;

-- 6. Function to fix copy count discrepancies
CREATE OR REPLACE FUNCTION fix_book_copies()
RETURNS INTEGER AS $$
DECLARE
    fixed_count INTEGER := 0;
    book_record RECORD;
BEGIN
    FOR book_record IN 
        SELECT 
            b.id,
            b.total_copies - COUNT(bb.id) as correct_available
        FROM books b
        LEFT JOIN book_borrowings bb ON b.id = bb.book_id AND bb.actual_return_date IS NULL
        GROUP BY b.id, b.total_copies, b.available_copies
        HAVING b.available_copies != (b.total_copies - COUNT(bb.id))
    LOOP
        UPDATE books 
        SET available_copies = book_record.correct_available
        WHERE id = book_record.id;
        fixed_count := fixed_count + 1;
    END LOOP;
    
    RETURN fixed_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Function to get overdue books with late fees
CREATE OR REPLACE FUNCTION get_overdue_books()
RETURNS TABLE(
    borrowing_id UUID,
    student_id TEXT,
    student_name TEXT,
    book_title TEXT,
    issue_date DATE,
    return_date DATE,
    days_overdue INTEGER,
    late_fee NUMERIC(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bb.id,
        bb.student_id,
        s.name as student_name,
        b.title as book_title,
        bb.issue_date,
        bb.return_date,
        CURRENT_DATE - bb.return_date as days_overdue,
        (CURRENT_DATE - bb.return_date) * 5 as late_fee
    FROM book_borrowings bb
    JOIN books b ON bb.book_id = b.id
    JOIN students s ON bb.student_id = s.student_id
    WHERE bb.actual_return_date IS NULL 
    AND bb.return_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 8. Function to calculate late fee for a specific borrowing
CREATE OR REPLACE FUNCTION calculate_late_fee(borrowing_uuid UUID)
RETURNS NUMERIC(10,2) AS $$
DECLARE
    return_date_val DATE;
    actual_return_date_val DATE;
    days_late INTEGER;
BEGIN
    SELECT bb.return_date, bb.actual_return_date 
    INTO return_date_val, actual_return_date_val
    FROM book_borrowings bb
    WHERE bb.id = borrowing_uuid;
    
    IF actual_return_date_val IS NULL THEN
        -- Book not returned yet, calculate based on current date
        days_late := GREATEST(0, CURRENT_DATE - return_date_val);
    ELSE
        -- Book returned, calculate based on actual return date
        days_late := GREATEST(0, actual_return_date_val - return_date_val);
    END IF;
    
    RETURN days_late * 5; -- ₹5 per day
END;
$$ LANGUAGE plpgsql;

-- 9. View for library statistics
CREATE OR REPLACE VIEW library_stats AS
SELECT 
    COUNT(DISTINCT b.id) as total_books,
    SUM(b.total_copies) as total_copies,
    SUM(b.available_copies) as total_available,
    COUNT(DISTINCT bb.id) as total_borrowings,
    COUNT(DISTINCT CASE WHEN bb.actual_return_date IS NULL THEN bb.id END) as active_borrowings,
    COUNT(DISTINCT CASE WHEN bb.actual_return_date IS NOT NULL THEN bb.id END) as returned_books,
    COUNT(DISTINCT CASE WHEN bb.return_date < CURRENT_DATE AND bb.actual_return_date IS NULL THEN bb.id END) as overdue_books
FROM books b
LEFT JOIN book_borrowings bb ON b.id = bb.book_id;

-- 10. View for student borrowing summary
CREATE OR REPLACE VIEW student_borrowing_summary AS
SELECT 
    s.student_id,
    s.name,
    s.department,
    COUNT(bb.id) as total_borrowings,
    COUNT(CASE WHEN bb.actual_return_date IS NULL THEN bb.id END) as active_borrowings,
    COUNT(CASE WHEN bb.actual_return_date IS NOT NULL THEN bb.id END) as returned_books,
    COUNT(CASE WHEN bb.return_date < CURRENT_DATE AND bb.actual_return_date IS NULL THEN bb.id END) as overdue_books,
    SUM(calculate_late_fee(bb.id)) as total_late_fees
FROM students s
LEFT JOIN book_borrowings bb ON s.student_id = bb.student_id
GROUP BY s.student_id, s.name, s.department; 