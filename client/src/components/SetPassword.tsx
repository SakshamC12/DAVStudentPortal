import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const SetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const accessToken = searchParams.get('access_token');
  const type = searchParams.get('type');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);

  useEffect(() => {
    const trySession = async () => {
      if (accessToken && (type === 'invite' || type === 'recovery')) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(accessToken as string);
        if (data?.session && !error) {
          setValidToken(true);
        } else {
          setError('Invalid or expired link.');
        }
      } else {
        setError('Missing token in URL.');
      }
    };
    trySession();
  }, [accessToken, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError('Failed to set password.');
    } else {
      setSuccess('Password set successfully! Redirecting...');
      setTimeout(() => navigate('/'), 2000);
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Set Your Password</h1>
          <p className="text-gray-600">Create a password for your admin account</p>
        </div>
        {error && <div className="alert alert-error mb-4 text-red-600 text-sm text-center">{error}</div>}
        {success && <div className="alert alert-success mb-4 text-green-600 text-sm text-center">{success}</div>}
        {validToken ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group mt-4">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn w-full mt-6" disabled={loading}>
              {loading ? 'Setting Password...' : 'Set Password'}
            </button>
          </form>
        ) : (
          <div className="text-center text-gray-500">This link is invalid or expired.</div>
        )}
      </div>
    </div>
  );
};

export default SetPassword;
