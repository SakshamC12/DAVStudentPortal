import React from 'react';

interface AdminPageProps {
  adminUser: any;
  onLogout: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ adminUser, onLogout }) => {
  return (
    <div className="py-8">
      <div className="card" style={{ maxWidth: 600, margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <p className="mb-6">Welcome, {adminUser?.email || 'Admin'}!</p>
        <button className="btn btn-danger" onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
};

export default AdminPage; 