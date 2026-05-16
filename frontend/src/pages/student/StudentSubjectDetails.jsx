import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, MapPin, ArrowLeft, 
  TrendingUp, Activity, CalendarDays, 
  UserCheck, CheckCircle, XCircle, Info,
  AlertCircle
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths } from 'date-fns';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';
import { toast } from 'react-hot-toast';

import { 
  getStudentSubjectDetails,
  getStudentSubjectAttendance,
  getStudentSubjectAnalytics,
  getStudentSubjectHeatmap
} from '../../lib/api';
import CyberCard from '../../components/ui/CyberCard';
import ProgressBar from '../../components/ui/ProgressBar';
import LoadingScreen from '../../components/ui/LoadingScreen';
import { CyberBackground } from '../../components/ui/CyberBackground';
import StatusPill from '../../components/ui/StatusPill';

const StudentSubjectDetails = () => {
  const { subjectCode } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Data state
  const [subject, setSubject] = useState(null);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [heatmap, setHeatmap] = useState([]);

  useEffect(() => {
    loadSubjectData();
  }, [subjectCode]);

  const loadSubjectData = async () => {
    try {
      setLoading(true);
      const [detailsRes, historyRes, analyticsRes, heatmapRes] = await Promise.all([
        getStudentSubjectDetails(subjectCode),
        getStudentSubjectAttendance(subjectCode),
        getStudentSubjectAnalytics(subjectCode),
        getStudentSubjectHeatmap(subjectCode)
      ]);

      setSubject(detailsRes.subject);
      setHistory(historyRes.history || []);
      setAnalytics(analyticsRes.trend || []);
      setHeatmap(heatmapRes.heatmap || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load subject data');
      navigate('/student/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Heatmap Logic
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getAttendanceForDay = (day) => {
    const record = heatmap.find(h => isSameDay(new Date(h.date), day));
    if (!record) return 'none';
    return record.status; // 'present', 'absent', 'none'
  };

  if (loading) return <LoadingScreen message="Initializing subject analytics..." />;
  if (!subject) return null;

  const lastSession = history[0] || null;

  return (
    <div className="relative min-h-screen pb-20">
      <CyberBackground interactive={false} particleCount={150} />
      
      <div className="relative z-10 space-y-8 animate-in fade-in duration-1000 max-w-7xl mx-auto px-4 md:px-0">
        
        {/* Aesthetic Banner Header */}
        <section className="bg-[#0f172a]/60 border border-cyber-border/40 rounded-3xl p-8 backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 space-y-4">
              <Link to="/student/dashboard" className="flex items-center gap-2 text-cyber-neon/60 hover:text-cyber-neon transition-colors font-mono text-xs uppercase tracking-widest mb-4">
                <ArrowLeft size={14} /> Back to Hub
              </Link>
              
              <div className="space-y-1">
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-cyber-text flex flex-wrap items-baseline gap-3 uppercase font-display">
                  {subject.name.split(' ')[0]} <span className="text-cyber-neon">{subject.name.split(' ').slice(1).join(' ')}</span>
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-cyber-text-secondary font-mono text-xs uppercase tracking-widest pt-2">
                  <span className="flex items-center gap-1.5"><Activity size={14} className="text-cyber-neon" /> {subject.code}</span>
                  <span className="flex items-center gap-1.5"><UserCheck size={14} className="text-[#ff00ff]" /> Faculty: {subject.faculty_name || 'Department'}</span>
                  <span className="flex items-center gap-1.5"><CalendarDays size={14} className="text-accent" /> {subject.total} Total Sessions</span>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-6">
                <div className="flex-1 max-w-xs">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[11px] font-bold text-cyber-neon uppercase tracking-widest drop-shadow-[0_0_5px_rgba(0,255,0,0.3)]">Target Status</span>
                    <span className="text-xs font-mono text-cyber-text font-bold">{subject.percentage}% / 75%</span>
                  </div>
                  <ProgressBar progress={subject.percentage} height="h-2" />
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-widest ${
                  subject.percentage >= 75 ? 'text-cyber-neon border-cyber-neon/30 bg-cyber-neon/10' : 'text-danger-color border-danger-color/30 bg-danger-color/10'
                }`}>
                  <TrendingUp size={14} />
                  {subject.percentage >= 75 ? 'On Track' : 'At Risk'}
                </div>
              </div>
            </div>

            {/* Giant Percentage Circle */}
            <div className="relative flex flex-col items-center justify-center p-8 border-l border-cyber-border/30 md:pl-16">
               <div className={`text-8xl font-display font-black leading-none tracking-tighter drop-shadow-[0_0_15px_rgba(0,255,0,0.4)] ${
                 subject.percentage >= 75 ? 'text-cyber-neon' : subject.percentage >= 60 ? 'text-warning-color' : 'text-danger-color'
               }`}>
                 {subject.percentage}
               </div>
               <div className="font-mono text-xs text-cyber-neon/60 tracking-[0.3em] uppercase mt-2 font-bold">
                 PERCENTAGE
               </div>
               <div className="absolute -top-4 -right-4 w-12 h-12 border-t-2 border-r-2 border-cyber-neon/40" />
               <div className="absolute -bottom-4 -left-4 w-12 h-12 border-b-2 border-l-2 border-cyber-neon/40" />
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Heatmap Card */}
          <div className="bg-[#0f172a]/60 border border-cyber-border/40 rounded-3xl p-8 backdrop-blur-sm shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-mono text-xs font-black text-cyber-neon uppercase tracking-[0.2em]">ATTENDANCE MATRIX</h3>
              <div className="flex items-center gap-4 font-mono text-[10px]">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="hover:text-cyber-neon"><ChevronLeft size={16} /></button>
                <span className="text-cyber-neon font-bold uppercase">{format(currentMonth, 'MMM yyyy')}</span>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="hover:text-cyber-neon"><ChevronRight size={16} /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-3 mb-8">
              {['M','TU','W','TH','F','SA','SU'].map(d => (
                <div key={d} className="text-center text-[10px] font-mono text-cyber-text-secondary font-bold py-2">{d}</div>
              ))}
              {monthDays.map((day, i) => {
                const status = getAttendanceForDay(day);
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-sm transition-all duration-500 ${
                      status === 'none' ? 'bg-cyber-surface/30 border border-cyber-border/20' :
                      status === 'present' ? 'bg-cyber-neon shadow-[0_0_8px_rgba(0,255,0,0.5)]' :
                      'bg-[#ff00ff] shadow-[0_0_8px_rgba(255,0,255,0.5)]'
                    }`}
                    title={format(day, 'MMM dd')}
                  />
                );
              })}
            </div>

            <div className="flex flex-wrap gap-4 text-[10px] font-mono font-bold uppercase tracking-widest pt-4 border-t border-cyber-border/20">
              <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-cyber-neon" /> Present</span>
              <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#ff00ff]" /> Absent</span>
              <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-cyber-surface/30 border border-cyber-border/20" /> No Class</span>
            </div>
            
            <div className="mt-8 pt-6 flex justify-between border-t border-cyber-border/20 text-xs font-mono font-bold uppercase">
              <div className="text-cyber-neon">PRESENT: {subject.present}</div>
              <div className="text-[#ff00ff]">ABSENT: {subject.absent}</div>
            </div>
          </div>

          {/* Latest/Upcoming Activity */}
          <div className="bg-[#0f172a]/60 border border-cyber-border/40 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group shadow-xl">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyber-neon/5 rounded-full blur-3xl group-hover:bg-cyber-neon/10 transition-all duration-1000" />
            
            <h3 className="font-mono text-xs font-black text-[#ff00ff] uppercase tracking-[0.2em] mb-12">SESSION INTEL</h3>
            
            {lastSession ? (
              <div className="space-y-8">
                <div className="flex items-baseline gap-4">
                  <span className="text-7xl font-display font-black text-cyber-text uppercase leading-none">{format(new Date(lastSession.date), 'MMM')}</span>
                  <span className="text-7xl font-display font-black text-accent leading-none tracking-tighter">{format(new Date(lastSession.date), 'dd')}</span>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-2xl font-bold text-cyber-neon uppercase font-mono tracking-tight">{lastSession.topic || 'Consolidated Session'}</h4>
                  <div className="flex items-center gap-4 text-cyber-text-secondary font-mono text-xs uppercase tracking-widest">
                     <span className="flex items-center gap-1.5"><Clock size={14} /> 10:00 AM</span>
                     <span className="flex items-center gap-1.5"><MapPin size={14} /> Main Campus</span>
                     <div className="ml-auto">
                       <StatusPill status={lastSession.present ? 'present' : 'absent'} />
                     </div>
                  </div>
                </div>

                <div className="mt-auto p-4 rounded-xl bg-cyber-surface border border-cyber-border/40 flex gap-4">
                  <AlertCircle size={20} className="text-accent shrink-0" />
                  <p className="text-xs text-cyber-text-secondary italic leading-relaxed">
                    {lastSession.present 
                      ? "You were marked PRESENT for this session. Your attendance trend remains stable."
                      : "You were marked ABSENT. This impacted your cumulative percentage."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-cyber-text-secondary/40 font-mono italic">
                <Calendar size={48} className="mb-4 opacity-20" />
                No attendance records for this subject yet.
              </div>
            )}
          </div>

          {/* Analytics Overview */}
          <div className="lg:col-span-2 bg-[#0f172a]/60 border border-cyber-border/40 rounded-3xl p-8 backdrop-blur-sm shadow-xl">
             <div className="flex items-center justify-between mb-8">
              <h3 className="font-mono text-xs font-black text-cyber-neon uppercase tracking-[0.2em]">ATTENDANCE TREND</h3>
              <div className="flex items-center gap-6">
                <div className="text-center">
                   <p className="text-[10px] font-mono text-cyber-text-secondary uppercase">Status</p>
                   <p className={`text-lg font-mono font-black ${subject.percentage >= 75 ? 'text-cyber-neon' : 'text-danger-color'}`}>
                     {subject.percentage >= 75 ? 'ACTIVE' : 'WARNING'}
                   </p>
                </div>
              </div>
            </div>

            <div className="h-[300px] w-full">
              {analytics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics}>
                    <defs>
                      <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00ff00" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00ff00" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.2} />
                    <XAxis dataKey="date" stroke="#475569" fontSize={10} tickFormatter={(d) => format(new Date(d), 'MMM dd')} />
                    <YAxis stroke="#475569" fontSize={10} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #00ff0033', borderRadius: '8px', color: '#fff' }}
                      labelFormatter={(label) => format(new Date(label), 'MMMM dd, yyyy')}
                    />
                    <Area type="monotone" dataKey="rolling_avg" name="Attendance %" stroke="#00ff00" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-cyber-text-secondary font-mono text-xs opacity-30 italic">
                  NO TREND DATA AVAILABLE YET.
                </div>
              )}
            </div>
          </div>

          {/* Detailed Timeline */}
          <div className="lg:col-span-2 bg-[#0f172a]/60 border border-cyber-border/40 rounded-3xl p-8 backdrop-blur-sm shadow-xl">
             <h3 className="font-mono text-xs font-black text-cyber-neon uppercase tracking-[0.2em] mb-8">MISSION LOG (ATTENDANCE HISTORY)</h3>
             
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-cyber-border/30 text-cyber-text-secondary text-[10px] font-mono uppercase tracking-[0.2em] font-black">
                      <th className="px-6 py-4">TIMESTAMP</th>
                      <th className="px-6 py-4">OBJECTIVE</th>
                      <th className="px-6 py-4">STATUS</th>
                      <th className="px-6 py-4 text-right">MARKER</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-mono">
                    {history.length > 0 ? (
                      history.map((session, i) => (
                        <tr key={i} className="border-b border-cyber-border/10 hover:bg-cyber-neon/5 transition-all">
                          <td className="px-6 py-6 text-cyber-text font-black uppercase">
                            {format(new Date(session.date), 'dd.MM.yyyy')}
                          </td>
                          <td className="px-6 py-6 text-cyber-text-secondary uppercase text-xs">
                            {session.topic || 'GENERAL_LAB'}
                          </td>
                          <td className="px-6 py-6">
                            <StatusPill status={session.present ? 'present' : 'absent'} />
                          </td>
                          <td className="px-6 py-6 text-right text-[10px] text-cyber-neon/60">
                             {session.marked_at ? format(new Date(session.marked_at), 'hh:mm a') : 'SYSTEM'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-cyber-text-secondary/50 font-mono italic">
                          No missions logged yet for this subject.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChevronLeft = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

const ChevronRight = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

export default StudentSubjectDetails;
