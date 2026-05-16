import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  subMonths, 
  startOfWeek, 
  endOfWeek,
  parseISO
} from 'date-fns';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  History, 
  Clock, 
  User, 
  ChevronLeft, 
  Target, 
  ShieldCheck, 
  ArrowLeft,
  CalendarDays,
  Zap,
  Info,
  CheckCircle2,
  XCircle,
  Hash
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  getStudentSubjectDetails, 
  getStudentSubjectAttendance, 
  getStudentSubjectAnalytics, 
  getStudentSubjectHeatmap,
  getStudentSubjectUpcoming
} from '../../lib/api';
import { CyberBackground } from '../../components/ui/CyberBackground';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function StudentSubjectDetails() {
  const { subjectCode } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    details: null,
    history: [],
    trend: [],
    heatmap: [],
    upcoming: null
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [details, history, analytics, heatmap, upcoming] = await Promise.all([
        getStudentSubjectDetails(subjectCode),
        getStudentSubjectAttendance(subjectCode),
        getStudentSubjectAnalytics(subjectCode),
        getStudentSubjectHeatmap(subjectCode),
        getStudentSubjectUpcoming(subjectCode)
      ]);

      setData({
        details: details.subject,
        history: history.history,
        trend: analytics.trend,
        heatmap: heatmap.heatmap,
        upcoming: upcoming.upcoming
      });
    } catch (err) {
      console.error('Data sync failure:', err);
      toast.error('Tactical link failure. Retrying sync...');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [subjectCode]);

  // Heatmap Color Logic
  const getHeatmapColor = (status) => {
    if (status === 'present') return 'bg-[#00ff00] shadow-[0_0_8px_#00ff00]';
    if (status === 'absent') return 'bg-[#ff00ff] shadow-[0_0_8px_#ff00ff]';
    return 'bg-white/5';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 border-4 border-cyber-neon border-t-transparent rounded-full animate-spin shadow-[0_0_20px_#00ff00]" />
        <p className="font-mono text-cyber-neon text-sm animate-pulse tracking-[0.5em] uppercase font-black">Syncing Subject Grid...</p>
      </div>
    );
  }

  if (!data.details) {
    return (
      <div className="min-h-screen bg-void flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck size={64} className="text-[#ff00ff] mb-4 opacity-50" />
        <h2 className="text-2xl font-black text-white uppercase font-mono mb-2 tracking-tighter">Access Denied</h2>
        <p className="text-cyber-text-secondary font-mono mb-6 max-w-md">Subject identity <span className="text-[#ff00ff]">{subjectCode}</span> not detected in current security clearance.</p>
        <Button variant="primary" onClick={() => navigate('/student/dashboard')}>Return to Command</Button>
      </div>
    );
  }

  const { details, history, trend, heatmap, upcoming } = data;

  return (
    <div className="min-h-screen bg-void text-fg-primary font-sans selection:bg-cyber-neon/30 pb-20">
      <CyberBackground interactive={false} particleCount={200} />
      
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 pt-10">
        
        {/* TOP BAR */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
             <button 
               onClick={() => navigate('/student/dashboard')}
               className="group flex items-center gap-2 text-cyber-neon/60 hover:text-cyber-neon transition-all font-mono text-[10px] font-black uppercase tracking-widest"
             >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> BACK_TO_CONTROL
             </button>
             <div className="space-y-2">
                <div className="flex items-center gap-3">
                   <div className="px-3 py-1 bg-cyber-neon/10 border border-cyber-neon/30 text-cyber-neon text-[10px] font-black font-mono rounded-md uppercase tracking-widest">
                     {details.code}
                   </div>
                   <span className="text-cyber-text-secondary font-mono text-[10px] uppercase tracking-[0.3em]">Course Identified</span>
                </div>
                <h1 className="text-5xl lg:text-7xl font-black text-white uppercase font-display tracking-tighter leading-none">
                  {details.name}
                </h1>
             </div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-2">
             <div className="flex items-center gap-3 px-6 py-4 bg-[#0f172a]/60 border border-cyber-border/40 rounded-2xl backdrop-blur-md">
                <div className="w-10 h-10 rounded-xl bg-cyber-neon/10 flex items-center justify-center text-cyber-neon">
                   <User size={20} />
                </div>
                <div>
                   <p className="text-[10px] font-mono text-cyber-text-secondary uppercase tracking-widest">Subject Faculty</p>
                   <p className="font-bold text-white uppercase font-mono">{details.faculty_name || 'SYSTEM_OPERATOR'}</p>
                </div>
             </div>
          </div>
        </header>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: HERO STATS & HEATMAP */}
          <div className="lg:col-span-8 space-y-8">
             
             {/* HERO STATS PANEL */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 relative p-10 bg-cyber-neon/5 border border-cyber-neon/30 rounded-[2rem] overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                      <Target size={180} className="text-cyber-neon" />
                   </div>
                   <div className="relative z-10 space-y-2">
                      <p className="font-mono text-cyber-neon text-xs font-black uppercase tracking-[0.4em] mb-4">Tactical Attendance Level</p>
                      <div className="flex items-end gap-4">
                         <span className={clsx(
                           "text-9xl font-display font-black leading-none tracking-tighter",
                           details.percentage >= 75 ? "text-cyber-neon drop-shadow-[0_0_30px_rgba(0,255,0,0.4)]" : "text-[#ff00ff] drop-shadow-[0_0_30px_rgba(255,0,255,0.4)]"
                         )}>
                           {details.percentage}%
                         </span>
                         <div className="mb-4">
                            <StatusBadge 
                              status={details.percentage >= 75 ? 'active' : 'at-risk'} 
                              text={details.percentage >= 75 ? 'CLEARANCE_OK' : 'WARNING_LEVEL'} 
                            />
                         </div>
                      </div>
                      <div className="pt-8 grid grid-cols-2 gap-8">
                         <div>
                            <p className="text-[10px] font-mono text-cyber-text-secondary uppercase tracking-widest mb-1">Missions Logged</p>
                            <p className="text-2xl font-display font-black text-white">{details.present} / {details.total}</p>
                         </div>
                         <div>
                            <p className="text-[10px] font-mono text-cyber-text-secondary uppercase tracking-widest mb-1">Status Delta</p>
                            <p className="text-2xl font-display font-black text-[#ff00ff]">-{details.absent} FAILED</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-[#0f172a]/40 border border-cyber-border/30 rounded-[2rem] p-8 backdrop-blur-md flex flex-col justify-between">
                   <div className="space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                         <CalendarDays size={24} />
                      </div>
                      <h3 className="text-xs font-mono font-black text-white uppercase tracking-[0.2em]">Next Objective</h3>
                   </div>
                   
                   {upcoming ? (
                     <div className="space-y-4">
                        <div>
                           <p className="text-[10px] font-mono text-cyber-text-secondary uppercase mb-1">Schedule</p>
                           <p className="text-xl font-display font-black text-white">{format(parseISO(upcoming.date), 'EEEE, MMM dd')}</p>
                        </div>
                        <div className="flex gap-4">
                           <div>
                              <p className="text-[10px] font-mono text-cyber-text-secondary uppercase mb-1">Time</p>
                              <p className="font-mono text-cyber-neon text-sm font-bold">09:00 AM</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-mono text-cyber-text-secondary uppercase mb-1">Location</p>
                              <p className="font-mono text-cyber-neon text-sm font-bold">L_404</p>
                           </div>
                        </div>
                        <Button variant="primary" className="w-full h-12 uppercase font-black tracking-widest text-[10px]">
                           Pre-Check Mission
                        </Button>
                     </div>
                   ) : (
                     <div className="text-center py-6 border border-dashed border-cyber-border/30 rounded-2xl">
                        <p className="text-[10px] font-mono text-cyber-text-secondary uppercase">No objectives scheduled</p>
                     </div>
                   )}
                </div>
             </div>

             {/* HEATMAP PANEL */}
             <div className="bg-[#0f172a]/40 border border-cyber-border/30 rounded-[2rem] p-10 backdrop-blur-md">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyber-neon/10 flex items-center justify-center text-cyber-neon">
                         <CalendarIcon size={20} />
                      </div>
                      <h3 className="text-sm font-mono font-black text-white uppercase tracking-[0.2em]">Deployment Grid</h3>
                   </div>
                   <div className="flex gap-4 text-[9px] font-mono font-bold uppercase tracking-widest text-cyber-text-secondary">
                      <div className="flex items-center gap-2">
                         <div className="w-3 h-3 bg-[#00ff00] rounded-sm" /> Present
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-3 h-3 bg-[#ff00ff] rounded-sm" /> Absent
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-3 h-3 bg-white/5 rounded-sm border border-white/10" /> No_Class
                      </div>
                   </div>
                </div>

                <div className="flex flex-wrap gap-2">
                   {heatmap.length > 0 ? (
                     heatmap.map((day, i) => (
                       <div 
                         key={i}
                         className={clsx(
                           "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110",
                           getHeatmapColor(day.status)
                         )}
                         title={`${format(parseISO(day.date), 'MMM dd')}: ${day.status.toUpperCase()}`}
                       >
                         <span className="text-[8px] font-mono font-black opacity-30">
                           {format(parseISO(day.date), 'dd')}
                         </span>
                       </div>
                     ))
                   ) : (
                     <div className="w-full py-12 text-center text-cyber-text-secondary/20 font-mono italic uppercase tracking-widest">
                        Grid data unavailable... session initialization required
                     </div>
                   )}
                </div>
             </div>

             {/* TREND ANALYTICS */}
             <div className="bg-[#0f172a]/40 border border-cyber-border/30 rounded-[2rem] p-10 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-10">
                   <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                      <TrendingUp size={20} />
                   </div>
                   <h3 className="text-sm font-mono font-black text-white uppercase tracking-[0.2em]">Performance Drift</h3>
                </div>

                <div className="h-64 w-full">
                   {trend.length > 0 ? (
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trend}>
                          <defs>
                            <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00ff00" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#00ff00" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}
                            tickFormatter={(val) => format(parseISO(val), 'dd.MM')}
                          />
                          <YAxis 
                            domain={[0, 100]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}
                            tickFormatter={(val) => `${val}%`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#0a0a0f', 
                              border: '1px solid rgba(0,255,0,0.3)',
                              borderRadius: '12px',
                              fontFamily: 'monospace'
                            }}
                            itemStyle={{ color: '#00ff00' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="rolling_avg" 
                            stroke="#00ff00" 
                            fillOpacity={1} 
                            fill="url(#colorTrend)" 
                            strokeWidth={3}
                          />
                        </AreaChart>
                     </ResponsiveContainer>
                   ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center text-cyber-text-secondary/20">
                        <Info size={48} className="mb-4 opacity-10" />
                        <p className="font-mono text-[10px] uppercase tracking-widest">Insufficient data for trend projection</p>
                     </div>
                   )}
                </div>
             </div>
          </div>

          {/* RIGHT COLUMN: HISTORY TIMELINE */}
          <div className="lg:col-span-4 space-y-8">
             <div className="bg-[#0f172a]/60 border border-cyber-border/40 rounded-[2rem] p-10 backdrop-blur-xl h-full flex flex-col">
                <div className="flex items-center gap-3 mb-10">
                   <div className="w-10 h-10 rounded-xl bg-cyber-neon/10 flex items-center justify-center text-cyber-neon">
                      <History size={20} />
                   </div>
                   <h3 className="text-sm font-mono font-black text-white uppercase tracking-[0.2em]">Mission Logs</h3>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar max-h-[800px]">
                   {history.length > 0 ? (
                     history.map((session, i) => (
                       <div key={i} className="group relative pl-8 border-l-2 border-cyber-border/20 py-1 transition-all hover:border-cyber-neon">
                          <div className={clsx(
                            "absolute left-[-9px] top-1.5 w-4 h-4 rounded-full border-2 border-[#0a0a0f] z-10",
                            session.present ? "bg-cyber-neon shadow-[0_0_8px_#00ff00]" : "bg-[#ff00ff] shadow-[0_0_8px_#ff00ff]"
                          )} />
                          
                          <div className="space-y-1">
                             <div className="flex items-center justify-between">
                                <span className="font-mono text-[10px] text-cyber-text-secondary uppercase font-black">
                                  {format(parseISO(session.date), 'dd MMMM yyyy')}
                                </span>
                                <div className={clsx(
                                  "text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-widest",
                                  session.present ? "border-cyber-neon/30 text-cyber-neon" : "border-[#ff00ff]/30 text-[#ff00ff]"
                                )}>
                                   {session.present ? 'COMPLETED' : 'FAILED'}
                                </div>
                             </div>
                             <p className="text-white font-bold text-sm uppercase font-display group-hover:text-cyber-neon transition-colors">
                               {session.topic || 'Class Mission'}
                             </p>
                             <div className="flex items-center gap-3 text-[10px] font-mono text-cyber-text-secondary/60">
                                <span className="flex items-center gap-1"><Clock size={10} /> 09:00 - 10:00</span>
                                <span className="flex items-center gap-1"><User size={10} /> {details.faculty_name || 'Dr. Sadhana Rai'}</span>
                             </div>
                          </div>
                       </div>
                     ))
                   ) : (
                     <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-20">
                        <Hash size={48} />
                        <p className="font-mono text-[10px] uppercase tracking-widest">No logs detected in core memory</p>
                     </div>
                   )}
                </div>
                
                <div className="mt-10 pt-10 border-t border-cyber-border/20">
                   <div className="p-6 bg-cyber-neon/5 rounded-2xl border border-cyber-neon/20 space-y-4">
                      <div className="flex items-center gap-2 text-cyber-neon font-black text-[10px] uppercase tracking-widest">
                         <Zap size={14} /> Neural Summary
                      </div>
                      <p className="text-[11px] font-mono text-cyber-text-secondary leading-relaxed uppercase">
                        Current data stream indicates <span className="text-white">{details.percentage}%</span> operational efficiency. {details.percentage < 75 ? 'Immediate remedial action suggested.' : 'Clearance sustained.'}
                      </p>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
