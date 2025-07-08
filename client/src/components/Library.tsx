import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BookOpen, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
// Remove: import { Modal, Button, Select } from 'antd';

interface Student {
  id: number;
  studentId: string;
  name: string;
  email: string;
  department: string;
  year: number;
  dateOfBirth: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  total_copies: number;
  available_copies?: number;
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
}

interface LibraryProps {
  student: Student;
}

const Library: React.FC<LibraryProps> = ({ student }) => {
  const [borrowings, setBorrowings] = useState<BookBorrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const borrowDurations = [
    { label: '1 month', value: '1 month', days: 30 },
    { label: '3 weeks', value: '3 weeks', days: 21 },
    { label: '2 weeks', value: '2 weeks', days: 14 },
    { label: '1 week', value: '1 week', days: 7 },
  ];

  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);
  const [bookRequests, setBookRequests] = useState<any[]>([]);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string>('1 month');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState('');

  // Add state for search
  const [searchAvailable, setSearchAvailable] = useState('');

  useEffect(() => {
    fetchBorrowings();
    fetchAvailableBooks();
    fetchBookRequests();
    // eslint-disable-next-line
  }, []);

  const fetchBorrowings = async () => {
    try {
      const { data, error } = await supabase
        .from('book_borrowings')
        .select(`
          *,
          book:books(*)
        `)
        .eq('student_id', student.studentId);
      
      if (error) {
        setError('Failed to fetch library records');
      } else {
        setBorrowings(data || []);
      }
    } catch (err: any) {
      setError('Failed to fetch library records');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableBooks = async () => {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .gt('available_copies', 0)
      .order('title');
    if (!error) setAvailableBooks(data || []);
  };

  const fetchBookRequests = async () => {
    const { data, error } = await supabase
      .from('book_requests')
      .select('*, book:books(title, author)')
      .eq('student_id', student.studentId)
      .order('request_date', { ascending: false });
    if (!error) {
      setBookRequests(data || []);
      console.log('Fetched book requests:', data);
    }
  };

  const openRequestModal = (book: Book) => {
    setSelectedBook(book);
    setSelectedDuration('1 month');
    setRequestModalOpen(true);
    setRequestError('');
  };

  const handleRequestSubmit = async () => {
    if (!selectedBook) return;
    setRequestLoading(true);
    setRequestError('');
    const { error } = await supabase.from('book_requests').insert({
      book_id: selectedBook.id,
      student_id: student.studentId,
      requested_duration: selectedDuration,
      status: 'pending',
    });
    setRequestLoading(false);
    if (error) {
      setRequestError('Failed to submit request.');
    } else {
      setRequestModalOpen(false);
      fetchBookRequests();
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
    if (actualReturnDate) return false; // Already returned
    const today = new Date();
    const returnDateObj = new Date(returnDate);
    return today > returnDateObj;
  };

  const getStatusIcon = (returnDate: string, actualReturnDate?: string) => {
    if (actualReturnDate) {
      return <CheckCircle size={16} color="#10b981" />;
    } else if (isOverdue(returnDate)) {
      return <AlertTriangle size={16} color="#ef4444" />;
    } else {
      return <Clock size={16} color="#f59e0b" />;
    }
  };

  const getStatusText = (returnDate: string, actualReturnDate?: string) => {
    if (actualReturnDate) {
      return 'Returned';
    } else if (isOverdue(returnDate)) {
      return 'Overdue';
    } else {
      return 'Borrowed';
    }
  };

  const getStatusClass = (returnDate: string, actualReturnDate?: string) => {
    if (actualReturnDate) {
      return 'badge-success';
    } else if (isOverdue(returnDate)) {
      return 'badge-danger';
    } else {
      return 'badge-warning';
    }
  };

  // Filter available books by search
  const filteredAvailableBooks = availableBooks.filter(book =>
    book.title.toLowerCase().includes(searchAvailable.toLowerCase()) ||
    book.author.toLowerCase().includes(searchAvailable.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-8">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Library Records Card with header */}
      <div className="card" style={{ padding: 0, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ background: '#a6192e', color: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: '1.5rem 2rem 1rem 2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 0 }}>Library Records</h1>
          <p style={{ fontSize: '1.1rem', marginTop: 4, opacity: 0.95 }}>View your borrowed books, due dates, and late fees</p>
          <div style={{ marginTop: 12, fontSize: '1.1rem', fontWeight: 500, display: 'flex', gap: '2.5rem' }}>
            <div><span style={{ color: '#fff', fontWeight: 700 }}>Student ID:</span> {student.studentId}</div>
            <div><span style={{ color: '#fff', fontWeight: 700 }}>Name:</span> {student.name}</div>
            <div><span style={{ color: '#fff', fontWeight: 700 }}>Department:</span> {student.department}</div>
          </div>
        </div>
      </div>
      {/* Separate the red header from the issued books table */}
      {/* Place the heading outside the card for consistent styling */}
      <div style={{ maxWidth: 1200, margin: '2.5rem auto 0 auto' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16 }}>Issued Books</h2>
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px 0 #f3eaea', padding: '2rem' }}>
          {borrowings.length === 0 ? (
            <div className="card text-center">
              <BookOpen size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No Library Records</h3>
              <p className="text-gray-600">You haven't borrowed any books from the library yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 16, padding: '1rem', marginTop: '1rem' }}>
              <table className="marks-table" style={{ minWidth: 800, width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ minWidth: 40, textAlign: 'left', paddingRight: 16 }}>S.No.</th>
                    <th style={{ minWidth: 200, textAlign: 'left', paddingRight: 16 }}>Book Title</th>
                    <th style={{ minWidth: 150, textAlign: 'left', paddingRight: 16 }}>Author</th>
                    <th style={{ minWidth: 120, textAlign: 'center' }}>Issue Date</th>
                    <th style={{ minWidth: 120, textAlign: 'center' }}>Return Date</th>
                    <th style={{ minWidth: 120, textAlign: 'center' }}>Status</th>
                    <th style={{ minWidth: 100, textAlign: 'center' }}>Late Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {borrowings.map((borrowing, idx) => {
                    const lateFee = calculateLateFee(borrowing.return_date, borrowing.actual_return_date);
                    const overdue = isOverdue(borrowing.return_date, borrowing.actual_return_date);
                    // Determine row color and border
                    let rowStyle: React.CSSProperties = {
                      borderBottom: '2px solid #e5e7eb', // subtle border between rows
                      transition: 'background 0.2s',
                    };
                    if (borrowing.actual_return_date) {
                      rowStyle.background = '#e6faed'; // green for returned
                      rowStyle.borderLeft = '6px solid #10b981';
                    } else if (overdue) {
                      rowStyle.background = '#ffeaea'; // red for overdue
                      rowStyle.borderLeft = '6px solid #ef4444';
                    } else {
                      rowStyle.background = '#fffbe6'; // yellow for borrowed
                      rowStyle.borderLeft = '6px solid #f59e0b';
                    }
                    return (
                      <tr key={borrowing.id} style={rowStyle}>
                        <td style={{ textAlign: 'left', minWidth: 40, paddingRight: 16 }}>{idx + 1}</td>
                        <td style={{ textAlign: 'left', minWidth: 200, paddingRight: 16 }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{borrowing.book?.title || 'Unknown Book'}</div>
                            {borrowing.book?.isbn && (
                              <div style={{ fontSize: '0.85rem', color: '#666' }}>ISBN: {borrowing.book.isbn}</div>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'left', minWidth: 150, paddingRight: 16 }}>{borrowing.book?.author || 'Unknown Author'}</td>
                        <td style={{ textAlign: 'center', minWidth: 120 }}>
                          {new Date(borrowing.issue_date).toLocaleDateString()}
                        </td>
                        <td style={{ textAlign: 'center', minWidth: 120 }}>
                          <div>
                            <div>{new Date(borrowing.return_date).toLocaleDateString()}</div>
                            {borrowing.actual_return_date && (
                              <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                Returned: {new Date(borrowing.actual_return_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '0 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            {getStatusIcon(borrowing.return_date, borrowing.actual_return_date)}
                            <span className={`badge ${getStatusClass(borrowing.return_date, borrowing.actual_return_date)}`}>
                              {getStatusText(borrowing.return_date, borrowing.actual_return_date)}
                            </span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', minWidth: 100 }}>
                          {lateFee > 0 ? (
                            <span style={{ color: '#ef4444', fontWeight: 600 }}>₹{lateFee}</span>
                          ) : (
                            <span style={{ color: '#10b981' }}>₹0</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {/* Info text for students - always at the bottom of the screen */}
      {/* Available Books */}
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: 12 }}>Available Books</h2>
        <div style={{ marginBottom: 16, maxWidth: 350 }}>
          <input
            type="text"
            className="form-input"
            style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #ccc', fontSize: '1rem' }}
            placeholder="Search by title or author..."
            value={searchAvailable}
            onChange={e => setSearchAvailable(e.target.value)}
          />
        </div>
        {filteredAvailableBooks.length === 0 ? (
          <div style={{ color: '#888' }}>No books available for request.</div>
        ) : (
          <div style={{ maxHeight: 340, overflowY: 'auto', borderRadius: 12, boxShadow: '0 2px 8px 0 #f3eaea', background: '#fff', paddingTop: 16 }}>
            <table className="marks-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', paddingLeft: 20 }}>Title</th>
                  <th style={{ textAlign: 'left' }}>Author</th>
                  <th style={{ textAlign: 'center' }}>Available</th>
                  {/* Remove the Request header */}
                </tr>
              </thead>
              <tbody>
                {filteredAvailableBooks.map(book => (
                  <tr key={book.id}>
                    <td style={{ textAlign: 'left', paddingLeft: 20 }}>{book.title}</td>
                    <td style={{ textAlign: 'left' }}>{book.author}</td>
                    <td style={{ textAlign: 'center' }}>{book.available_copies}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn"
                        style={{
                          background: '#a6192e',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          fontWeight: 600,
                          fontSize: '1rem',
                          padding: '0.5rem 1.2rem',
                          boxShadow: '0 2px 8px 0 #f3eaea',
                          transition: 'background 0.2s',
                          cursor: 'pointer',
                        }}
                        onMouseOver={e => ((e.currentTarget as HTMLButtonElement).style.background = '#7d1422')}
                        onMouseOut={e => ((e.currentTarget as HTMLButtonElement).style.background = '#a6192e')}
                        onClick={() => openRequestModal(book)}
                      >
                        Request
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custom Modal for Book Request */}
      {requestModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="card" style={{ minWidth: 320, maxWidth: 400, padding: '2rem', borderRadius: 16, background: '#fff', boxShadow: '0 4px 24px 0 #0003', border: '1.5px solid #eee', position: 'relative' }}>
            <button
              onClick={() => setRequestModalOpen(false)}
              style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }}
              aria-label="Close"
            >×</button>
            <h3 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 16 }}>Request Book: {selectedBook?.title}</h3>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 500, marginBottom: 6 }}>Select Borrow Duration:</div>
              <select
                value={selectedDuration}
                onChange={e => setSelectedDuration((e.target as any).value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '1rem' }}
              >
                {borrowDurations.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            {requestError && <div style={{ color: 'red', marginBottom: 10 }}>{requestError}</div>}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                className="btn"
                style={{ flex: 1, background: '#a6192e', color: '#fff' }}
                onClick={handleRequestSubmit}
                disabled={requestLoading}
              >{requestLoading ? 'Submitting...' : 'Submit Request'}</button>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, background: '#eee', color: '#a6192e' }}
                onClick={() => setRequestModalOpen(false)}
                disabled={requestLoading}
              >Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Student's Book Requests */}
      <div style={{ marginTop: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 10 }}>Your Book Requests</h2>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px 0 #f3eaea', padding: '1.5rem 1.5rem 1rem 1.5rem', minWidth: 600, maxWidth: 1200, margin: '0 auto' }}>
          {bookRequests.length === 0 ? (
            <div style={{ color: '#888' }}>No book requests yet.</div>
          ) : (
            <table className="marks-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', paddingLeft: 20 }}>Book Title</th>
                  <th style={{ textAlign: 'left' }}>Author</th>
                  <th style={{ textAlign: 'center' }}>Requested Duration</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Request Date</th>
                  <th style={{ textAlign: 'center' }}>Approval Date</th>
                  <th style={{ textAlign: 'center' }}>Return Date</th>
                </tr>
              </thead>
              <tbody>
                {bookRequests.map(req => (
                  <tr key={req.id}>
                    <td style={{ textAlign: 'left', paddingLeft: 20 }}>{req.book?.title || '-'}</td>
                    <td style={{ textAlign: 'left' }}>{req.book?.author || '-'}</td>
                    <td style={{ textAlign: 'center' }}>{req.requested_duration}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: req.status === 'approved' ? '#10b981' : req.status === 'denied' ? '#ef4444' : '#f59e0b' }}>{req.status.charAt(0).toUpperCase() + req.status.slice(1)}</td>
                    <td style={{ textAlign: 'center' }}>{req.request_date ? new Date(req.request_date).toLocaleDateString() : '-'}</td>
                    <td style={{ textAlign: 'center' }}>{req.approval_date ? new Date(req.approval_date).toLocaleDateString() : '-'}</td>
                    <td style={{ textAlign: 'center' }}>{req.return_date ? new Date(req.return_date).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <div style={{ maxWidth: 1200, margin: '2rem auto 0 auto', textAlign: 'center', color: '#a6192e', fontWeight: 500, fontSize: '1.08rem', background: '#fff8f8', borderRadius: 12, padding: '1rem 2rem', boxShadow: '0 2px 8px 0 #f3eaea' }}>
        If you are seeing outdated or incorrect information, contact your Faculty Advisor or Librarian
      </div>
    </div>
  );
};

export default Library; 