import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BookOpen, Plus, Users, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

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
  // Add state for requests tab
  const [activeTab, setActiveTab] = useState<'books' | 'borrowings' | 'requests'>('books');
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestActionLoading, setRequestActionLoading] = useState<string | null>(null);
  const [requestError, setRequestError] = useState('');
  
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

  // Add refs for auto-scroll
  const addBookFormRef = React.useRef<HTMLDivElement>(null);
  const addBorrowingFormRef = React.useRef<HTMLDivElement>(null);

  // State for manual multi-row add and bulk upload for books
  const [addBookTab, setAddBookTab] = useState<'manual' | 'bulk'>('manual');
  const [manualBooks, setManualBooks] = useState([{ title: '', author: '', isbn: '', total_copies: '' }]);
  const [bulkBooks, setBulkBooks] = useState<any[]>([]);
  const [bulkBookError, setBulkBookError] = useState('');
  const [bulkBookLoading, setBulkBookLoading] = useState(false);

  // Add error state for each book row
  const [bulkBookRowErrors, setBulkBookRowErrors] = useState<string[]>([]);

  // State for manual multi-row add and bulk upload for borrowings
  const [addBorrowingTab, setAddBorrowingTab] = useState<'manual' | 'bulk'>('manual');
  const [manualBorrowings, setManualBorrowings] = useState([{ student_id: '', book_id: '', issue_date: '', return_date: '' }]);
  const [bulkBorrowings, setBulkBorrowings] = useState<any[]>([]);
  const [bulkBorrowingError, setBulkBorrowingError] = useState('');
  const [bulkBorrowingLoading, setBulkBorrowingLoading] = useState(false);

  // Add error state for each row
  const [bulkBorrowingRowErrors, setBulkBorrowingRowErrors] = useState<string[]>([]);

  // Add state for showing/hiding the example template card
  const [showStudentTemplate, setShowStudentTemplate] = useState(false);

  // Add state for showing/hiding the book template card
  const [showBookTemplate, setShowBookTemplate] = useState(false);

  // Add state for showing/hiding the borrowing template card
  const [showBorrowingTemplate, setShowBorrowingTemplate] = useState(false);

  const [searchBook, setSearchBook] = useState('');
  const [searchBorrowing, setSearchBorrowing] = useState('');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  // Fetch requests
  const fetchRequests = async () => {
    setLoadingRequests(true);
    setRequestError('');
    const { data, error } = await supabase
      .from('book_requests')
      .select('*, student:students(name, student_id), book:books(title, author, available_copies)')
      .order('request_date', { ascending: false });
    if (!error) setRequests(data || []);
    else setRequestError('Failed to fetch requests');
    setLoadingRequests(false);
  };

  useEffect(() => {
    if (activeTab === 'requests') fetchRequests();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch books
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select('id, title, author, isbn, total_copies, available_copies')
        .order('title');
      
      if (booksError) throw booksError;
      setBooks(booksData || []);

      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, student_id, name, email, department, year')
        .order('name');
      
      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Fetch borrowings with book and student info
      const { data: borrowingsData, error: borrowingsError } = await supabase
        .from('book_borrowings')
        .select('id, book_id, student_id, issue_date, return_date, actual_return_date, late_fee, book:books(id, title, author, isbn, total_copies, available_copies), student:students(id, student_id, name, email, department, year)')
        .order('issue_date', { ascending: false });
      
      if (borrowingsError) throw borrowingsError;
      // Fix: Supabase returns book and student as arrays, convert to single object
      const borrowingsFixed = (borrowingsData || []).map((b: any) => ({
        ...b,
        book: Array.isArray(b.book) ? b.book[0] : b.book,
        student: Array.isArray(b.student) ? b.student[0] : b.student,
      }));
      setBorrowings(borrowingsFixed);

    } catch (err: any) {
      setError('Failed to fetch data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll to form when opened
  useEffect(() => {
    if (showAddBook && addBookFormRef.current) {
      (addBookFormRef.current as unknown as HTMLDivElement).scrollIntoView({ behavior: 'smooth' });
    }
  }, [showAddBook]);
  useEffect(() => {
    if (showAddBorrowing && addBorrowingFormRef.current) {
      (addBorrowingFormRef.current as unknown as HTMLDivElement).scrollIntoView({ behavior: 'smooth' });
    }
  }, [showAddBorrowing]);

  // Handlers for manual multi-row add (books)
  const handleManualBookChange = (idx: number, key: string, value: string) => {
    setManualBooks(books => books.map((row, i) => i === idx ? { ...row, [key]: value } : row));
  };
  const handleAddManualBookRow = () => setManualBooks([...manualBooks, { title: '', author: '', isbn: '', total_copies: '' }]);
  const handleRemoveManualBookRow = (idx: number) => setManualBooks(books => books.filter((_, i) => i !== idx));
  const handleManualBookSubmit = async () => {
    // Validate
    for (const row of manualBooks) {
      if (!row.title || !row.author || !row.total_copies) {
        setError('Please fill all required fields');
        return;
      }
    }
    try {
      await supabase.from('books').insert(manualBooks.map(row => ({
        title: row.title,
        author: row.author,
        isbn: row.isbn || null,
        total_copies: parseInt(row.total_copies),
        available_copies: parseInt(row.total_copies),
      })));
      setManualBooks([{ title: '', author: '', isbn: '', total_copies: '' }]);
      setShowAddBook(false);
      fetchData();
    } catch (err: any) {
      setError('Failed to add books: ' + err.message);
    }
  };

  // Handlers for manual multi-row add (borrowings)
  const handleManualBorrowingChange = (idx: number, key: string, value: string) => {
    setManualBorrowings(borrowings => borrowings.map((row, i) => i === idx ? { ...row, [key]: value } : row));
  };
  const handleAddManualBorrowingRow = () => setManualBorrowings([...manualBorrowings, { student_id: '', book_id: '', issue_date: '', return_date: '' }]);
  const handleRemoveManualBorrowingRow = (idx: number) => setManualBorrowings(borrowings => borrowings.filter((_, i) => i !== idx));
  const handleManualBorrowingSubmit = async () => {
    // Validate
    for (const row of manualBorrowings) {
      if (!row.student_id || !row.book_id || !row.issue_date || !row.return_date) {
        setError('Please fill all required fields');
        return;
      }
    }
    try {
      await supabase.from('book_borrowings').insert(manualBorrowings);
      // Update available copies for each borrowed book
      for (const row of manualBorrowings) {
        // Fetch latest available_copies
        const { data: bookData } = await supabase.from('books').select('available_copies').eq('id', row.book_id).single();
        if (bookData && typeof bookData.available_copies === 'number') {
          await supabase.from('books').update({ available_copies: bookData.available_copies - 1 }).eq('id', row.book_id);
        }
      }
      setManualBorrowings([{ student_id: '', book_id: '', issue_date: '', return_date: '' }]);
      setShowAddBorrowing(false);
      fetchData();
    } catch (err: any) {
      setError('Failed to add borrowings: ' + err.message);
    }
  };

  const normalizeHeader = (header: string) => header.toLowerCase().replace(/\s|_/g, '');
  const headerMap: Record<string, string> = {
    title: 'title',
    booktitle: 'title',
    name: 'title',
    author: 'author',
    writer: 'author',
    isbn: 'isbn',
    totalcopies: 'total_copies',
    totalcopy: 'total_copies',
    copies: 'total_copies',
    'noofcopies': 'total_copies',
  };

  const mapRowToBook = (row: any, originalHeaders: string[]) => {
    const mapped: any = {};
    for (const key of originalHeaders) {
      const norm = normalizeHeader(key);
      const mappedKey = headerMap[norm] || norm;
      if (['title', 'author', 'isbn', 'total_copies'].includes(mappedKey)) {
        mapped[mappedKey] = row[key];
      }
    }
    return mapped;
  };

  const handleBulkBookInputChange = (idx: number, key: string, value: string) => {
    setBulkBooks(bulkBooks => bulkBooks.map((row, i) => i === idx ? { ...row, [key]: value } : row));
  };

  const handleBulkBookFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBulkBookError('');
    setBulkBooks([]);
    setBulkBookRowErrors([]);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      let workbook;
      try {
        workbook = XLSX.read(data, { type: 'binary' });
      } catch (err) {
        setBulkBookError('Failed to read file. Please upload a valid Excel or CSV file.');
        return;
      }
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      if (!rows.length) {
        setBulkBookError('No data found in file.');
        return;
      }
      const originalHeaders = Object.keys(rows[0] || {});
      // Map and normalize rows
      const mappedRows = rows.map(row => mapRowToBook(row, originalHeaders));
      // Validate required fields
      const required = ['title', 'author', 'total_copies'];
      const missingCols = required.filter(col => !Object.keys(mappedRows[0]).includes(col));
      if (missingCols.length > 0) {
        setBulkBookError('Missing required columns: ' + missingCols.join(', '));
        return;
      }
      setBulkBooks(mappedRows);
      setBulkBookRowErrors(Array(mappedRows.length).fill(''));
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkBookSubmit = async () => {
    setBulkBookError('');
    setBulkBookLoading(true);
    let rowErrors = Array(bulkBooks.length).fill('');
    const validRows: any[] = [];
    for (let idx = 0; idx < bulkBooks.length; idx++) {
      const row = bulkBooks[idx];
      if (!row.title || !row.author || !row.total_copies) {
        rowErrors[idx] = 'Missing required fields';
        continue;
      }
      if (isNaN(Number(row.total_copies)) || Number(row.total_copies) < 1) {
        rowErrors[idx] = 'Total Copies must be a positive number';
        continue;
      }
      validRows.push({
        title: row.title,
        author: row.author,
        isbn: row.isbn || null,
        total_copies: parseInt(row.total_copies),
        available_copies: parseInt(row.total_copies),
      });
    }
    setBulkBookRowErrors(rowErrors);
    if (validRows.length === 0) {
      setBulkBookError('No valid rows to submit.');
      setBulkBookLoading(false);
      return;
    }
    try {
      await supabase.from('books').insert(validRows);
      setBulkBooks([]);
      setBulkBookRowErrors([]);
      setShowAddBook(false);
      fetchData();
    } catch (err: any) {
      setBulkBookError('Failed to add books: ' + err.message);
    } finally {
      setBulkBookLoading(false);
    }
  };

  const borrowingHeaderMap: Record<string, string> = {
    studentid: 'student_id',
    student_id: 'student_id',
    student: 'student_id',
    studentnumber: 'student_id',
    bookid: 'book_id',
    book_id: 'book_id',
    book: 'book_id',
    booktitle: 'book_id', // if you want to allow book title, but this would need lookup
    issue: 'issue_date',
    issuedate: 'issue_date',
    'dateofissue': 'issue_date',
    returndate: 'return_date',
    return: 'return_date',
    'dateofreturn': 'return_date',
  };

  const mapRowToBorrowing = (row: any, originalHeaders: string[]) => {
    const mapped: any = {};
    for (const key of originalHeaders) {
      const norm = normalizeHeader(key);
      const mappedKey = borrowingHeaderMap[norm] || norm;
      if (["student_id", "book_id", "issue_date", "return_date"].includes(mappedKey)) {
        mapped[mappedKey] = row[key];
      }
    }
    return mapped;
  };

  // Helper to convert Excel date numbers to YYYY-MM-DD
  function excelDateToISO(dateVal: any) {
    if (typeof dateVal === 'number') {
      // Excel date number to JS date
      const jsDate = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
      return jsDate.toISOString().slice(0, 10);
    }
    if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      return dateVal;
    }
    // Try to parse as date string (DD-MM-YYYY or MM/DD/YYYY)
    if (typeof dateVal === 'string') {
      const parts = dateVal.split(/[\/-]/);
      if (parts.length === 3) {
        // Try DD-MM-YYYY
        if (parts[2].length === 4) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        // Try YYYY-MM-DD
        if (parts[0].length === 4) {
          return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }
      }
    }
    return '';
  }

  const handleBulkBorrowingInputChange = (idx: number, key: string, value: string) => {
    setBulkBorrowings(bulkBorrowings => bulkBorrowings.map((row, i) => i === idx ? { ...row, [key]: value } : row));
  };

  const normalizeBookName = (name: string | undefined) => String(name).trim().toLowerCase().replace(/_/g, ' ');

  const handleBulkBorrowingFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBulkBorrowingError('');
    setBulkBorrowings([]);
    setBulkBorrowingRowErrors([]);
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      let workbook;
      try {
        workbook = XLSX.read(data, { type: 'binary' });
      } catch (err) {
        setBulkBorrowingError('Failed to read file. Please upload a valid Excel or CSV file.');
        return;
      }
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      if (!rows.length) {
        setBulkBorrowingError('No data found in file.');
        return;
      }
      const originalHeaders = Object.keys(rows[0] || {});
      let mappedRows = rows.map(row => mapRowToBorrowing(row, originalHeaders));
      mappedRows = mappedRows.map(row => ({
        ...row,
        issue_date: excelDateToISO(row.issue_date),
        return_date: excelDateToISO(row.return_date),
      }));
      // Book name to ID mapping and error handling
      const newRows = mappedRows.map(row => {
        let bookId = '';
        let bookNameError = '';
        if (row.book_id) {
          // Try to match by book title (case-insensitive)
          const book = books.find(b => normalizeBookName(b.title) === normalizeBookName(row.book_id));
          if (book) {
            bookId = book.id;
          } else {
            bookNameError = 'Book name not found, if you wish to add books please do it in the catalog';
          }
        }
        return {
          ...row,
          book_id: bookId,
          _bookName: row.book_id, // keep original for dropdown
          _bookNameError: bookNameError,
        };
      });
      setBulkBorrowings(newRows);
      setBulkBorrowingRowErrors(newRows.map(r => r._bookNameError || ''));
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkBorrowingSubmit = async () => {
    setBulkBorrowingError('');
    setBulkBorrowingLoading(true);
    let rowErrors = Array(bulkBorrowings.length).fill('');
    const validRows: any[] = [];
    for (let idx = 0; idx < bulkBorrowings.length; idx++) {
      let row = { ...bulkBorrowings[idx] };
      // Book ID: allow title or ID
      let bookId = row.book_id;
      const bookById = books.find(b => b.id === bookId);
      const bookByTitle = books.find(b => b.title.trim().toLowerCase() === String(bookId).trim().toLowerCase());
      if (!bookById && bookByTitle) {
        bookId = bookByTitle.id;
      }
      if (!bookById && !bookByTitle) {
        rowErrors[idx] = 'Book not found';
        continue;
      }
      // Validate dates
      const issueDate = excelDateToISO(row.issue_date);
      const returnDate = excelDateToISO(row.return_date);
      if (!issueDate || !returnDate) {
        rowErrors[idx] = 'Invalid date format';
        continue;
      }
      // Validate required fields
      if (!row.student_id || !bookId || !issueDate || !returnDate) {
        rowErrors[idx] = 'Missing required fields';
        continue;
      }
      validRows.push({
        student_id: row.student_id,
        book_id: bookId,
        issue_date: issueDate,
        return_date: returnDate,
      });
    }
    setBulkBorrowingRowErrors(rowErrors);
    if (validRows.length === 0) {
      setBulkBorrowingError('No valid rows to submit.');
      setBulkBorrowingLoading(false);
      return;
    }
    try {
      await supabase.from('book_borrowings').insert(validRows);
      // Update available copies for each borrowed book
      for (const row of validRows) {
        const { data: bookData } = await supabase.from('books').select('available_copies').eq('id', row.book_id).single();
        if (bookData && typeof bookData.available_copies === 'number') {
          await supabase.from('books').update({ available_copies: bookData.available_copies - 1 }).eq('id', row.book_id);
        }
      }
      setBulkBorrowings([]);
      setBulkBorrowingRowErrors([]);
      setShowAddBorrowing(false);
      fetchData();
    } catch (err: any) {
      setBulkBorrowingError('Failed to add borrowings: ' + err.message);
    } finally {
      setBulkBorrowingLoading(false);
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

  const handleRemoveBulkBookRow = (idx: number) => {
    setBulkBooks(bulkBooks => bulkBooks.filter((_, i) => i !== idx));
    setBulkBookRowErrors(errors => errors.filter((_, i) => i !== idx));
  };
  const handleRemoveBulkBorrowingRow = (idx: number) => {
    setBulkBorrowings(bulkBorrowings => bulkBorrowings.filter((_, i) => i !== idx));
    setBulkBorrowingRowErrors(errors => errors.filter((_, i) => i !== idx));
  };

  // Approve/Deny logic
  const handleApproveRequest = async (req: any) => {
    setRequestActionLoading(req.id);
    setRequestError('');
    // Calculate approval_date and return_date
    const approvalDate = new Date();
    let days = 7;
    if (req.requested_duration === '1 month') days = 30;
    else if (req.requested_duration === '3 weeks') days = 21;
    else if (req.requested_duration === '2 weeks') days = 14;
    // Return date = approval date + days
    const returnDate = new Date(approvalDate.getTime() + days * 24 * 60 * 60 * 1000);
    // Only approve if book is available
    if (req.book?.available_copies <= 0) {
      setRequestError('No copies available for this book.');
      setRequestActionLoading(null);
      return;
    }
    // Update request and book
    const { error: updateError } = await supabase.from('book_requests').update({
      status: 'approved',
      approval_date: approvalDate.toISOString().slice(0, 10),
      return_date: returnDate.toISOString().slice(0, 10),
    }).eq('id', req.id);
    if (!updateError) {
      await supabase.from('books').update({ available_copies: req.book.available_copies - 1 }).eq('id', req.book_id);
      // Also insert into book_borrowings
      await supabase.from('book_borrowings').insert({
        student_id: req.student?.student_id || req.student_id,
        book_id: req.book_id,
        issue_date: approvalDate.toISOString().slice(0, 10),
        return_date: returnDate.toISOString().slice(0, 10),
      });
    }
    setRequestActionLoading(null);
    fetchRequests();
    fetchData();
  };
  const handleDenyRequest = async (req: any) => {
    setRequestActionLoading(req.id);
    setRequestError('');
    await supabase.from('book_requests').update({ status: 'denied' }).eq('id', req.id);
    setRequestActionLoading(null);
    fetchRequests();
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
        <div className="library-tabs-scrollable">
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
          <button
            onClick={() => setActiveTab('requests')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: activeTab === 'requests' ? '#a6192e' : 'transparent',
              color: activeTab === 'requests' ? '#fff' : '#333',
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: activeTab === 'requests' ? '2px solid #a6192e' : '2px solid transparent',
            }}
          >
            <Calendar size={18} style={{ marginRight: '0.5rem' }} />
            Requests
          </button>
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}

        {/* Book Catalog Tab */}
        {activeTab === 'books' && (
          <div>
            {/* Search Bar for Book Catalog */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Search by Book Name or Author"
                value={searchBook}
                onChange={e => setSearchBook(e.target.value)}
                className="form-input"
                style={{ minWidth: 320, maxWidth: 400, border: '1px solid #a6192e', borderRadius: 8, padding: '0.5rem 1rem', fontSize: 16 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="text-xl font-bold">Book Catalog</h2>
            </div>
            {books.length === 0 ? (
              <div className="card text-center">No books found.</div>
            ) : (
              <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 340, borderRadius: 12, boxShadow: '0 2px 8px 0 #f3eaea', background: '#fff' }}>
                <table className="marks-table" style={{ minWidth: 900, width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px 18px', paddingLeft: 24, textAlign: 'left' }}>Title</th>
                      <th style={{ padding: '12px 18px', textAlign: 'left' }}>Author</th>
                      <th style={{ padding: '12px 18px', textAlign: 'left' }}>ISBN</th>
                      <th style={{ padding: '12px 18px', textAlign: 'center' }}>Total Copies</th>
                      <th style={{ padding: '12px 18px', textAlign: 'center' }}>Available</th>
                      <th style={{ padding: '12px 18px', textAlign: 'center' }}>Borrowed</th>
                      <th style={{ minWidth: 140, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books
                      .filter(book =>
                        book.title.toLowerCase().includes(searchBook.toLowerCase()) ||
                        book.author.toLowerCase().includes(searchBook.toLowerCase())
                      )
                      .map((book) => (
                    <tr key={book.id}>
                      <td style={{ padding: '10px 16px', paddingLeft: 24 }}>{book.title}</td>
                      <td style={{ padding: '10px 16px' }}>{book.author}</td>
                      <td style={{ padding: '10px 16px' }}>{book.isbn}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>{book.total_copies}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>{book.available_copies || book.total_copies}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>{(book.total_copies - (book.available_copies || book.total_copies))}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button className="btn btn-sm" style={{ background: '#3b82f6', color: '#fff' }} onClick={() => handleEditBook(book)}>Edit</button>
                        <button className="btn btn-sm" style={{ background: '#ef4444', color: '#fff' }} onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
                            const { error } = await supabase.from('books').delete().eq('id', book.id);
                            if (!error) {
                              setBooks(prev => prev.filter(b => b.id !== book.id));
                            } else {
                              alert('Failed to delete book.');
                            }
                          }
                        }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
            )}
            {showEditBook && editingBook && (
              <div className="card mb-6" style={{ background: '#e0f2fe', marginTop: 24, maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
                <button className="btn mb-4" style={{ background: '#6b7280', color: '#fff', float: 'right' }} onClick={() => { setShowEditBook(false); setEditingBook(null); }}>
                  Cancel
                </button>
                <h2 className="text-xl font-bold mb-4">Edit Book</h2>
                <form onSubmit={handleUpdateBook}>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <input type="text" placeholder="Title" value={newBook.title} onChange={e => setNewBook({ ...newBook, title: (e.target as HTMLInputElement).value })} className="form-input" required style={{ flex: 1 }} />
                    <input type="text" placeholder="Author" value={newBook.author} onChange={e => setNewBook({ ...newBook, author: (e.target as HTMLInputElement).value })} className="form-input" required style={{ flex: 1 }} />
                    <input type="text" placeholder="ISBN" value={newBook.isbn} onChange={e => setNewBook({ ...newBook, isbn: (e.target as HTMLInputElement).value })} className="form-input" style={{ flex: 1 }} />
                    <input type="number" placeholder="Total Copies" value={newBook.total_copies} onChange={e => setNewBook({ ...newBook, total_copies: (e.target as HTMLInputElement).value })} className="form-input" required min={1} style={{ flex: 1 }} />
                  </div>
                  <button className="btn mt-4" style={{ background: '#3b82f6', color: '#fff' }} type="submit">Update Book</button>
                </form>
              </div>
            )}
            {showAddBook && (
              <div ref={addBookFormRef} className="card mb-6" style={{ background: '#f7e6e9', marginTop: 24, maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
                <button className="btn mb-4" style={{ background: '#6b7280', color: '#fff', float: 'right' }} onClick={() => setShowAddBook(false)}>
                  Cancel
                </button>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: 24 }}>
                  <button
                    className="btn"
                    style={{ background: addBookTab === 'manual' ? '#a6192e' : '#fff', color: addBookTab === 'manual' ? '#fff' : '#a6192e', border: '2px solid #a6192e', fontWeight: 700, borderRadius: 8, padding: '0.5rem 1.5rem' }}
                    onClick={() => setAddBookTab('manual')}
                  >
                    Manual Entry
                  </button>
                  <button
                    className="btn"
                    style={{ background: addBookTab === 'bulk' ? '#a6192e' : '#fff', color: addBookTab === 'bulk' ? '#fff' : '#a6192e', border: '2px solid #a6192e', fontWeight: 700, borderRadius: 8, padding: '0.5rem 1.5rem' }}
                    onClick={() => setAddBookTab('bulk')}
                  >
                    Bulk Upload
                  </button>
                  {addBookTab === 'bulk' && (
                    <button
                      className="btn"
                      style={{ background: '#fff', color: '#a6192e', border: '2px solid #a6192e', fontWeight: 700, borderRadius: 8, padding: '0.5rem 1.5rem', marginLeft: 8 }}
                      onClick={() => setShowBookTemplate(true)}
                    >
                      Example Template
                    </button>
                  )}
                </div>
                {addBookTab === 'manual' && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Add Books</h2>
                    <div style={{ overflowX: 'auto', marginTop: 16 }}>
                      <table className="marks-table" style={{ minWidth: 700, width: '100%' }}>
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Author</th>
                            <th>ISBN</th>
                            <th>Total Copies</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {manualBooks.map((row, idx) => (
                            <tr key={idx}>
                              <td><input type="text" value={row.title} onChange={e => handleManualBookChange(idx, 'title', (e.target as HTMLInputElement).value)} className="form-input" /></td>
                              <td><input type="text" value={row.author} onChange={e => handleManualBookChange(idx, 'author', (e.target as HTMLInputElement).value)} className="form-input" /></td>
                              <td><input type="text" value={row.isbn} onChange={e => handleManualBookChange(idx, 'isbn', (e.target as HTMLInputElement).value)} className="form-input" /></td>
                              <td><input type="number" value={row.total_copies} onChange={e => handleManualBookChange(idx, 'total_copies', (e.target as HTMLInputElement).value)} className="form-input" min={1} /></td>
                              <td><button className="btn btn-sm" style={{ background: '#ef4444', color: '#fff' }} onClick={() => handleRemoveManualBookRow(idx)} type="button" disabled={manualBooks.length === 1}>Remove</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button className="btn mt-4" style={{ background: '#a6192e', color: '#fff' }} onClick={handleAddManualBookRow} type="button">Add Another</button>
                      <button className="btn mt-4" style={{ background: '#a6192e', color: '#fff', marginLeft: 16 }} onClick={handleManualBookSubmit}>Submit All</button>
                    </div>
                  </div>
                )}
                {addBookTab === 'bulk' && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Bulk Upload Books</h2>
                    <input type="file" accept=".xlsx,.csv" onChange={handleBulkBookFile} className="form-input mb-4" />
                    {bulkBookError && <div className="alert alert-error mb-2">{bulkBookError}</div>}
                    {bulkBooks.length > 0 && (
                      <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                        <table className="marks-table" style={{ minWidth: 700, width: '100%' }}>
                          <thead>
                            <tr>
                              <th>Title</th>
                              <th>Author</th>
                              <th>ISBN</th>
                              <th>Total Copies</th>
                              <th>Error</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bulkBooks.map((row, idx) => (
                              <tr key={idx}>
                                <td><input type="text" value={row.title} onChange={e => handleBulkBookInputChange(idx, 'title', (e.target as HTMLInputElement).value)} className="form-input" /></td>
                                <td><input type="text" value={row.author} onChange={e => handleBulkBookInputChange(idx, 'author', (e.target as HTMLInputElement).value)} className="form-input" /></td>
                                <td><input type="text" value={row.isbn} onChange={e => handleBulkBookInputChange(idx, 'isbn', (e.target as HTMLInputElement).value)} className="form-input" /></td>
                                <td><input type="number" value={row.total_copies} onChange={e => handleBulkBookInputChange(idx, 'total_copies', (e.target as HTMLInputElement).value)} className="form-input" min={1} /></td>
                                <td style={{ color: 'red', fontSize: 13 }}>{bulkBookRowErrors[idx]}</td>
                                <td><button className="btn btn-sm" style={{ background: '#ef4444', color: '#fff' }} onClick={() => handleRemoveBulkBookRow(idx)} type="button">Remove</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <button className="btn mt-4" style={{ background: '#a6192e', color: '#fff' }} onClick={handleBulkBookSubmit} disabled={bulkBookLoading || bulkBooks.length === 0}>
                      {bulkBookLoading ? 'Submitting...' : 'Submit All'}
                    </button>
                  </div>
                )}
                {showBookTemplate && (
                  <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1001, background: '#fff', borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.2)', padding: 40, maxWidth: 800 }}>
                    <button
                      className="btn btn-sm"
                      style={{ position: 'absolute', top: 20, right: 20, background: '#6b7280', color: '#fff', padding: '8px 24px', fontSize: 20 }}
                      onClick={() => setShowBookTemplate(false)}
                    >
                      Close
                    </button>
                    <h3 className="text-lg font-bold mb-4" style={{ marginTop: 8 }}>Book Bulk Upload Example</h3>
                    <div style={{ overflowX: 'auto', marginBottom: 20 }}>
                      <table className="marks-table" style={{ minWidth: 700, width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'center' }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '12px 18px', minWidth: 180, textAlign: 'center' }}>Title</th>
                            <th style={{ padding: '12px 18px', minWidth: 160, textAlign: 'center' }}>Author</th>
                            <th style={{ padding: '12px 18px', minWidth: 160, textAlign: 'center' }}>ISBN</th>
                            <th style={{ padding: '12px 18px', minWidth: 120, textAlign: 'center' }}>Total Copies</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ padding: '10px 16px', minWidth: 180, textAlign: 'center' }}>Six of Crows</td>
                            <td style={{ padding: '10px 16px', minWidth: 160, textAlign: 'center' }}>Leigh Bardugo</td>
                            <td style={{ padding: '10px 16px', minWidth: 160, textAlign: 'center' }}>978-0123456789</td>
                            <td style={{ padding: '10px 16px', minWidth: 120, textAlign: 'center' }}>5</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div style={{ display: 'flex', gap: 20, marginTop: 16, justifyContent: 'center' }}>
                      <a
                        href="https://gfqexgwydnfhntearstw.supabase.co/storage/v1/object/public/templated//student_template.xlsx"
                        download
                        className="btn"
                        style={{ background: '#a6192e', color: '#fff', fontWeight: 700, fontSize: 18, padding: '16px 32px', borderRadius: 8 }}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download Example Excel File
                      </a>
                      <a
                        href="https://gfqexgwydnfhntearstw.supabase.co/storage/v1/object/public/templated//student_template.xlsx"
                        className="btn"
                        style={{ background: '#fff', color: '#a6192e', border: '2px solid #a6192e', fontWeight: 700, fontSize: 18, padding: '16px 32px', borderRadius: 8 }}
                        onClick={e => {
                          e.preventDefault();
                          window.open('https://gfqexgwydnfhntearstw.supabase.co/storage/v1/object/public/templated//student_template.xlsx', '_blank');
                        }}
                      >
                        View Example Excel File
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
            {!showAddBook && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
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
                  Add Book
                </button>
              </div>
            )}
          </div>
        )}

        {/* Borrowings Tab */}
        {activeTab === 'borrowings' && (
          <div>
            {/* Search Bar for Borrowings */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Search by Student ID, Student Name, or Book Name"
                value={searchBorrowing}
                onChange={e => setSearchBorrowing(e.target.value)}
                className="form-input"
                style={{ minWidth: 320, maxWidth: 400, border: '1px solid #a6192e', borderRadius: 8, padding: '0.5rem 1rem', fontSize: 16 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="text-xl font-bold">Book Borrowings</h2>
            </div>
            {borrowings.length === 0 ? (
              <div className="card text-center">No borrowings found.</div>
            ) : (
              <div style={{ overflowY: 'auto', maxHeight: 340, borderRadius: 12, boxShadow: '0 2px 8px 0 #f3eaea', background: '#fff' }}>
                <table className="marks-table" style={{ minWidth: 800, width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Book</th>
                      <th>Issue Date</th>
                      <th>Return Date</th>
                      <th style={{ minWidth: 120, textAlign: 'center' }}>Status</th>
                      <th>Late Fee</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {borrowings
                      .filter(borrowing =>
                        (borrowing.student?.student_id?.toLowerCase().includes(searchBorrowing.toLowerCase()) ||
                        borrowing.student?.name?.toLowerCase().includes(searchBorrowing.toLowerCase()) ||
                        borrowing.book?.title?.toLowerCase().includes(searchBorrowing.toLowerCase()))
                      )
                      .map((borrowing, idx) => {
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
            {showEditBorrowing && editingBorrowing && (
              <div className="card mb-6" style={{ background: '#e0f2fe', marginTop: 24, maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
                <button className="btn mb-4" style={{ background: '#6b7280', color: '#fff', float: 'right' }} onClick={() => { setShowEditBorrowing(false); setEditingBorrowing(null); }}>
                  Cancel
                </button>
                <h2 className="text-xl font-bold mb-4">Edit Borrowing</h2>
                <form onSubmit={handleUpdateBorrowing}>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <select value={newBorrowing.student_id} onChange={e => setNewBorrowing({ ...newBorrowing, student_id: (e.target as HTMLSelectElement).value })} className="form-input" required style={{ flex: 1 }}>
                      <option value="">Select Student</option>
                      {students.map(s => (
                        <option key={s.id} value={s.student_id}>{s.name} ({s.student_id})</option>
                      ))}
                    </select>
                    <select
                      value={newBorrowing.book_id || ''}
                      onChange={e => setNewBorrowing({ ...newBorrowing, book_id: (e.target as HTMLSelectElement).value })}
                      className="form-input"
                    >
                      <option value="">Select Book</option>
                      {books.map(book => (
                        <option key={book.id} value={book.id}>{book.title}</option>
                      ))}
                    </select>
                    <input type="date" value={newBorrowing.issue_date} onChange={e => setNewBorrowing({ ...newBorrowing, issue_date: (e.target as HTMLInputElement).value })} className="form-input" required style={{ flex: 1 }} />
                    <input type="date" value={newBorrowing.return_date} onChange={e => setNewBorrowing({ ...newBorrowing, return_date: (e.target as HTMLInputElement).value })} className="form-input" required style={{ flex: 1 }} />
                  </div>
                  <button className="btn mt-4" style={{ background: '#3b82f6', color: '#fff' }} type="submit">Update Borrowing</button>
                </form>
              </div>
            )}
            {showAddBorrowing && (
              <div ref={addBorrowingFormRef} className="card mb-6" style={{ background: '#f7e6e9', marginTop: 24, maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
                <button className="btn mb-4" style={{ background: '#6b7280', color: '#fff', float: 'right' }} onClick={() => setShowAddBorrowing(false)}>
                  Cancel
                </button>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: 24 }}>
                  <button
                    className="btn"
                    style={{ background: addBorrowingTab === 'manual' ? '#a6192e' : '#fff', color: addBorrowingTab === 'manual' ? '#fff' : '#a6192e', border: '2px solid #a6192e', fontWeight: 700, borderRadius: 8, padding: '0.5rem 1.5rem' }}
                    onClick={() => setAddBorrowingTab('manual')}
                  >
                    Manual Entry
                  </button>
                  <button
                    className="btn"
                    style={{ background: addBorrowingTab === 'bulk' ? '#a6192e' : '#fff', color: addBorrowingTab === 'bulk' ? '#fff' : '#a6192e', border: '2px solid #a6192e', fontWeight: 700, borderRadius: 8, padding: '0.5rem 1.5rem' }}
                    onClick={() => setAddBorrowingTab('bulk')}
                  >
                    Bulk Upload
                  </button>
                  {addBorrowingTab === 'bulk' && (
                    <button
                      className="btn"
                      style={{ background: '#fff', color: '#a6192e', border: '2px solid #a6192e', fontWeight: 700, borderRadius: 8, padding: '0.5rem 1.5rem', marginLeft: 8 }}
                      onClick={() => setShowBorrowingTemplate(true)}
                    >
                      Example Template
                    </button>
                  )}
                </div>
                {addBorrowingTab === 'manual' && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Record Borrowings</h2>
                    <div style={{ overflowX: 'auto', marginTop: 16 }}>
                      <table className="marks-table" style={{ minWidth: 700, width: '100%' }}>
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Book</th>
                            <th>Issue Date</th>
                            <th>Return Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {manualBorrowings.map((row, idx) => (
                            <tr key={idx}>
                              <td>
                                <select value={row.student_id} onChange={e => handleManualBorrowingChange(idx, 'student_id', (e.target as HTMLSelectElement).value)} className="form-input">
                                  <option value="">Select Student</option>
                                  {students.map(s => (
                                    <option key={s.id} value={s.student_id}>{s.name} ({s.student_id})</option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <select value={row.book_id} onChange={e => handleManualBorrowingChange(idx, 'book_id', (e.target as HTMLSelectElement).value)} className="form-input">
                                  <option value="">Select Book</option>
                                  {books.map(b => (
                                    <option key={b.id} value={b.id}>{b.title}</option>
                                  ))}
                                </select>
                              </td>
                              <td><input type="date" value={row.issue_date} onChange={e => handleManualBorrowingChange(idx, 'issue_date', (e.target as HTMLInputElement).value)} className="form-input" /></td>
                              <td><input type="date" value={row.return_date} onChange={e => handleManualBorrowingChange(idx, 'return_date', (e.target as HTMLInputElement).value)} className="form-input" /></td>
                              <td><button className="btn btn-sm" style={{ background: '#ef4444', color: '#fff' }} onClick={() => handleRemoveManualBorrowingRow(idx)} type="button" disabled={manualBorrowings.length === 1}>Remove</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button className="btn mt-4" style={{ background: '#a6192e', color: '#fff' }} onClick={handleAddManualBorrowingRow} type="button">Add Another</button>
                      <button className="btn mt-4" style={{ background: '#a6192e', color: '#fff', marginLeft: 16 }} onClick={handleManualBorrowingSubmit}>Submit All</button>
                    </div>
                  </div>
                )}
                {addBorrowingTab === 'bulk' && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Bulk Upload Borrowings</h2>
                    <input type="file" accept=".xlsx,.csv" onChange={e => handleBulkBorrowingFile(e as React.ChangeEvent<HTMLInputElement>)} className="form-input mb-4" />
                    {showBorrowingTemplate && (
                      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1001, background: '#fff', borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.2)', padding: 40, maxWidth: 900 }}>
                        <button
                          className="btn btn-sm"
                          style={{ position: 'absolute', top: 20, right: 20, background: '#6b7280', color: '#fff', padding: '8px 24px', fontSize: 20 }}
                          onClick={() => setShowBorrowingTemplate(false)}
                        >
                          Close
                        </button>
                        <h3 className="text-lg font-bold mb-4" style={{ marginTop: 8 }}>Borrowing Bulk Upload Example</h3>
                        <div style={{ overflowX: 'auto', marginBottom: 20 }}>
                          <table className="marks-table" style={{ minWidth: 900, width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'center' }}>
                            <thead>
                              <tr>
                                <th style={{ padding: '12px 18px', minWidth: 140, textAlign: 'center' }}>Student ID</th>
                                <th style={{ padding: '12px 18px', minWidth: 200, textAlign: 'center' }}>Book Title</th>
                                <th style={{ padding: '12px 18px', minWidth: 140, textAlign: 'center' }}>Issue Date</th>
                                <th style={{ padding: '12px 18px', minWidth: 140, textAlign: 'center' }}>Return Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td style={{ padding: '10px 16px', minWidth: 140, textAlign: 'center' }}>DAV2024001</td>
                                <td style={{ padding: '10px 16px', minWidth: 200, textAlign: 'center' }}>Introduction to Python</td>
                                <td style={{ padding: '10px 16px', minWidth: 140, textAlign: 'center' }}>23-06-2025</td>
                                <td style={{ padding: '10px 16px', minWidth: 140, textAlign: 'center' }}>23-07-2025</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div style={{ display: 'flex', gap: 20, marginTop: 16, justifyContent: 'center' }}>
                          <a
                            href="https://gfqexgwydnfhntearstw.supabase.co/storage/v1/object/public/templated//student_template.xlsx"
                            download
                            className="btn"
                            style={{ background: '#a6192e', color: '#fff', fontWeight: 700, fontSize: 18, padding: '16px 32px', borderRadius: 8 }}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Download Example Excel File
                          </a>
                          <a
                            href="https://gfqexgwydnfhntearstw.supabase.co/storage/v1/object/public/templated//student_template.xlsx"
                            className="btn"
                            style={{ background: '#fff', color: '#a6192e', border: '2px solid #a6192e', fontWeight: 700, fontSize: 18, padding: '16px 32px', borderRadius: 8 }}
                            onClick={e => {
                              e.preventDefault();
                              window.open('https://gfqexgwydnfhntearstw.supabase.co/storage/v1/object/public/templated//student_template.xlsx', '_blank');
                            }}
                          >
                            View Example Excel File
                          </a>
                        </div>
                      </div>
                    )}
                    {bulkBorrowingError && <div className="alert alert-error mb-2">{bulkBorrowingError}</div>}
                    {bulkBorrowings.length > 0 && (
                      <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                        <table className="marks-table" style={{ minWidth: 900, width: '100%' }}>
                          <thead>
                            <tr>
                              <th>Student ID</th>
                              <th>Book</th>
                              <th>Issue Date</th>
                              <th>Return Date</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bulkBorrowings.map((row, idx) => (
                              <tr key={idx}>
                                <td><input type="text" value={row.student_id} onChange={e => handleBulkBorrowingInputChange(idx, 'student_id', (e.target as HTMLInputElement).value)} className="form-input" /></td>
                                <td>
                                  <select
                                    value={row.book_id || ''}
                                    onChange={e => {
                                      const selectedBookId = (e.target as HTMLSelectElement).value;
                                      const newRows = [...bulkBorrowings];
                                      newRows[idx].book_id = selectedBookId;
                                      if (selectedBookId) newRows[idx]._bookNameError = '';
                                      setBulkBorrowings(newRows);
                                      const newErrors = [...bulkBorrowingRowErrors];
                                      newErrors[idx] = '';
                                      setBulkBorrowingRowErrors(newErrors);
                                    }}
                                    className="form-input"
                                  >
                                    <option value="">Select Book</option>
                                    {books.map(book => (
                                      <option key={book.id} value={book.id}>{book.title}</option>
                                    ))}
                                  </select>
                                  {row._bookNameError && !row.book_id && (
                                    <div style={{ color: 'red', fontSize: 13 }}>{row._bookNameError}</div>
                                  )}
                                </td>
                                <td><input type="date" value={row.issue_date} onChange={e => handleBulkBorrowingInputChange(idx, 'issue_date', (e.target as HTMLInputElement).value)} className="form-input" /></td>
                                <td><input type="date" value={row.return_date} onChange={e => handleBulkBorrowingInputChange(idx, 'return_date', (e.target as HTMLInputElement).value)} className="form-input" /></td>
                                <td><button className="btn btn-sm" style={{ background: '#ef4444', color: '#fff' }} onClick={() => handleRemoveBulkBorrowingRow(idx)} type="button">Remove</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <button className="btn mt-4" style={{ background: '#a6192e', color: '#fff' }} onClick={handleBulkBorrowingSubmit} disabled={bulkBorrowingLoading || bulkBorrowings.length === 0}>
                      {bulkBorrowingLoading ? 'Submitting...' : 'Submit All'}
                    </button>
                  </div>
                )}
              </div>
            )}
            {!showAddBorrowing && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
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
                  Record Borrowing
                </button>
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px 0 #f3eaea', padding: '2rem', minHeight: 300 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16 }}>Book Requests</h2>
            {loadingRequests ? (
              <div>Loading...</div>
            ) : requestError ? (
              <div style={{ color: 'red', marginBottom: 12 }}>{requestError}</div>
            ) : requests.length === 0 ? (
              <div style={{ color: '#888' }}>No book requests found.</div>
            ) : (
              <div style={{ overflowY: 'auto', maxHeight: 340, borderRadius: 12, boxShadow: '0 2px 8px 0 #f3eaea', background: '#fff' }}>
                <table className="marks-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', paddingLeft: 20 }}>Student</th>
                      <th style={{ textAlign: 'left' }}>Book</th>
                      <th style={{ textAlign: 'center' }}>Requested Duration</th>
                      <th style={{ minWidth: 120, textAlign: 'center' }}>Status</th>
                      <th style={{ textAlign: 'center' }}>Request Date</th>
                      <th style={{ textAlign: 'center' }}>Approval Date</th>
                      <th style={{ textAlign: 'center' }}>Return Date</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(req => (
                      <tr key={req.id}>
                        <td style={{ textAlign: 'left', paddingLeft: 20 }}>{req.student?.name || '-'}<div style={{ fontSize: '0.85rem', color: '#666' }}>{req.student?.student_id || '-'}</div></td>
                        <td style={{ textAlign: 'left' }}>{req.book?.title || '-'}<div style={{ fontSize: '0.85rem', color: '#666' }}>{req.book?.author || '-'}</div></td>
                        <td style={{ textAlign: 'center' }}>{req.requested_duration}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: req.status === 'approved' ? '#10b981' : req.status === 'denied' ? '#ef4444' : '#f59e0b' }}>{req.status.charAt(0).toUpperCase() + req.status.slice(1)}</td>
                        <td style={{ textAlign: 'center' }}>{req.request_date ? new Date(req.request_date).toLocaleDateString() : '-'}</td>
                        <td style={{ textAlign: 'center' }}>{req.approval_date ? new Date(req.approval_date).toLocaleDateString() : '-'}</td>
                        <td style={{ textAlign: 'center' }}>{req.return_date ? new Date(req.return_date).toLocaleDateString() : '-'}</td>
                        <td style={{ textAlign: 'center' }}>
                          {req.status === 'pending' && (
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                              <button
                                className="btn btn-sm"
                                style={{ background: '#10b981', color: '#fff', fontWeight: 600, borderRadius: 6, padding: '0.4rem 1.2rem' }}
                                onClick={() => handleApproveRequest(req)}
                                disabled={requestActionLoading === req.id}
                              >
                                {requestActionLoading === req.id ? 'Approving...' : 'Approve'}
                              </button>
                              <button
                                className="btn btn-sm"
                                style={{ background: '#ef4444', color: '#fff', fontWeight: 600, borderRadius: 6, padding: '0.4rem 1.2rem' }}
                                onClick={() => handleDenyRequest(req)}
                                disabled={requestActionLoading === req.id}
                              >
                                {requestActionLoading === req.id ? 'Denying...' : 'Deny'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 700px) {
          .library-tabs-scrollable {
            overflow-x: auto;
            white-space: nowrap;
            width: 100vw;
            margin-bottom: 1rem;
            box-sizing: border-box;
            padding: 0 1rem;
          }
          .library-tabs-scrollable .tab-btn {
            display: inline-block;
            min-width: 120px;
            width: auto;
            margin-right: 0.5rem;
            font-size: 1rem;
            box-sizing: border-box;
          }
          .admin-library, .card {
            width: 100vw !important;
            max-width: 100vw !important;
            min-width: 0 !important;
            box-sizing: border-box;
            margin: 0 auto !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLibrary; 