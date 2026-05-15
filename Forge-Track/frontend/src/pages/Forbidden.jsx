import React from 'react';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export const Forbidden = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleHome = () => {
    if (!user) navigate('/login');
    else navigate(user.role === 'mentor' ? '/mentor/dashboard' : '/student/dashboard');
  };

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[500px] bg-cosmic-glow pointer-events-none opacity-30" />
      
      <Card className="max-w-md w-full text-center py-12 animate-fade-in relative z-10 border-danger/20">
        <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center text-danger mx-auto mb-6 border border-danger/20 shadow-[0_0_20px_rgba(244,63,94,0.1)]">
          <ShieldAlert size={40} strokeWidth={1.5} />
        </div>
        
        <h1 className="text-4xl font-display font-bold text-fg-primary mb-2">403</h1>
        <h2 className="text-xl font-bold text-fg-primary mb-4">Access Denied</h2>
        
        <p className="text-sm text-fg-secondary mb-10 leading-relaxed">
          You don't have permission to access this area. If you believe this is an error, please contact your administrator.
        </p>

        <div className="flex flex-col gap-3">
          <Button variant="primary" onClick={handleHome} className="w-full">
            <Home size={18} />
            Go to Dashboard
          </Button>
          <Button variant="ghost" onClick={() => navigate(-1)} className="w-full">
            <ArrowLeft size={18} />
            Go Back
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Forbidden;
