import { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  ClipboardCheck, 
  Calendar, 
  TrendingUp, 
  ArrowRight,
  Plus,
  UserCheck,
  Loader2,
  Activity,
  Zap,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import ProgressBar from '../../components/ui/ProgressBar';
import StatusPill from '../../components/ui/StatusPill';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { CyberCard } from '../../components/ui/CyberCard';
import { CyberMetric } from '../../components/ui/CyberMetric';
import { CyberBackground } from '../../components/ui/CyberBackground';
import { getMentorStats } from '../../lib/api';
import gsap from 'gsap';
import toast from 'react-hot-toast';

export const MentorDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const systemStatusRef = useRef(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await getMentorStats();
        setData(result.stats);
      } catch (err) {
        toast.error('Failed to fetch dashboard stats');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-cyber-neon" size={40} />
      </div>
    );
  }

  const systemStatus = data.today.total > 0 
    ? data.today.present / data.today.total > 0.8 
      ? 'active' 
      : 'delayed'
    : 'offline';

  return (
    <>
      <CyberBackground interactive={true} particleCount={400} />
      
      <div className="space-y-8 animate-fade-in relative z-10">
        {/* System Header */}
        <section className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-mono text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00ff00] to-cyan-400 tracking-widest uppercase drop-shadow-[0_0_10px_rgba(0,255,0,0.4)]">
              FACULTY DASHBOARD
            </h2>
            <h3 className="text-cyber-neon font-mono text-lg mt-1 uppercase tracking-tighter">Welcome, {user.name}</h3>
            <p className="text-cyber-text-secondary text-sm font-mono mt-2">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div 
            ref={systemStatusRef}
            className="flex items-center gap-2 px-4 py-2 border border-cyber-border rounded-sm bg-cyber-surface/50"
          >
            <div className={`w-2 h-2 rounded-full ${
              systemStatus === 'active' ? 'bg-[#00ff00] shadow-[0_0_8px_rgba(0,255,0,0.8)] animate-pulse' :
              systemStatus === 'delayed' ? 'bg-warning-color animate-pulse' :
              'bg-gray-600'
            }`} />
            <span className="font-mono text-xs text-cyber-text-secondary uppercase tracking-wider">
              Status: <span className={systemStatus === 'active' ? 'text-[#00ff00] font-bold drop-shadow-[0_0_5px_rgba(0,255,0,0.5)]' : ''}>{systemStatus.toUpperCase()}</span>
            </span>
          </div>
        </section>

        {/* Metrics Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CyberCard title="SESSIONS" icon="📅" animated={true} interactive={true}>
            <CyberMetric
              label="Total"
              value={data.totalSessions}
              status="active"
            />
          </CyberCard>

          <CyberCard title="ATTENDANCE" icon="📊" animated={true} interactive={true}>
            <CyberMetric
              label="Average"
              value={data.avgAttendance}
              unit="%"
              status="active"
            />
          </CyberCard>

          <CyberCard title="STUDENTS" icon="👥" animated={true} interactive={true}>
            <CyberMetric
              label="Active"
              value={data.totalStudents}
              status="active"
            />
          </CyberCard>

          <CyberCard title="TODAY" icon="⚡" animated={true} interactive={true}>
            <CyberMetric
              label="Attendance"
              value={data.today.total > 0 ? Math.round((data.today.present / data.today.total) * 100) : 0}
              unit="%"
              status={systemStatus}
            />
          </CyberCard>
        </section>

        {/* Today's Active Sessions (Multi-Subject Support) */}
        {data.todaySessions?.length > 1 && (
          <section className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-[11px] font-bold text-[#ff00ff] uppercase tracking-[0.2em] px-2 drop-shadow-[0_0_5px_rgba(255,0,255,0.4)]">
              ACTIVE SESSIONS ({data.todaySessions.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.todaySessions.map((session) => (
                <CyberCard key={session.id} title={session.subjectCode || 'GENERAL'} icon="⚡" interactive={true} className="!p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold text-[#00ff00] truncate max-w-[70%] drop-shadow-[0_0_5px_rgba(0,255,0,0.3)]">
                      {session.subjectName}
                    </h4>
                    <span className="text-xs font-mono text-cyber-text-secondary">
                      {session.present}/{session.total}
                    </span>
                  </div>
                  <ProgressBar progress={session.total > 0 ? (session.present / session.total) * 100 : 0} size="sm" />
                  <div className="mt-3 flex justify-end">
                    <Link to="/mentor/attendance" className="text-[9px] font-bold text-cyan-400 hover:text-[#00ff00] transition-colors uppercase tracking-widest flex items-center gap-1">
                      Details <ArrowRight size={10} />
                    </Link>
                  </div>
                </CyberCard>
              ))}
            </div>
          </section>
        )}

        {/* Session & Attendance Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Session */}
          <CyberCard 
            title="TODAY'S SESSION" 
            icon="🔴"
            animated={true} 
            interactive={true}
            className="flex flex-col min-h-[200px]"
          >
            {data.today.total > 0 || (data.today.sessionTopic && data.today.sessionTopic !== 'No session today') ? (
              <>
                <h3 className="text-xl font-mono font-bold text-[#00ff00] drop-shadow-[0_0_8px_rgba(0,255,0,0.5)] mb-3 uppercase tracking-wide">
                  {data.today.sessionTopic}
                </h3>
                <p className="text-cyber-text-secondary text-sm font-mono mb-6">
                  ▸ Attendance tracking is LIVE
                </p>
                <div className="mt-auto">
                  <Link to="/mentor/attendance">
                    <Button variant="primary" size="md" className="w-full">
                      <Zap size={18} />
                      MARK ATTENDANCE
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex flex-col h-full items-center justify-center text-center p-6 border border-dashed border-cyber-border rounded">
                <Calendar className="text-cyber-neon/20 mb-3" size={32} />
                <p className="text-cyber-text-secondary text-sm font-mono mb-6">
                  ✗ No session scheduled for today
                </p>
                <div className="mt-auto w-full">
                  <Link to="/mentor/attendance">
                    <Button variant="primary" size="md" className="w-full">
                      <Plus size={18} />
                      CREATE SESSION
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CyberCard>

          {/* Attendance Status */}
          <CyberCard 
            title="ATTENDANCE DELTA" 
            icon="📈"
            animated={true} 
            interactive={true}
            className="flex flex-col min-h-[200px]"
          >
            {data.today.total > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <span className="text-4xl font-mono font-bold text-[#00ff00] drop-shadow-[0_0_10px_rgba(0,255,0,0.6)] tabular-nums">
                      {data.today.present}
                    </span>
                    <span className="text-cyber-text-secondary text-sm font-mono ml-2">
                      / {data.today.total} present
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-mono font-bold ${
                      data.today.present / data.today.total > 0.8 
                        ? 'text-[#00ff00] drop-shadow-[0_0_8px_rgba(0,255,0,0.5)]' 
                        : 'text-warning-color'
                    } tabular-nums`}>
                      {Math.round((data.today.present / data.today.total) * 100)}%
                    </div>
                  </div>
                </div>
                <ProgressBar progress={(data.today.present / data.today.total) * 100} size="md" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-cyber-surface/30 rounded border border-cyber-border/20">
                <TrendingUp className="text-cyber-neon/10 mb-2" size={24} />
                <p className="text-cyber-text-secondary text-xs font-mono uppercase tracking-widest opacity-60">
                  Waiting for live data...
                </p>
              </div>
            )}
          </CyberCard>
        </div>

        {/* Global Empty State Overlay (If no sessions ever) */}
        {data.totalSessions === 0 && (
          <CyberCard className="border-cyber-neon/30 bg-cyber-neon/[0.02]">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-cyber-neon/10 flex items-center justify-center mb-6 border border-cyber-neon/30 shadow-[0_0_20px_rgba(0,255,0,0.1)]">
                <Activity className="text-cyber-neon" size={32} />
              </div>
              <h4 className="text-2xl font-mono font-bold text-cyber-neon mb-2 uppercase tracking-tighter">Initial State Protocol</h4>
              <p className="text-cyber-text-secondary font-mono text-sm max-w-md mb-8">
                Your dashboard is currently empty. No attendance records detected in the neural network for your assigned subjects.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/mentor/attendance">
                  <Button variant="primary">
                    <Plus size={18} />
                    INITIALIZE FIRST SESSION
                  </Button>
                </Link>
                <Link to="/mentor/bulk-import">
                  <Button variant="secondary">
                    <FileSpreadsheet size={18} />
                    BULK IMPORT RECORDS
                  </Button>
                </Link>
              </div>
            </div>
          </CyberCard>
        )}

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
          {/* Program Metrics */}
          <CyberCard 
            title="PROGRAM METRICS" 
            icon="📊"
            animated={true} 
            interactive={true}
            className="lg:col-span-1"
          >
            <div className="space-y-4">
              {[
                { label: 'Total Sessions', value: data.totalSessions, status: 'active' },
                { label: 'Avg Attendance', value: `${data.avgAttendance}%`, status: 'active' },
                { label: 'Present Today', value: data.today.present, status: 'success' },
                { label: 'Absent Today', value: data.today.absent, status: 'danger' },
              ].map((item, idx) => (
                <div key={item.label} className="flex justify-between items-center pb-3 border-b border-cyber-border/30">
                  <span className="text-xs font-mono text-cyber-text-secondary uppercase tracking-wider">
                    {item.label}
                  </span>
                  <span className={`font-mono font-bold text-sm ${
                    item.status === 'success' ? 'text-[#00ff00] drop-shadow-[0_0_5px_rgba(0,255,0,0.4)]' :
                    item.status === 'danger' ? 'text-[#ff00ff] drop-shadow-[0_0_5px_rgba(255,0,255,0.4)]' :
                    'text-cyber-text'
                  }`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CyberCard>

          {/* Absent Students */}
          <CyberCard 
            title="ABSENT ALERT" 
            icon="⚠️"
            animated={true} 
            interactive={true}
            className="lg:col-span-2"
          >
            {data.today.absentStudents && data.today.absentStudents.length > 0 ? (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {data.today.absentStudents.slice(0, 5).map((student, idx) => (
                  <div key={idx} className="flex gap-3 items-center pb-3 border-b border-cyber-border/30 last:border-0 hover:bg-cyber-neon/5 px-2 py-1 rounded transition-colors">
                    <div className="w-1 h-1 rounded-full bg-[#ff00ff] shadow-[0_0_5px_rgba(255,0,255,0.8)] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono text-cyber-text truncate">
                        {student.fullName}
                      </p>
                      <span className="text-[10px] font-mono text-cyber-text-secondary uppercase tracking-wider">
                        {student.usn}
                      </span>
                    </div>
                    <span className="text-xs font-mono px-2 py-1 bg-[#ff00ff]/10 border border-[#ff00ff]/50 text-[#ff00ff] shadow-[0_0_8px_rgba(255,0,255,0.3)] rounded-sm">
                      ABSENT
                    </span>
                  </div>
                ))}
                {data.today.absentStudents.length > 5 && (
                  <p className="text-xs text-cyber-text-secondary font-mono italic text-center pt-2">
                    +{data.today.absentStudents.length - 5} more
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <UserCheck size={28} className="text-cyber-neon/40 mb-2" />
                <p className="text-sm text-cyber-text-secondary font-mono italic">
                  ✓ All present today
                </p>
              </div>
            )}
          </CyberCard>
        </div>
      </div>
    </>
  );
};

export default MentorDashboard;
