import { useEffect, useState } from 'react';
import { Flame, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { login } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [role, setRole] = useState('mentor');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(user.role === 'mentor' ? '/mentor/dashboard' : '/student/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(role, identifier, password);
      if (data.user) {
        navigate(data.user.role === 'mentor' ? '/mentor/dashboard' : '/student/dashboard', { replace: true });
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-void px-4 text-fg-primary">
      <div className="absolute inset-x-0 top-0 h-[420px] bg-cosmic-glow" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.04),_transparent_38%),radial-gradient(circle_at_center,_rgba(99,102,241,0.12),_transparent_35%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[440px] items-start justify-center pt-[15vh]">
        <Card className="w-full">
          <div className="flex items-center justify-center gap-3 text-center">
            <Flame size={28} strokeWidth={1.75} className="text-accent" />
            <h1 className="font-display text-2xl font-bold text-fg-primary">ForgeTrack</h1>
          </div>
          <p className="mt-1 text-center text-sm text-fg-secondary">Track your learning journey</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="rounded-lg bg-surface-inset p-1">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setRole('mentor')}
                  className={role === 'mentor' ? 'rounded-md bg-surface-raised px-3 py-2 font-medium text-fg-primary shadow-sm' : 'rounded-md px-3 py-2 text-fg-secondary'}
                >
                  Mentor
                </button>
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={role === 'student' ? 'rounded-md bg-surface-raised px-3 py-2 font-medium text-fg-primary shadow-sm' : 'rounded-md px-3 py-2 text-fg-secondary'}
                >
                  Student
                </button>
              </div>
            </div>

            <Input
              label="Email or USN"
              type={role === 'student' ? 'text' : 'email'}
              placeholder={role === 'student' ? 'Enter your USN' : 'Enter your email'}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {role === 'mentor' ? (
              <div className="text-right text-sm">
                <button type="button" className="text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50" onClick={() => navigate('/change-password')}>
                  Forgot password?
                </button>
              </div>
            ) : null}

            {error ? (
              <div className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                <AlertCircle size={20} strokeWidth={1.75} />
                <span>{error}</span>
              </div>
            ) : null}

            <Button type="submit" className="h-12 w-full" loading={loading}>
              Sign In
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
