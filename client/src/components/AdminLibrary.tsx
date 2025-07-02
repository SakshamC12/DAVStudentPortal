import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BookOpen, Plus, Users, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  total_copies: number;
  available_copies?: number;
}

interface Student {
  id: number;
  student_id: string;
  name: string;
  email: string;
  department: string;
  year: number;
}

interface BookBorrowing {
  id: string;
  book_id: string;
  student_id: string;
  issue_date: string;
  return_date: string;
  actual_return_date?: string;
  late_fee?: number;
  book: Book;
  student: Student;
}

const AdminLibrary: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [borrowings, setBorrowings] = useState<BookBorrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'books' | 'borrowings'>('books');
  
  // Book management
  const [showAddBook, setShowAddBook] = useState(false);
  const [showEditBook, setShowEditBook] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    total_copies: '',
  });

  // Borrowing management
  const [showAddBorrowing, setShowAddBorrowing] = useState(false);
  const [showEditBorrowing, setShowEditBorrowing] = useState(false);
  const [editingBorrowing, setEditingBorrowing] = useState<BookBorrowing | null>(null);
  const [newBorrowing, setNewBorrowing] = useState({
    student_id: '',
    book_id: '',
    issue_date: '',
    return_date: '',
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch books
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select('*')
        .order('title');
      
      if (booksError) throw booksError;
      setBooks(booksData || []);

      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('name');
      
      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Fetch borrowings with book and student info
      const { data: borrowingsData, error: borrowingsError } = await supabase
        .from('book_borrowings')
        .select(`
          *,
          book:books(*),
          student:students(*)
        `)
        .order('issue_date', { ascending: false });
      
      if (borrowingsError) throw borrowingsError;
      setBorrowings(borrowingsData || []);

    } catch (err: any) {
      setError('Failed to fetch data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBook.title || !newBook.author || !newBook.total_copies) {
      setError('Please fill all required fields');
      return;
    }

    try {
      const { error } = await supabase.from('books').insert({
        title: newBook.title,
        author: newBook.author,
        isbn: newBook.isbn || null,
        total_copies: parseInt(newBook.total_copies),
        available_copies: parseInt(newBook.total_copies),
      });

      if (error) throw error;

      setNewBook({ title: '', author: '', isbn: '', total_copies: '' });
      setShowAddBook(false);
      fetchData();
    } catch (err: any) {
      setError('Failed to add book: ' + err.message);
    }
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setNewBook({
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      total_copies: book.total_copies.toString(),
    });
    setShowEditBook(true);
    setShowAddBook(false);
  };

  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook || !newBook.title || !newBook.author || !newBook.total_copies) {
      setError('Please fill all required fields');
      return;
    }

    // Validate total copies
    const newTotalCopies = parseInt(newBook.total_copies);
    const currentBorrowed = editingBook.total_copies - (editingBook.available_copies || editingBook.total_copies);
    
    if (newTotalCopies < currentBorrowed) {
      setError(`Cannot reduce total copies below ${currentBorrowed} (currently borrowed)`);
      return;
    }

    try {
      const { error } = await supabase.from('books').update({
        title: newBook.title,
        author: newBook.author,
        isbn: newBook.isbn || null,
        total_copies: newTotalCopies,
        available_copies: newTotalCopies - currentBorrowed,
      }).eq('id', editingBook.id);

      if (error) throw error;

      setNewBook({ title: '', author: '', isbn: '', total_copies: '' });
      setShowEditBook(false);
      setEditingBook(null);
      fetchData();
    } catch (err: any) {
      setError('Failed to update book: ' + err.message);
    }
  };

  const handleAddBorrowing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBorrowing.student_id || !newBorrowing.book_id || !newBorrowing.issue_date || !newBorrowing.return_date) {
      setError('Please fill all required fields');
      return;
    }

    // Validate that copies are available
    const selectedBook = books.find(b => b.id === newBorrowing.book_id);
    if (selectedBook && (selectedBook.available_copies || 0) <= 0) {
      setError('No copies available for borrowing');
      return;
    }

    // Validate dates
    const issueDate = new Date(newBorrowing.issue_date);
    const returnDate = new Date(newBorrowing.return_date);
    if (returnDate <= issueDate) {
      setError('Return date must be after issue date');
      return;
    }

    try {
      const { error } = await supabase.from('book_borrowings').insert({
        student_id: newBorrowing.student_id,
        book_id: newBorrowing.book_id,
        issue_date: newBorrowing.issue_date,
        return_date: newBorrowing.return_date,
      });

      if (error) throw error;

      // Update available copies
      const book = books.find(b => b.id === newBorrowing.book_id);
      if (book && book.available_copies !== undefined) {
        await supabase
          .from('books')
          .update({ available_copies: book.available_copies - 1 })
          .eq('id', newBorrowing.book_id);
      }

      setNewBorrowing({ student_id: '', book_id: '', issue_date: '', return_date: '' });
      setShowAddBorrowing(false);
      fetchData();
    } catch (err: any) {
      setError('Failed to add borrowing: ' + err.message);
    }
  };

  const handleEditBorrowing = (borrowing: BookBorrowing) => {
    setEditingBorrowing(borrowing);
    setNewBorrowing({
      student_id: borrowing.student_id,
      book_id: borrowing.book_id,
      issue_date: borrowing.issue_date,
      return_date: borrowing.return_date,
    });
    setShowEditBorrowing(true);
    setShowAddBorrowing(false);
  };

  const handleUpdateBorrowing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBorrowing || !newBorrowing.student_id || !newBorrowing.book_id || !newBorrowing.issue_date || !newBorrowing.return_date) {
      setError('Please fill all required fields');
      return;
    }

    // Validate dates
    const issueDate = new Date(newBorrowing.issue_date);
    const returnDate = new Date(newBorrowing.return_date);
    if (returnDate <= issueDate) {
      setError('Return date must be after issue date');
      return;
    }

    // If book_id changed, validate that new book has available copies
    if (editingBorrowing.book_id !== newBorrowing.book_id) {
      const newBook = books.find(b => b.id === newBorrowing.book_id);
      if (newBook && (newBook.available_copies || 0) <= 0) {
        setError('No copies available for the selected book');
        return;
      }
    }

    try {
      // If book_id changed, update available copies for both old and new books
      if (editingBorrowing.book_id !== newBorrowing.book_id) {
        // Return copy to old book
        const oldBook = books.find(b => b.id === editingBorrowing.book_id);
        if (oldBook && oldBook.available_copies !== undefined) {
          await supabase
            .from('books')
            .update({ available_copies: oldBook.available_copies + 1 })
            .eq('id', editingBorrowing.book_id);
        }

        // Borrow copy from new book
        const newBook = books.find(b => b.id === newBorrowing.book_id);
        if (newBook && newBook.available_copies !== undefined) {
          await supabase
            .from('books')
            .update({ available_copies: newBook.available_copies - 1 })
            .eq('id', newBorrowing.book_id);
        }
      }

      const { error } = await supabase.from('book_borrowings').update({
        student_id: newBorrowing.student_id,
        book_id: newBorrowing.book_id,
        issue_date: newBorrowing.issue_date,
        return_date: newBorrowing.return_date,
      }).eq('id', editingBorrowing.id);

      if (error) throw error;

      setNewBorrowing({ student_id: '', book_id: '', issue_date: '', return_date: '' });
      setShowEditBorrowing(false);
      setEditingBorrowing(null);
      fetchData();
    } catch (err: any) {
      setError('Failed to update borrowing: ' + err.message);
    }
  };

  const handleReturnBook = async (borrowingId: string, bookId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Mark as returned
      const { error: returnError } = await supabase
        .from('book_borrowings')
        .update({ actual_return_date: today })
        .eq('id', borrowingId);

      if (returnError) throw returnError;

      // Update available copies
      const book = books.find(b => b.id === bookId);
      if (book && book.available_copies !== undefined) {
        await supabase
          .from('books')
          .update({ available_copies: book.available_copies + 1 })
          .eq('id', bookId);
      }

      fetchData();
    } catch (err: any) {
      setError('Failed to return book: ' + err.message);
    }
  };

  const calculateLateFee = (returnDate: string, actualReturnDate?: string): number => {
    const msPerDay = 1000 * 60 * 60 * 24;
    const today = new Date();
    const returnDateObj = new Date(returnDate);
    const actualReturn = actualReturnDate ? new Date(actualReturnDate) : today;

    // Zero out the time part
    actualReturn.setHours(0,0,0,0);
    returnDateObj.setHours(0,0,0,0);

    const daysLate = Math.max(0, Math.floor((actualReturn.getTime() - returnDateObj.getTime()) / msPerDay));
    return daysLate * 5; // ₹5 per day late fee
  };

  const isOverdue = (returnDate: string, actualReturnDate?: string): boolean => {
    if (actualReturnDate) return false;
    const today = new Date();
    const returnDateObj = new Date(returnDate);
    return today > returnDateObj;
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="card" style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
        <h1 className="text-2xl font-bold mb-4">Library Management</h1>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #eee' }}>
          <button
            onClick={() => setActiveTab('books')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: activeTab === 'books' ? '#a6192e' : 'transparent',
              color: activeTab === 'books' ? '#fff' : '#333',
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: activeTab === 'books' ? '2px solid #a6192e' : '2px solid transparent',
            }}
          >
            <BookOpen size={18} style={{ marginRight: '0.5rem' }} />
            Book Catalog
          </button>
          <button
            onClick={() => setActiveTab('borrowings')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: activeTab === 'borrowings' ? '#a6192e' : 'transparent',
              color: activeTab === 'borrowings' ? '#fff' : '#333',
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: activeTab === 'borrowings' ? '2px solid #a6192e' : '2px solid transparent',
            }}
          >
            <Users size={18} style={{ marginRight: '0.5rem' }} />
            Borrowings
          </button>
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}

        {/* Book Catalog Tab */}
        {activeTab === 'books' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="text-xl font-bold">Book Catalog</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    setShowAddBook(!showAddBook);
                    setShowEditBook(false);
                    setEditingBook(null);
                  }}
                  className="btn"
                  style={{ background: '#a6192e', color: '#fff' }}
                >
                  <Plus size={18} style={{ marginRight: '0.5rem' }} />
                  {showAddBook ? 'Cancel' : 'Add Book'}
                </button>
              </div>
            </div>

            {showAddBook && (
              <form onSubmit={handleAddBook} className="card mb-6" style={{ background: '#f7e6e9' }}>
                <h3 className="text-lg font-bold mb-4">Add New Book</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newBook.title}
                      onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Author *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newBook.author}
                      onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ISBN</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newBook.isbn}
                      onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Copies *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newBook.total_copies}
                      onChange={(e) => setNewBook({ ...newBook, total_copies: e.target.value })}
                      min="1"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn mt-4" style={{ background: '#a6192e', color: '#fff' }}>
                  Add Book
                </button>
              </form>
            )}

            {showEditBook && editingBook && (
              <form onSubmit={handleUpdateBook} className="card mb-6" style={{ background: '#f7e6e9' }}>
                <h3 className="text-lg font-bold mb-4">Edit Book: {editingBook.title}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newBook.title}
                      onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Author *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newBook.author}
                      onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ISBN</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newBook.isbn}
                      onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Copies *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newBook.total_copies}
                      onChange={(e) => setNewBook({ ...newBook, total_copies: e.target.value })}
                      min="1"
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" className="btn mt-4" style={{ background: '#a6192e', color: '#fff' }}>
                    Update Book
                  </button>
                  <button 
                    type="button" 
                    className="btn mt-4" 
                    style={{ background: '#6b7280', color: '#fff' }}
                    onClick={() => {
                      setShowEditBook(false);
                      setEditingBook(null);
                      setNewBook({ title: '', author: '', isbn: '', total_copies: '' });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {books.length === 0 ? (
              <div className="card text-center">
                <BookOpen size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No Books Found</h3>
                <p className="text-gray-600">No books have been added to the catalog yet.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="marks-table" style={{ minWidth: 700, width: '100%' }}>
                  <thead>
                                      <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>ISBN</th>
                    <th>Total Copies</th>
                    <th>Available</th>
                    <th>Borrowed</th>
                    <th>Actions</th>
                  </tr>
                  </thead>
                  <tbody>
                    {books.map((book) => (
                    <tr key={book.id}>
                      <td style={{ fontWeight: 600 }}>{book.title}</td>
                      <td>{book.author}</td>
                      <td>{book.isbn || '-'}</td>
                      <td>{book.total_copies}</td>
                      <td>{book.available_copies || book.total_copies}</td>
                                          <td>{(book.total_copies - (book.available_copies || book.total_copies))}</td>
                    <td>
                      <button
                        onClick={() => handleEditBook(book)}
                        className="btn btn-sm"
                        style={{ background: '#3b82f6', color: '#fff' }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        )}

        {/* Borrowings Tab */}
        {activeTab === 'borrowings' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="text-xl font-bold">Book Borrowings</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    setShowAddBorrowing(!showAddBorrowing);
                    setShowEditBorrowing(false);
                    setEditingBorrowing(null);
                  }}
                  className="btn"
                  style={{ background: '#a6192e', color: '#fff' }}
                >
                  <Plus size={18} style={{ marginRight: '0.5rem' }} />
                  {showAddBorrowing ? 'Cancel' : 'Record Borrowing'}
                </button>
              </div>
            </div>

            {showAddBorrowing && (
              <form onSubmit={handleAddBorrowing} className="card mb-6" style={{ background: '#f7e6e9' }}>
                <h3 className="text-lg font-bold mb-4">Record New Borrowing</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Student *</label>
                    <select
                      className="form-input"
                      value={newBorrowing.student_id}
                      onChange={(e) => setNewBorrowing({ ...newBorrowing, student_id: e.target.value })}
                      required
                    >
                      <option value="">Select Student</option>
                      {students.map((student) => (
                        <option key={student.student_id} value={student.student_id}>
                          {student.name} ({student.student_id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Book *</label>
                    <select
                      className="form-input"
                      value={newBorrowing.book_id}
                      onChange={(e) => setNewBorrowing({ ...newBorrowing, book_id: e.target.value })}
                      required
                    >
                      <option value="">Select Book</option>
                      {books.filter(book => (book.available_copies || book.total_copies) > 0).map((book) => (
                        <option key={book.id} value={book.id}>
                          {book.title} by {book.author} ({book.available_copies || book.total_copies} available)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Issue Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newBorrowing.issue_date}
                      onChange={(e) => setNewBorrowing({ ...newBorrowing, issue_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Return Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newBorrowing.return_date}
                      onChange={(e) => setNewBorrowing({ ...newBorrowing, return_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn mt-4" style={{ background: '#a6192e', color: '#fff' }}>
                  Record Borrowing
                </button>
              </form>
            )}

            {showEditBorrowing && editingBorrowing && (
              <form onSubmit={handleUpdateBorrowing} className="card mb-6" style={{ background: '#f7e6e9' }}>
                <h3 className="text-lg font-bold mb-4">Edit Borrowing</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Student *</label>
                    <select
                      className="form-input"
                      value={newBorrowing.student_id}
                      onChange={(e) => setNewBorrowing({ ...newBorrowing, student_id: e.target.value })}
                      required
                    >
                      <option value="">Select Student</option>
                      {students.map((student) => (
                        <option key={student.student_id} value={student.student_id}>
                          {student.name} ({student.student_id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Book *</label>
                    <select
                      className="form-input"
                      value={newBorrowing.book_id}
                      onChange={(e) => setNewBorrowing({ ...newBorrowing, book_id: e.target.value })}
                      required
                    >
                      <option value="">Select Book</option>
                      {books.map((book) => (
                        <option key={book.id} value={book.id}>
                          {book.title} by {book.author} ({book.available_copies || book.total_copies} available)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Issue Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newBorrowing.issue_date}
                      onChange={(e) => setNewBorrowing({ ...newBorrowing, issue_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Return Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newBorrowing.return_date}
                      onChange={(e) => setNewBorrowing({ ...newBorrowing, return_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" className="btn mt-4" style={{ background: '#a6192e', color: '#fff' }}>
                    Update Borrowing
                  </button>
                  <button 
                    type="button" 
                    className="btn mt-4" 
                    style={{ background: '#6b7280', color: '#fff' }}
                    onClick={() => {
                      setShowEditBorrowing(false);
                      setEditingBorrowing(null);
                      setNewBorrowing({ student_id: '', book_id: '', issue_date: '', return_date: '' });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {borrowings.length === 0 ? (
              <div className="card text-center">
                <BookOpen size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No Borrowings Found</h3>
                <p className="text-gray-600">No book borrowings have been recorded yet.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="marks-table" style={{ minWidth: 800, width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Book</th>
                      <th>Issue Date</th>
                      <th>Return Date</th>
                      <th>Status</th>
                      <th>Late Fee</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {borrowings.map((borrowing) => {
                    const lateFee = calculateLateFee(borrowing.return_date, borrowing.actual_return_date);
                    const overdue = isOverdue(borrowing.return_date, borrowing.actual_return_date);
                    
                    return (
                      <tr key={borrowing.id}>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600 }}>{borrowing.student?.name || 'Unknown Student'}</div>
                            <div style={{ fontSize: '0.85rem', color: '#666' }}>{borrowing.student?.student_id || borrowing.student_id}</div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600 }}>{borrowing.book?.title || 'Unknown Book'}</div>
                            <div style={{ fontSize: '0.85rem', color: '#666' }}>by {borrowing.book?.author || 'Unknown Author'}</div>
                          </div>
                        </td>
                        <td>{new Date(borrowing.issue_date).toLocaleDateString()}</td>
                        <td>
                          <div>
                            <div>{new Date(borrowing.return_date).toLocaleDateString()}</div>
                            {borrowing.actual_return_date && (
                              <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                Returned: {new Date(borrowing.actual_return_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {borrowing.actual_return_date ? (
                              <CheckCircle size={16} color="#10b981" />
                            ) : overdue ? (
                              <AlertTriangle size={16} color="#ef4444" />
                            ) : (
                              <Calendar size={16} color="#f59e0b" />
                            )}
                            <span className={`badge ${borrowing.actual_return_date ? 'badge-success' : overdue ? 'badge-danger' : 'badge-warning'}`}>
                              {borrowing.actual_return_date ? 'Returned' : overdue ? 'Overdue' : 'Borrowed'}
                            </span>
                          </div>
                        </td>
                        <td>
                          {lateFee > 0 ? (
                            <span style={{ color: '#ef4444', fontWeight: 600 }}>₹{lateFee}</span>
                          ) : (
                            <span style={{ color: '#10b981' }}>₹0</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleEditBorrowing(borrowing)}
                              className="btn btn-sm"
                              style={{ background: '#3b82f6', color: '#fff' }}
                            >
                              Edit
                            </button>
                            {!borrowing.actual_return_date && (
                              <button
                                onClick={() => handleReturnBook(borrowing.id, borrowing.book_id)}
                                className="btn btn-sm"
                                style={{ background: '#10b981', color: '#fff' }}
                              >
                                Mark Returned
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLibrary; 