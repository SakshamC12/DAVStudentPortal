-- Update the student_marks_display view to include semester field
-- Run this in your Supabase SQL editor

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
    m.semester,
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