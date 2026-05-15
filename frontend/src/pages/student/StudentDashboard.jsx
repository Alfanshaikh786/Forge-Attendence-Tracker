import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import HeatmapGrid from '../../components/ui/HeatmapGrid';
import ProgressBar from '../../components/ui/ProgressBar';
import StatusPill from '../../components/ui/StatusPill';
import { getStudentRecord, getAttendanceStats, getAttendanceHistory, getAttendanceHeatmap, getUpcomingSession } from '../../lib/api';
import { Loader2 } from 'lucide-react';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState(null);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [upcoming, setUpcoming] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentRes, statsRes, historyRes, heatmapRes, upcomingRes] = await Promise.all([
          getStudentRecord(),
          getAttendanceStats(),
          getAttendanceHistory(1, 4),
          getAttendanceHeatmap(),
          getUpcomingSession()
        ]);

        setStudentData(studentRes.student);
        setStats(statsRes.stats);
        setHistory(historyRes.history);
        setUpcoming(upcomingRes.session);

        // Convert heatmap to grid format
        const hData = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          hData.push({
            date: dateStr,
            status: heatmapRes.heatmap[dateStr] || 'none'
          });
        }
        setHeatmap(hData);
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={40} />
      </div>
    );
  }

  const displayData = {
    name: studentData?.fullName || user?.name || "Student",
    usn: studentData?.usn || "N/A",
    branch: studentData?.department || "N/A",
    batch: `${studentData?.batchYear}–${(studentData?.batchYear || 0) + 3}`,
    attendancePct: stats?.attendancePercentage || 0,
    totalSessions: stats?.totalSessions || 0,
    attendedSessions: stats?.sessionsAttended || 0
  };



  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Card */}
      <Card glow className="!p-0 border-accent/20">
        <div className="flex flex-col lg:flex-row items-stretch">
          <div className="flex-1 p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-border-subtle">
            <h2 className="font-display text-[42px] md:text-[52px] font-bold text-fg-primary leading-tight tracking-tight">
              Hey, <span className="text-accent">{displayData.name.split(' ')[0]}</span>!
            </h2>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-fg-tertiary uppercase tracking-widest">USN:</span>
                <span className="text-sm font-mono text-fg-secondary font-bold">{displayData.usn}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-fg-tertiary uppercase tracking-widest">Department:</span>
                <span className="text-sm font-mono text-fg-secondary font-bold">{displayData.branch}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-fg-tertiary uppercase tracking-widest">Batch:</span>
                <span className="text-sm font-mono text-fg-secondary font-bold">{displayData.batch}</span>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-6">
              <div className="flex-1 max-w-xs">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[11px] font-bold text-fg-tertiary uppercase tracking-widest">Target Attendance</span>
                  <span className="text-xs font-mono text-fg-secondary">{displayData.attendancePct} / 75%</span>
                </div>
                <ProgressBar progress={displayData.attendancePct} height="h-2" />
              </div>
              <div className={clsx(
                "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border",
                displayData.attendancePct >= 75 
                  ? "text-success bg-success/10 border-success/20" 
                  : "text-warning bg-warning/10 border-warning/20"
              )}>
                <TrendingUp size={14} />
                <span className="text-[11px] font-bold uppercase tracking-widest">
                  {displayData.attendancePct >= 75 ? 'On Track' : 'At Risk'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-10 flex flex-col items-center justify-center lg:w-72 bg-accent/5">
            <div className={clsx(
              "text-[72px] font-display font-bold leading-none tabular-nums",
              displayData.attendancePct >= 75 ? "text-success" : 
              displayData.attendancePct >= 60 ? "text-warning" : "text-danger"
            )}>
              {displayData.attendancePct}
            </div>
            <span className="text-[11px] font-bold text-fg-tertiary uppercase tracking-[0.2em] mt-2">
              Percentage
            </span>
          </div>
        </div>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heatmap */}
        <Card className="flex flex-col h-full">
          <HeatmapGrid 
            data={heatmap} 
            month={new Date().toLocaleString('default', { month: 'long' })} 
            year={new Date().getFullYear().toString()} 
            onMonthChange={() => {}}
          />
          <div className="mt-auto pt-6 flex justify-between items-center text-xs text-fg-tertiary font-mono uppercase tracking-widest">
            <span>Present: {stats?.sessionsAttended || 0} sessions</span>
            <span>Absent: {stats?.sessionsMissed || 0} sessions</span>
          </div>
        </Card>

        {/* Next Session */}
        <Card className="flex flex-col bg-surface-raised/30 border-accent/10">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-fg-tertiary mb-6 block">
            Upcoming Session
          </span>
          
          {upcoming ? (
            <>
              <div className="flex justify-between items-start mb-4">
                <div className="text-[48px] md:text-[56px] font-display font-bold text-fg-primary leading-none tabular-nums">
                  {new Date(upcoming.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase()}
                </div>
                <StatusPill status="info" label={upcoming.sessionType} />
              </div>

              <h3 className="text-2xl font-bold text-fg-primary mb-2">
                {upcoming.topic}
              </h3>
              
              <div className="flex gap-4 mb-6">
                <div className="flex items-center gap-2 text-fg-secondary">
                  <Clock size={16} />
                  <span className="text-sm font-mono">10:00 AM</span>
                </div>
                <div className="flex items-center gap-2 text-fg-secondary">
                  <MapPin size={16} />
                  <span className="text-sm">{upcoming.sessionType === 'online' ? 'Online (Zoom)' : 'Main Campus'}</span>
                </div>
              </div>

              {upcoming.notes && (
                <div className="mt-auto p-4 rounded-xl bg-surface-inset border border-border-subtle flex gap-4">
                  <AlertCircle size={20} className="text-accent shrink-0" />
                  <p className="text-xs text-fg-secondary italic leading-relaxed">
                    {upcoming.notes}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
              <Calendar size={48} className="text-fg-tertiary opacity-20 mb-4" />
              <p className="text-fg-tertiary italic">No upcoming sessions scheduled.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Sessions Table */}
      <Card className="!p-0 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-border-subtle flex justify-between items-center">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-fg-tertiary">
            Recent Sessions
          </h3>
          <button type="button" onClick={() => navigate('/student/attendance')} className="text-[10px] font-bold text-accent hover:underline uppercase tracking-widest flex items-center gap-1">
            View Full History
            <ArrowRight size={12} />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-inset">
                <th className="px-8 py-4 text-[10px] font-bold text-fg-tertiary uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-[10px] font-bold text-fg-tertiary uppercase tracking-widest">Topic</th>
                <th className="px-8 py-4 text-[10px] font-bold text-fg-tertiary uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-bold text-fg-tertiary uppercase tracking-widest">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {history.map((session, idx) => (
                <tr key={idx} className="hover:bg-surface-raised transition-colors group">
                  <td className="px-8 py-4 text-sm font-mono text-fg-tertiary group-hover:text-fg-primary">
                    {new Date(session.date).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-4 text-sm font-semibold text-fg-primary">{session.topic}</td>
                  <td className="px-8 py-4">
                    <StatusPill status={session.status} />
                  </td>
                  <td className="px-8 py-4 text-sm text-fg-secondary">{session.duration}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default StudentDashboard;
