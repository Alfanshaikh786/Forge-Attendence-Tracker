import React, { useState } from 'react';
import { User, Shield, Moon, Sun, Monitor, Camera, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { apiRequest } from '../lib/api';
import toast from 'react-hot-toast';

export const Settings = () => {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [profileImage, setProfileImage] = useState(user?.profile_image || '');
  const [theme, setTheme] = useState(user?.theme || 'dark');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiRequest('/auth/update-profile', {
        method: 'POST',
        body: JSON.stringify({ displayName, profileImage }),
      });
      login(res.user);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTheme = async (newTheme) => {
    setTheme(newTheme);
    try {
      const res = await apiRequest('/auth/update-settings', {
        method: 'POST',
        body: JSON.stringify({ theme: newTheme }),
      });
      login(res.user);
      toast.success(`Theme changed to ${newTheme}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <section>
        <h2 className="text-3xl font-display font-bold text-fg-primary">Settings</h2>
        <p className="text-fg-secondary text-sm mt-1">Manage your account preferences and application settings.</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation */}
        <div className="space-y-2">
          <button onClick={() => document.getElementById('profile-section')?.scrollIntoView({ behavior: 'smooth' })} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/10 text-accent border border-accent/20 font-medium">
            <User size={18} />
            Profile Settings
          </button>
          <button onClick={() => document.getElementById('theme-section')?.scrollIntoView({ behavior: 'smooth' })} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-fg-secondary hover:bg-surface-raised transition-all font-medium">
            <Shield size={18} />
            Security
          </button>
        </div>

        {/* Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Section */}
          <Card id="profile-section">
            <h3 className="text-lg font-bold text-fg-primary mb-6 flex items-center gap-2">
              <User size={20} className="text-accent" />
              Public Profile
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border-subtle">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-surface-inset border-2 border-border-default overflow-hidden flex items-center justify-center">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={40} className="text-fg-tertiary" />
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                    <Camera size={24} className="text-white" />
                    <input 
                      type="text" 
                      className="hidden" 
                      placeholder="Image URL"
                      onChange={(e) => setProfileImage(e.target.value)}
                    />
                  </label>
                </div>
                <div className="flex-1 space-y-1 text-center sm:text-left">
                  <h4 className="font-bold text-fg-primary">Profile Photo</h4>
                  <p className="text-xs text-fg-tertiary">Enter a URL for your profile image.</p>
                  <input 
                    type="text"
                    value={profileImage}
                    onChange={(e) => setProfileImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="mt-2 w-full bg-surface-inset border border-border-default rounded-lg px-3 py-1.5 text-xs text-fg-primary focus:border-accent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Input 
                  label="Display Name" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                />
                <Input 
                  label="Email Address" 
                  value={user?.email || ''} 
                  disabled 
                  helperText="Email cannot be changed."
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" variant="primary" loading={loading}>
                  <Save size={18} />
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>

          {/* Theme Section */}
          <Card id="theme-section">
            <h3 className="text-lg font-bold text-fg-primary mb-6 flex items-center gap-2">
              <Sun size={20} className="text-accent" />
              Appearance
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <button 
                onClick={() => handleUpdateTheme('light')}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${theme === 'light' ? 'bg-accent/10 border-accent text-accent' : 'border-border-subtle bg-surface-inset text-fg-tertiary hover:border-border-strong'}`}
              >
                <Sun size={24} />
                <span className="text-xs font-bold uppercase tracking-widest">Light</span>
              </button>
              <button 
                onClick={() => handleUpdateTheme('dark')}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${theme === 'dark' ? 'bg-accent/10 border-accent text-accent' : 'border-border-subtle bg-surface-inset text-fg-tertiary hover:border-border-strong'}`}
              >
                <Moon size={24} />
                <span className="text-xs font-bold uppercase tracking-widest">Dark</span>
              </button>
              <button 
                onClick={() => handleUpdateTheme('cosmic')}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${theme === 'cosmic' ? 'bg-accent/10 border-accent text-accent' : 'border-border-subtle bg-surface-inset text-fg-tertiary hover:border-border-strong'}`}
              >
                <Monitor size={24} />
                <span className="text-xs font-bold uppercase tracking-widest">Cosmic</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
