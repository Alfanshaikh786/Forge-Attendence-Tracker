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
  AlertCircle
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
            <h2 className="font-mono text-3xl md:text-4xl font-bold text-cyber-neon tracking-widest uppercase">
              SYSTEM OVERVIEW
            </h2>
            <p className="text-cyber-text-secondary text-sm font-mono mt-2">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div 
            ref={systemStatusRef}
            className="flex items-center gap-2 px-4 py-2 border border-cyber-border rounded-sm bg-cyber-surface/50"
          >
            <div className={`w-2 h-2 rounded-full ${
              systemStatus === 'active' ? 'bg-cyber-neon animate-pulse-neon' :
              systemStatus === 'delayed' ? 'bg-warning-color animate-pulse' :
              'bg-gray-600'
            }`} />
            <span className="font-mono text-xs text-cyber-text-secondary uppercase tracking-wider">
              Status: {systemStatus.toUpperCase()}
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
            {data.today.total > 0 || data.today.sessionTopic !== 'No session today' ? (
              <>
                <h3 className="text-xl font-mono font-bold text-cyber-neon mb-3 uppercase tracking-wide">
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
              <>
                <p className="text-cyber-text-secondary text-sm font-mono mb-6">
                  ✗ No session scheduled
                </p>
                <div className="mt-auto">
                  <Link to="/mentor/attendance">
                    <Button variant="primary" size="md" className="w-full">
                      <Plus size={18} />
                      CREATE SESSION
                    </Button>
                  </Link>
                </div>
              </>
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
                    <span className="text-4xl font-mono font-bold text-cyber-neon tabular-nums">
                      {data.today.present}
                    </span>
                    <span className="text-cyber-text-secondary text-sm font-mono ml-2">
                      / {data.today.total} present
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-mono font-bold ${
                      data.today.present / data.today.total > 0.8 
                        ? 'text-cyber-neon' 
                        : 'text-warning-color'
                    } tabular-nums`}>
                      {Math.round((data.today.present / data.today.total) * 100)}%
                    </div>
                  </div>
                </div>
                <ProgressBar progress={(data.today.present / data.today.total) * 100} size="md" />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <p className="text-cyber-text-secondary text-sm font-mono">
                  ▸ Create a session first
                </p>
              </div>
            )}
          </CyberCard>
        </div>

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
                    item.status === 'success' ? 'text-cyber-neon' :
                    item.status === 'danger' ? 'text-danger-color' :
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
                    <div className="w-1 h-1 rounded-full bg-danger-color flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono text-cyber-text truncate">
                        {student.fullName}
                      </p>
                      <span className="text-[10px] font-mono text-cyber-text-secondary uppercase tracking-wider">
                        {student.usn}
                      </span>
                    </div>
                    <span className="text-xs font-mono px-2 py-1 bg-danger-color/10 border border-danger-color/30 text-danger-color rounded-sm">
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
