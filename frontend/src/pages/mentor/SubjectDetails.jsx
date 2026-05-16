import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Users, Calendar, BarChart2, ArrowLeft, Plus, Trash2, 
  Search, Download, Edit3, CheckCircle, XCircle, Info,
  TrendingUp, Clock, FileSpreadsheet, UserCheck, Zap,
  Activity, CalendarDays
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths } from 'date-fns';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';

import { 
  getSubjectDetails, 
  getSubjectStudents, 
  getSubjectSessions, 
  getSubjectAnalytics,
  deleteSession
} from '../../lib/api';
import CyberCard from '../../components/ui/CyberCard';
import ProgressBar from '../../components/ui/ProgressBar';
import Button from '../../components/ui/Button';
import LoadingScreen from '../../components/ui/LoadingScreen';
import { CyberBackground } from '../../components/ui/CyberBackground';

const SubjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Data state
  const [subject, setSubject] = useState(null);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [analytics, setAnalytics] = useState([]);

  useEffect(() => {
    loadAllData();
  }, [id]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [detailsRes, studentsRes, sessionsRes, analyticsRes] = await Promise.all([
        getSubjectDetails(id),
        getSubjectStudents(id),
        getSubjectSessions(id),
        getSubjectAnalytics(id)
      ]);

      setSubject(detailsRes.subject);
      setStudents(studentsRes.students || []);
      setSessions(sessionsRes.sessions || []);
      setAnalytics(analyticsRes.chartData || []);
    } catch (err) {
      console.error(err);
      toast.error('Unauthorized or Subject not found');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.usn.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    try {
      await deleteSession(sessionId);
      toast.success('Session deleted');
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      const detailsRes = await getSubjectDetails(id);
      setSubject(detailsRes.subject);
    } catch (err) {
      toast.error('Failed to delete session');
    }
  };

  // Heatmap Logic
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getAttendanceForDay = (day) => {
    const session = sessions.find(s => isSameDay(new Date(s.date), day));
    if (!session) return 'none';
    const pct = session.total > 0 ? (session.present / session.total) * 100 : 0;
    if (pct >= 80) return 'high';
    if (pct >= 60) return 'medium';
    return 'low';
  };

  if (loading) return <LoadingScreen message="Accessing subject core..." />;
  if (!subject) return null;

  const lastSession = sessions[0] || null;

  return (
    <div className="relative min-h-screen pb-20">
      <CyberBackground interactive={false} particleCount={150} />
      
      <div className="relative z-10 space-y-8 animate-in fade-in duration-1000 max-w-7xl mx-auto">
        
        {/* Aesthetic Banner Header */}
        <section className="bg-[#0f172a]/60 border border-cyber-border/40 rounded-3xl p-8 backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 space-y-4">
              <Link to="/dashboard" className="flex items-center gap-2 text-cyber-neon/60 hover:text-cyber-neon transition-colors font-mono text-xs uppercase tracking-widest mb-4">
                <ArrowLeft size={14} /> Back to Hub
              </Link>
              
              <div className="space-y-1">
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-cyber-text flex flex-wrap items-baseline gap-3 uppercase font-display">
                  {subject.name.split(' ')[0]} <span className="text-cyber-neon">{subject.name.split(' ').slice(1).join(' ')}</span>
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-cyber-text-secondary font-mono text-xs uppercase tracking-widest pt-2">
                  <span className="flex items-center gap-1.5"><Activity size={14} className="text-cyber-neon" /> {subject.code}</span>
                  <span className="flex items-center gap-1.5"><Users size={14} className="text-[#ff00ff]" /> {subject.stats.totalStudents} Students</span>
                  <span className="flex items-center gap-1.5"><CalendarDays size={14} className="text-accent" /> {subject.stats.totalSessions} Sessions</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <Link to={`/mentor/mark-attendance?subjectId=${id}`}>
                  <button className="px-6 py-2.5 bg-cyber-neon text-cyber-bg font-black font-mono text-xs rounded uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,255,0,0.3)]">
                    + MARK ATTENDANCE
                  </button>
                </Link>
                <Link to="/mentor/bulk-import">
                   <button className="px-6 py-2.5 border border-cyber-neon/40 text-cyber-neon font-black font-mono text-xs rounded uppercase tracking-widest hover:bg-cyber-neon/10 transition-all">
                    BULK IMPORT
                  </button>
                </Link>
              </div>
            </div>

            {/* Giant Percentage Circle */}
            <div className="relative flex flex-col items-center justify-center p-8 border-l border-cyber-border/30 md:pl-16">
               <div className="text-8xl font-display font-black text-cyber-neon leading-none tracking-tighter">
                 {subject.stats.avgAttendance}
               </div>
               <div className="font-mono text-xs text-cyber-neon/60 tracking-[0.3em] uppercase mt-2 font-bold">
                 PERCENTAGE
               </div>
               <div className="absolute -top-4 -right-4 w-12 h-12 border-t-2 border-r-2 border-cyber-neon/40" />
               <div className="absolute -bottom-4 -left-4 w-12 h-12 border-b-2 border-l-2 border-cyber-neon/40" />
            </div>
          </div>
        </section>

        {/* Tab Switcher - Aesthetic Version */}
        <div className="flex justify-center gap-1 bg-[#0a0a0f] p-1 rounded-xl border border-cyber-border/30 w-fit mx-auto">
          {['overview', 'students', 'sessions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-2.5 rounded-lg text-xs font-mono font-black uppercase tracking-widest transition-all ${
                activeTab === tab 
                ? 'bg-cyber-neon text-cyber-bg shadow-[0_0_15px_rgba(0,255,0,0.2)]' 
                : 'text-cyber-text-secondary hover:text-cyber-neon hover:bg-cyber-neon/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="min-h-[600px]">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Heatmap Card */}
              <div className="bg-[#0f172a]/60 border border-cyber-border/40 rounded-3xl p-8 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-mono text-xs font-black text-cyber-neon uppercase tracking-[0.2em]">ATTENDANCE HEATMAP</h3>
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
                    const type = getAttendanceForDay(day);
                    return (
                      <div
                        key={i}
                        className={`aspect-square rounded-sm transition-all duration-500 ${
                          type === 'none' ? 'bg-cyber-surface/30 border border-cyber-border/20' :
                          type === 'high' ? 'bg-cyber-neon shadow-[0_0_8px_rgba(0,255,0,0.5)]' :
                          type === 'medium' ? 'bg-[#ff00ff] shadow-[0_0_8px_rgba(255,0,255,0.5)]' :
                          'bg-danger-color shadow-[0_0_8px_rgba(255,0,0,0.5)]'
                        }`}
                        title={format(day, 'MMM dd')}
                      />
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-4 text-[10px] font-mono font-bold uppercase tracking-widest pt-4 border-t border-cyber-border/20">
                  <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-cyber-neon" /> Good (80%+)</span>
                  <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#ff00ff]" /> Avg (60%+)</span>
                  <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-cyber-surface/30 border border-cyber-border/20" /> No Class</span>
                </div>
              </div>

              {/* Latest Session Card */}
              <div className="bg-[#0f172a]/60 border border-cyber-border/40 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyber-neon/5 rounded-full blur-3xl group-hover:bg-cyber-neon/10 transition-all duration-1000" />
                
                <h3 className="font-mono text-xs font-black text-[#ff00ff] uppercase tracking-[0.2em] mb-12">LATEST ACTIVITY</h3>
                
                {lastSession ? (
                  <div className="space-y-8">
                    <div className="flex items-baseline gap-4">
                      <span className="text-7xl font-display font-black text-cyber-text uppercase leading-none">{format(new Date(lastSession.date), 'MMM')}</span>
                      <span className="text-7xl font-display font-black text-accent leading-none tracking-tighter">{format(new Date(lastSession.date), 'dd')}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-2xl font-bold text-cyber-neon uppercase font-mono tracking-tight">{lastSession.topic || 'Untitled Session'}</h4>
                      <div className="flex items-center gap-4 text-cyber-text-secondary font-mono text-xs uppercase tracking-widest">
                         <span className="flex items-center gap-1.5"><Clock size={14} /> {format(new Date(lastSession.date), 'hh:mm a')}</span>
                         <span className="flex items-center gap-1.5 text-cyber-neon"><CheckCircle size={14} /> {Math.round((lastSession.present/lastSession.total)*100)}% ATTENDANCE</span>
                      </div>
                    </div>

                    <div className="pt-8">
                      <Link to={`/mentor/mark-attendance?date=${lastSession.date}&subjectId=${id}`}>
                        <button className="flex items-center gap-2 px-5 py-2 border border-cyber-border hover:border-cyber-neon text-cyber-text-secondary hover:text-cyber-neon font-mono text-[10px] font-black uppercase tracking-widest rounded-lg transition-all">
                          <Edit3 size={14} /> EDIT SESSION RECORDS
                        </button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-cyber-text-secondary/40 font-mono italic">
                    <Calendar size={48} className="mb-4 opacity-20" />
                    No sessions recorded yet
                  </div>
                )}
              </div>

              {/* Progress and Analytics */}
              <div className="md:col-span-2 bg-[#0f172a]/60 border border-cyber-border/40 rounded-3xl p-8 backdrop-blur-sm">
                 <div className="flex items-center justify-between mb-8">
                  <h3 className="font-mono text-xs font-black text-cyber-neon uppercase tracking-[0.2em]">ANALYTICS OVERVIEW</h3>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                       <p className="text-[10px] font-mono text-cyber-text-secondary uppercase">Students</p>
                       <p className="text-lg font-mono font-black text-cyber-text">{subject.stats.totalStudents}</p>
                    </div>
                    <div className="text-center">
                       <p className="text-[10px] font-mono text-cyber-text-secondary uppercase">Sessions</p>
                       <p className="text-lg font-mono font-black text-cyber-text">{subject.stats.totalSessions}</p>
                    </div>
                  </div>
                </div>

                <div className="h-[300px] w-full">
                  {analytics.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics}>
                        <defs>
                          <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00ff00" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#00ff00" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.2} />
                        <XAxis dataKey="date" stroke="#475569" fontSize={10} fontStyle="italic" />
                        <YAxis stroke="#475569" fontSize={10} domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #00ff0033', borderRadius: '8px', color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="attendance" stroke="#00ff00" strokeWidth={3} fillOpacity={1} fill="url(#colorAtt)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-cyber-text-secondary font-mono text-xs opacity-30 italic">
                      WAITING FOR DATA INPUT...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="animate-in slide-in-from-bottom-8 duration-700">
               <div className="bg-[#0f172a]/60 border border-cyber-border/40 rounded-3xl p-8 backdrop-blur-sm">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                    <div className="relative w-full md:w-[500px]">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cyber-neon/50" size={20} />
                      <input
                        type="text"
                        placeholder="SEARCH CORE DATABASE..."
                        className="w-full bg-[#0a0a0f] border border-cyber-border/50 rounded-xl py-3.5 pl-12 pr-4 text-cyber-text focus:outline-none focus:border-cyber-neon font-mono text-sm tracking-widest"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Link to="/mentor/manage-students">
                      <button className="flex items-center gap-2 px-6 py-3 border border-[#ff00ff]/40 text-[#ff00ff] hover:bg-[#ff00ff]/10 font-mono text-xs font-black uppercase tracking-widest rounded-xl transition-all">
                        <Users size={18} /> MANAGE ENROLLMENT
                      </button>
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-cyber-border/30 text-cyber-text-secondary text-[10px] font-mono uppercase tracking-[0.2em] font-black">
                          <th className="px-6 py-4">OPERATIVE</th>
                          <th className="px-6 py-4">IDENTIFIER</th>
                          <th className="px-6 py-4">RATIO</th>
                          <th className="px-6 py-4 text-right">METRICS</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {filteredStudents.map((student) => (
                          <tr key={student.id} className="border-b border-cyber-border/10 hover:bg-cyber-neon/5 transition-all group">
                            <td className="px-6 py-6">
                              <div className="font-mono font-black text-cyber-text group-hover:text-cyber-neon transition-colors uppercase">{student.fullName}</div>
                              <div className="text-[10px] font-mono text-cyber-text-secondary mt-0.5">{student.department}</div>
                            </td>
                            <td className="px-6 py-6 font-mono text-cyber-neon/80 tracking-widest">{student.usn}</td>
                            <td className="px-6 py-6">
                              <div className="flex items-center gap-4">
                                <div className="flex-1 h-1.5 w-32 bg-cyber-surface rounded-full overflow-hidden border border-cyber-border/20">
                                  <div 
                                    className={`h-full transition-all duration-1000 ${student.attendancePercentage < 75 ? 'bg-danger-color shadow-[0_0_10px_rgba(255,0,0,0.5)]' : 'bg-cyber-neon shadow-[0_0_10px_rgba(0,255,0,0.5)]'}`}
                                    style={{ width: `${student.attendancePercentage}%` }}
                                  />
                                </div>
                                <span className={`font-mono font-black text-xs ${student.attendancePercentage < 75 ? 'text-danger-color' : 'text-cyber-neon'}`}>
                                  {student.attendancePercentage}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-6 text-right">
                              <Link to={`/mentor/students/${student.id}/history`}>
                                <button className="p-2.5 bg-cyber-surface/50 border border-cyber-border/50 rounded-lg text-cyber-text-secondary hover:text-cyber-neon hover:border-cyber-neon transition-all">
                                  <BarChart2 size={16} />
                                </button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="animate-in slide-in-from-bottom-8 duration-700">
               <div className="bg-[#0f172a]/60 border border-cyber-border/40 rounded-3xl p-8 backdrop-blur-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-cyber-border/30 text-cyber-text-secondary text-[10px] font-mono uppercase tracking-[0.2em] font-black">
                          <th className="px-6 py-4">TIMELINE</th>
                          <th className="px-6 py-4">OBJECTIVE</th>
                          <th className="px-6 py-4">QUORUM</th>
                          <th className="px-6 py-4 text-right">OPERATIONS</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm font-mono">
                        {sessions.map((session) => (
                          <tr key={session.id} className="border-b border-cyber-border/10 hover:bg-cyber-neon/5 transition-all">
                            <td className="px-6 py-6 text-cyber-text font-black">
                              {format(new Date(session.date), 'dd.MM.yyyy')}
                            </td>
                            <td className="px-6 py-6 text-cyber-text-secondary uppercase text-xs">
                              {session.topic || 'UNNAMED_MISSION'}
                            </td>
                            <td className="px-6 py-6">
                              <span className="text-cyber-neon font-black">{session.present}</span>
                              <span className="text-cyber-text-secondary/40"> / {session.total}</span>
                            </td>
                            <td className="px-6 py-6 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <Link to={`/mentor/mark-attendance?date=${session.date}&subjectId=${id}`}>
                                  <button className="p-2.5 bg-cyber-surface/50 border border-cyber-border/50 rounded-lg text-cyber-neon/60 hover:text-cyber-neon hover:border-cyber-neon transition-all">
                                    <Zap size={16} />
                                  </button>
                                </Link>
                                <button 
                                  onClick={() => handleDeleteSession(session.id)}
                                  className="p-2.5 bg-cyber-surface/50 border border-cyber-border/50 rounded-lg text-danger-color/60 hover:text-danger-color hover:border-danger-color transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>
          )}
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

export default SubjectDetails;
