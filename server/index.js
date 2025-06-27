const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1); // Trust first proxy for rate limiting

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'DAV Student Portal API is running' });
});

// Student authentication endpoint
app.post('/api/auth/student', async (req, res) => {
  try {
    const { studentId, dateOfBirth } = req.body;

    if (!studentId || !dateOfBirth) {
      return res.status(400).json({ 
        error: 'Student ID and Date of Birth are required' 
      });
    }

    // Query the students table to verify credentials
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('student_id', studentId)
      .eq('date_of_birth', dateOfBirth)
      .single();

    if (error || !student) {
      return res.status(401).json({ 
        error: 'Invalid Student ID or Date of Birth' 
      });
    }

    // Return student info (without sensitive data)
    res.json({
      success: true,
      student: {
        id: student.id,
        studentId: student.student_id,
        name: student.name,
        email: student.email,
        department: student.department,
        year: student.year
      }
    });

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student marks endpoint
app.post('/api/marks', async (req, res) => {
  try {
    const { studentId, dateOfBirth } = req.body;

    if (!studentId || !dateOfBirth) {
      return res.status(400).json({ 
        error: 'Student ID and Date of Birth are required' 
      });
    }

    // First verify the student exists
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('student_id')
      .eq('student_id', studentId)
      .eq('date_of_birth', dateOfBirth)
      .single();

    if (studentError || !student) {
      return res.status(401).json({ 
        error: 'Invalid Student ID or Date of Birth' 
      });
    }

    // Fetch marks from the view
    const { data: marks, error: marksError } = await supabase
      .from('student_marks_display')
      .select('*')
      .eq('student_id', studentId);

    if (marksError) {
      console.error('Error fetching marks:', marksError);
      return res.status(500).json({ error: 'Error fetching marks' });
    }

    res.json({
      success: true,
      marks: marks || []
    });

  } catch (error) {
    console.error('Marks retrieval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student profile endpoint
app.post('/api/profile', async (req, res) => {
  try {
    const { studentId, dateOfBirth } = req.body;

    if (!studentId || !dateOfBirth) {
      return res.status(400).json({ 
        error: 'Student ID and Date of Birth are required' 
      });
    }

    const { data: student, error } = await supabase
      .from('students')
      .select(`
        id,
        student_id,
        name,
        email,
        department,
        year,
        semester,
        date_of_birth,
        phone,
        address
      `)
      .eq('student_id', studentId)
      .eq('date_of_birth', dateOfBirth)
      .single();

    if (error || !student) {
      return res.status(401).json({ 
        error: 'Invalid Student ID or Date of Birth' 
      });
    }

    res.json({
      success: true,
      profile: student
    });

  } catch (error) {
    console.error('Profile retrieval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 DAV Student Portal API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
}); 