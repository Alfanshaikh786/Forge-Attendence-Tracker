import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin, getProfile } from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export const LoginPage = () => {
  const [role, setRole] = useState('mentor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      navigate(user.role === 'mentor' ? '/mentor/dashboard' : '/student/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiLogin(role, email, password);
      const profile = await getProfile();
      const userData = profile.user || profile;
      login(userData);
      navigate(userData.role === 'mentor' ? '/mentor/dashboard' : '/student/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{
      backgroundColor: 'var(--primary-bg)',
    }}>
      {/* Aurora Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[600px] pointer-events-none opacity-60" style={{
        background: 'radial-gradient(ellipse 600px 300px at 50% 0%, rgba(108,99,255,0.3), transparent 70%)',
      }} />
      
      <div className="w-full max-w-[440px] relative z-10 mt-[10vh] animate-page-enter">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg" style={{
              backgroundColor: 'rgba(108, 99, 255, 0.15)',
              borderColor: 'rgba(108, 99, 255, 0.3)',
              boxShadow: '0 0 15px rgba(108, 99, 255, 0.2)',
            }}>
              <Flame className="logo-icon" size={28} strokeWidth={2} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <span className="logo-wordmark text-3xl">ForgeTrack</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Track your learning journey</p>
        </div>

        <Card className="shadow-2xl" style={{ borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
          {/* Role Switcher */}
          <div className="rounded-lg p-1 flex mb-8 border" style={{
            backgroundColor: 'rgba(108, 99, 255, 0.05)',
            borderColor: 'var(--border-subtle)',
          }}>
            <button
              onClick={() => setRole('mentor')}
              className="flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200"
              style={{
                backgroundColor: role === 'mentor' ? 'var(--card-surface)' : 'transparent',
                color: role === 'mentor' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: role === 'mentor' ? '0 4px 12px rgba(108, 99, 255, 0.15)' : 'none',
              }}
            >
              Mentor
            </button>
            <button
              onClick={() => setRole('student')}
              className="flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200"
              style={{
                backgroundColor: role === 'student' ? 'var(--card-surface)' : 'transparent',
                color: role === 'student' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: role === 'student' ? '0 4px 12px rgba(108, 99, 255, 0.15)' : 'none',
              }}
            >
              Student
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="space-y-1">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {role === 'mentor' && (
                <div className="text-right">
                  <button type="button" onClick={() => navigate('/change-password')} className="text-xs hover:underline" style={{ color: 'var(--accent-primary)' }}>
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="border rounded-md p-3 flex items-center gap-3 text-sm" style={{
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                borderColor: 'rgba(244, 63, 94, 0.3)',
                color: '#F43F5E',
              }}>
                <AlertCircle size={18} strokeWidth={1.75} />
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full h-12"
              loading={loading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[11px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
              Access
            </p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>
              Use credentials issued by your administrator.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
