import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BookOpen, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

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

  useEffect(() => {
    fetchBorrowings();
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
        </div>
        
        {/* Student Info Section */}
        <div style={{ padding: '1.5rem 2rem 0.5rem 2rem', borderBottom: '1px solid #eee', background: '#faf6f6', display: 'flex', gap: '2.5rem', fontSize: '1.1rem', fontWeight: 500 }}>
          <div><span style={{ color: '#a6192e', fontWeight: 700 }}>Student ID:</span> {student.studentId}</div>
          <div><span style={{ color: '#a6192e', fontWeight: 700 }}>Name:</span> {student.name}</div>
          <div><span style={{ color: '#a6192e', fontWeight: 700 }}>Department:</span> {student.department}</div>
        </div>

        <div style={{ padding: '2rem' }}>
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
                    
                    return (
                      <tr key={borrowing.id}>
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
    </div>
  );
};

export default Library; 