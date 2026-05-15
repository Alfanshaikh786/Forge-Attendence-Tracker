import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldCheck, AlertCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import ProgressBar from '../components/ui/ProgressBar';
import { changePassword as apiChangePassword } from '../lib/api';

export const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      await apiChangePassword(oldPassword, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 animate-fade-in">
      <section className="mb-8">
        <h2 className="font-display text-3xl font-bold text-fg-primary">Security Settings</h2>
        <p className="text-fg-secondary text-sm mt-1">Manage your account security and password.</p>
      </section>

      <Card glow className="relative">
        <div className="absolute top-0 right-0 p-8 text-accent/10 pointer-events-none">
          <KeyRound size={120} strokeWidth={1} />
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
              
              <div className="h-px bg-border-subtle my-2" />
              
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                hint="Minimum 8 characters"
                required
              />
              
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 flex gap-3 text-danger text-sm">
                <AlertCircle size={18} className="shrink-0" />
                {error}
              </div>
            )}

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Button type="submit" variant="primary" className="flex-1" loading={loading}>
                Update Password
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate(-1)} disabled={loading}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="py-12 flex flex-col items-center text-center animate-fade-in">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center text-success mb-6 border border-success/20">
              <ShieldCheck size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-bold text-fg-primary mb-2">Password Updated!</h3>
            <p className="text-fg-secondary mb-8">
              Your password has been changed successfully. Redirecting you back...
            </p>
            <ProgressBar progress={100} className="w-full max-w-xs" />
          </div>
        )}
      </Card>
    </div>
  );
};

export default ChangePassword;
