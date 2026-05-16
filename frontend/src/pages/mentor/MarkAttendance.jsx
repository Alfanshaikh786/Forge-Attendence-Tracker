import { useState, useEffect, useRef } from 'react';
import { 
  format, 
  startOfDay,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
  isBefore,
  isAfter,
} from 'date-fns';
import { 
  ArrowDownAZ, ChevronLeft, ChevronRight, Hash, Lock, Search, Zap, 
  CheckCircle2, XCircle, History, Trash2, Save, RotateCcw, 
  MessageSquare, ShieldCheck, Activity, Info
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { CyberCard } from '../../components/ui/CyberCard';
import { CyberBackground } from '../../components/ui/CyberBackground';
import { StatusBadge } from '../../components/ui/StatusBadge';
import Avatar from '../../components/ui/Avatar';
import { 
  getSessionByDate, 
  getSessionAttendance, 
  saveAttendance, 
  getSubjects,
  updateAttendanceBulk,
  deleteAttendanceSession,
  getSessionAuditLogs
} from '../../lib/api';
import gsap from 'gsap';
import toast from 'react-hot-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function MarkAttendance() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlSubjectId = searchParams.get('subjectId');
  const urlDate = searchParams.get('date');

  const [selectedDate, setSelectedDate] = useState(
    urlDate ? startOfDay(new Date(urlDate)) : startOfDay(new Date())
  );
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(urlDate ? startOfDay(new Date(urlDate)) : startOfDay(new Date()))
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(urlSubjectId || '');
  const [topic, setTopic] = useState('');
  const [remarks, setRemarks] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('usn'); 
  const [hasChanges, setHasChanges] = useState(false);
  const [viewMode, setViewMode] = useState('marking'); // 'marking' | 'audit'
  const [auditLogs, setAuditLogs] = useState([]);

  const today = startOfDay(new Date());
  const dateState = isAfter(selectedDate, today) ? 'future' : isBefore(selectedDate, today) ? 'past' : 'today';
  const isLocked = dateState === 'future';

  const normalizeStudent = (student) => {
    const studentId = student.studentId || student._id || student.id;
    const fullName = student.fullName || student.name || student.displayName || 'Unknown Student';

    return {
      ...student,
      studentId,
      fullName,
      usn: student.usn || student.studentUsn || '',
      department: student.department || student.branchCode || '',
      isPresent: Boolean(student.isPresent),
    };
  };

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const loadSession = async () => {
    if (!selectedSubjectId) return;

    try {
      setLoading(true);
      const { session: sessionData } = await getSessionByDate(dateStr, selectedSubjectId);
      setSession(sessionData);
      
      if (sessionData) {
        setTopic(sessionData.topic || '');
        setRemarks(sessionData.remarks || '');
        const { students: studentList } = await getSessionAttendance(sessionData._id);
        setStudents(
          studentList.map((student) =>
            normalizeStudent({
              ...student,
              isPresent: student.status === 'present',
            })
          )
        );
        
        // Load audit logs in background
        loadAuditLogs(sessionData._id);
      } else {
        setStudents([]);
        setTopic('');
        setRemarks('');
        setAuditLogs([]);
      }
      setHasChanges(false);
    } catch (err) {
      toast.error('Failed to load session data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async (sessionId) => {
    try {
      const { logs } = await getSessionAuditLogs(sessionId);
      setAuditLogs(logs || []);
    } catch (err) {
      console.error('Audit log fetch failure:', err);
    }
  };

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { subjects: subjectsList } = await getSubjects();
        setSubjects(subjectsList || []);
        if (subjectsList?.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(subjectsList[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch subjects', err);
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    loadSession();
    if (isBefore(selectedDate, currentWeekStart) || isAfter(selectedDate, endOfWeek(currentWeekStart))) {
      setCurrentWeekStart(startOfWeek(selectedDate));
    }
  }, [dateStr, selectedSubjectId]);

  const handleSave = async () => {
    if (!session || isLocked) return;
    
    try {
      setSaving(true);
      const payload = {
        topic,
        remarks,
        attendance: students.map(s => ({
          studentId: s.studentId,
          status: s.isPresent ? 'present' : 'absent'
        }))
      };

      // Use the new bulk update with audit logging
      await updateAttendanceBulk(session._id, payload);
      toast.success('Attendance records synchronized and audited');
      setHasChanges(false);
      loadAuditLogs(session._id);
    } catch (err) {
      toast.error(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!session) return;
    if (!window.confirm('🚨 DANGER: This will permanently purge this session and all student attendance records for this day. Proceed?')) return;
    
    try {
      setSaving(true);
      await deleteAttendanceSession(session._id);
      toast.success('Session purged successfully');
      loadSession();
    } catch (err) {
      toast.error('Purge failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleAttendance = (studentId) => {
    if (isLocked) return;
    setStudents(prev => prev.map(s => 
      s.studentId === studentId ? { ...s, isPresent: !s.isPresent } : s
    ));
    setHasChanges(true);
  };

  const markAll = (val) => {
    if (isLocked) return;
    setStudents(prev => prev.map(s => ({ ...s, isPresent: val })));
    setHasChanges(true);
  };

  const filteredStudents = students
    .filter((student) => {
      const query = searchQuery.toLowerCase();
      const fullName = String(student.fullName || '').toLowerCase();
      const usn = String(student.usn || '').toLowerCase();
      return fullName.includes(query) || usn.includes(query);
    })
    .sort((a, b) => {
      if (sortBy === 'usn') {
        return String(a.usn || '').localeCompare(String(b.usn || ''), undefined, { numeric: true, sensitivity: 'base' });
      }
      return String(a.fullName || '').localeCompare(String(b.fullName || ''), undefined, { sensitivity: 'base' });
    });

  const presentCount = students.filter(s => s.isPresent).length;
  const absentCount = students.length - presentCount;
  const attendancePct = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: endOfWeek(currentWeekStart) });

  return (
    <>
      <CyberBackground interactive={false} particleCount={200} />
      
      <div className="space-y-6 pb-24 animate-fade-in max-w-6xl mx-auto relative z-10 px-4">
        {/* Professional Header */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-[#0f172a]/60 p-8 rounded-3xl border border-cyber-border/40 backdrop-blur-md">
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-cyber-neon mb-1">
               <ShieldCheck size={18} />
               <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em]">Attendance Controller</span>
             </div>
             <h2 className="font-display text-5xl font-black text-cyber-text tracking-tighter uppercase leading-none">
              RECORDS <span className="text-cyber-neon">EDITOR</span>
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-cyber-text-secondary font-mono text-xs uppercase tracking-widest pt-1">
              <span className="flex items-center gap-1.5"><Activity size={14} className="text-cyber-neon" /> {dateState.toUpperCase()} MODE</span>
              <span className="flex items-center gap-1.5 text-accent"><Hash size={14} /> SESS_ID: {session?._id || 'UNSET'}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full lg:w-80">
            <label className="text-[10px] font-mono text-cyber-neon uppercase tracking-widest px-1 font-bold">OPERATIONAL SUBJECT</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-cyber-neon/30 rounded-xl px-4 py-3 text-cyber-neon font-mono text-sm focus:border-cyber-neon outline-none transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,0,0.1)] hover:bg-cyber-neon/5"
            >
              {subjects.length === 0 && <option value="">No subjects assigned</option>}
              {subjects.map(sub => (
                <option key={sub.id} value={sub.id} className="bg-[#0a0a0f] text-white">
                  [{sub.code}] {sub.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Date Strip */}
        <CyberCard className="!p-6 border-cyber-border/20">
          <div className="flex items-center justify-between mb-6">
            <span className="font-mono text-xs font-black text-cyber-neon uppercase tracking-[0.2em]">TIMELINE NAVIGATOR</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentWeekStart(prev => subWeeks(prev, 1))}
                className="w-10 h-10 flex items-center justify-center border border-cyber-border rounded-lg hover:border-cyber-neon hover:bg-cyber-neon/10 transition-all"
              >
                <ChevronLeft size={20} className="text-cyber-text-secondary" />
              </button>
              <button 
                onClick={() => {
                  setSelectedDate(today);
                  setCurrentWeekStart(startOfWeek(today));
                }}
                className="px-6 h-10 flex items-center justify-center border border-cyber-border rounded-lg text-[10px] font-mono font-black text-cyber-text-secondary hover:text-cyber-neon hover:border-cyber-neon transition-all uppercase tracking-widest"
              >
                Today
              </button>
              <button 
                onClick={() => setCurrentWeekStart(prev => addWeeks(prev, 1))}
                className="w-10 h-10 flex items-center justify-center border border-cyber-border rounded-lg hover:border-cyber-neon hover:bg-cyber-neon/10 transition-all"
              >
                <ChevronRight size={20} className="text-cyber-text-secondary" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-3">
            {weekDays.map(day => {
              const isSelected = isSameDay(day, selectedDate);
              const isDayToday = isSameDay(day, today);
              const isDayFuture = isAfter(day, today);
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => !isDayFuture && setSelectedDate(day)}
                  disabled={isDayFuture}
                  className={`
                    flex flex-col items-center gap-2 py-4 px-1 rounded-xl border transition-all font-mono group
                    ${isDayFuture ? 'opacity-20 cursor-not-allowed grayscale' : 'cursor-pointer'}
                    ${isSelected ? 'border-cyber-neon bg-cyber-neon/10 shadow-[0_0_20px_rgba(0,255,0,0.15)]' : 'border-cyber-border/10 bg-[#0f172a]/40 hover:border-cyber-neon/30'}
                  `}
                >
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-cyber-neon' : 'text-cyber-text-secondary'}`}>{format(day, 'EEE')}</span>
                  <span className={`text-xl font-display font-black ${isSelected ? 'text-cyber-neon' : 'text-cyber-text'}`}>
                    {format(day, 'd')}
                  </span>
                  {isDayToday && <div className="w-1.5 h-1.5 rounded-full bg-cyber-neon shadow-[0_0_8px_#00ff00]" />}
                </button>
              );
            })}
          </div>
        </CyberCard>

        {session && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Session Management Panels */}
            <div className="lg:col-span-1 space-y-6">
               <CyberCard title="STATUS REPORT" className="h-fit">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-cyber-surface/50 rounded-2xl border border-cyber-border/30 text-center">
                          <p className="text-[10px] font-mono text-cyber-text-secondary uppercase mb-1">PRESENT</p>
                          <p className="text-3xl font-display font-black text-cyber-neon">{presentCount}</p>
                       </div>
                       <div className="p-4 bg-cyber-surface/50 rounded-2xl border border-cyber-border/30 text-center">
                          <p className="text-[10px] font-mono text-cyber-text-secondary uppercase mb-1">ABSENT</p>
                          <p className="text-3xl font-display font-black text-[#ff00ff]">{absentCount}</p>
                       </div>
                    </div>
                    
                    <div className="relative h-24 flex flex-col items-center justify-center p-6 bg-[#0a0a0f] rounded-2xl border border-cyber-neon/20 overflow-hidden">
                       <div className="absolute inset-0 bg-cyber-neon/5 animate-pulse" />
                       <p className="relative z-10 text-[10px] font-mono text-cyber-text-secondary uppercase tracking-[0.2em] mb-1">QUORUM RATIO</p>
                       <p className={`relative z-10 text-4xl font-display font-black ${attendancePct >= 80 ? 'text-cyber-neon' : attendancePct >= 60 ? 'text-warning-color' : 'text-danger-color'}`}>
                         {attendancePct}%
                       </p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-cyber-border/20">
                       <div className="space-y-2">
                          <label className="text-[10px] font-mono text-cyber-text-secondary uppercase tracking-widest px-1">SESSION OBJECTIVE</label>
                          <input 
                            type="text" 
                            value={topic}
                            onChange={(e) => { setTopic(e.target.value); setHasChanges(true); }}
                            placeholder="Enter session topic..."
                            className="w-full bg-[#0a0a0f] border border-cyber-border/50 rounded-xl px-4 py-3 text-sm text-cyber-text font-mono focus:border-cyber-neon outline-none"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-mono text-cyber-text-secondary uppercase tracking-widest px-1">MANAGEMENT REMARKS</label>
                          <textarea 
                            value={remarks}
                            onChange={(e) => { setRemarks(e.target.value); setHasChanges(true); }}
                            placeholder="Audit trail notes (e.g. Corrected for USN 045)..."
                            rows={3}
                            className="w-full bg-[#0a0a0f] border border-cyber-border/50 rounded-xl px-4 py-3 text-xs text-cyber-text-secondary font-mono focus:border-cyber-neon outline-none resize-none"
                          />
                       </div>
                    </div>

                    <div className="space-y-3 pt-4">
                       <Button 
                         variant="primary" 
                         className="w-full h-12 shadow-[0_0_20px_rgba(0,255,0,0.2)]" 
                         onClick={handleSave}
                         disabled={!hasChanges || saving}
                       >
                         {saving ? <RotateCcw size={18} className="animate-spin" /> : <Save size={18} />}
                         {saving ? 'SYNCING...' : 'COMMIT CHANGES'}
                       </Button>
                       
                       <Button 
                         variant="secondary" 
                         className="w-full border-danger-color/30 text-danger-color hover:bg-danger-color/10" 
                         onClick={handleDeleteSession}
                         disabled={saving}
                       >
                         <Trash2 size={18} />
                         PURGE SESSION
                       </Button>
                    </div>
                  </div>
               </CyberCard>

               <div className="bg-[#0f172a]/60 p-6 rounded-2xl border border-cyber-border/40 font-mono text-[10px] space-y-4">
                  <div className="flex items-center gap-2 text-cyber-neon uppercase font-bold tracking-widest">
                    <Info size={14} /> SYSTEM RULES
                  </div>
                  <p className="text-cyber-text-secondary leading-relaxed">
                    1. Changes are recorded in the <span className="text-white">AUDIT TRAIL</span>.<br/>
                    2. Updating records instantly refreshes student dashboards.<br/>
                    3. Purging a session is <span className="text-danger-color font-bold italic">IRREVERSIBLE</span>.
                  </p>
               </div>
            </div>

            {/* Main Editor Interface */}
            <div className="lg:col-span-2 space-y-6">
               <div className="flex gap-1 bg-[#0a0a0f] p-1 rounded-xl border border-cyber-border/30 w-fit">
                  <button
                    onClick={() => setViewMode('marking')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-mono font-black uppercase tracking-widest transition-all ${
                      viewMode === 'marking' 
                      ? 'bg-cyber-neon text-cyber-bg shadow-[0_0_15px_rgba(0,255,0,0.2)]' 
                      : 'text-cyber-text-secondary hover:text-cyber-neon hover:bg-cyber-neon/5'
                    }`}
                  >
                    <CheckCircle2 size={14} /> RECORDS EDITOR
                  </button>
                  <button
                    onClick={() => setViewMode('audit')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-mono font-black uppercase tracking-widest transition-all ${
                      viewMode === 'audit' 
                      ? 'bg-cyber-neon text-cyber-bg shadow-[0_0_15px_rgba(0,255,0,0.2)]' 
                      : 'text-cyber-text-secondary hover:text-cyber-neon hover:bg-cyber-neon/5'
                    }`}
                  >
                    <History size={14} /> AUDIT TRAILS [{auditLogs.length}]
                  </button>
               </div>

               {viewMode === 'marking' ? (
                 <CyberCard className="!p-6 overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                       <div className="relative flex-1">
                          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyber-neon/50" />
                          <input
                            type="text"
                            placeholder="SCAN IDENTITY / USN..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0a0a0f] border border-cyber-border rounded-xl px-4 py-3 pl-12 text-sm text-cyber-text font-mono focus:border-cyber-neon outline-none"
                          />
                       </div>
                       
                       <div className="flex gap-2">
                          <button 
                            onClick={() => markAll(true)}
                            className="px-6 py-3 border border-cyber-neon/40 text-cyber-neon hover:bg-cyber-neon/10 rounded-xl font-mono text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            BULK PRESENT
                          </button>
                          <button 
                            onClick={() => markAll(false)}
                            className="px-6 py-3 border border-[#ff00ff]/40 text-[#ff00ff] hover:bg-[#ff00ff]/10 rounded-xl font-mono text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            BULK ABSENT
                          </button>
                       </div>
                    </div>

                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                       {filteredStudents.length > 0 ? (
                         filteredStudents.map((student) => (
                           <div
                             key={student.studentId}
                             onClick={() => toggleAttendance(student.studentId)}
                             className={`
                               group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer
                               ${student.isPresent 
                                 ? 'bg-cyber-neon/5 border-cyber-neon/30 hover:border-cyber-neon' 
                                 : 'bg-[#ff00ff]/5 border-[#ff00ff]/30 hover:border-[#ff00ff]'
                               }
                             `}
                           >
                             <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-black text-xs ${student.isPresent ? 'bg-cyber-neon/10 text-cyber-neon' : 'bg-[#ff00ff]/10 text-[#ff00ff]'}`}>
                                   {student.usn.slice(-2)}
                                </div>
                                <div>
                                   <p className="text-cyber-text font-black uppercase font-mono tracking-tight group-hover:text-cyber-neon transition-colors">{student.fullName}</p>
                                   <p className="text-[10px] text-cyber-text-secondary font-mono tracking-widest">{student.usn}</p>
                                </div>
                             </div>

                             <div className="flex items-center gap-4">
                                <div className={`px-4 py-2 rounded-lg font-mono text-[10px] font-black uppercase tracking-widest border ${
                                   student.isPresent ? 'border-cyber-neon/40 text-cyber-neon' : 'border-[#ff00ff]/40 text-[#ff00ff]'
                                }`}>
                                   {student.isPresent ? 'PRESENT' : 'ABSENT'}
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                   student.isPresent ? 'border-cyber-neon bg-cyber-neon shadow-[0_0_10px_#00ff00]' : 'border-cyber-border/40'
                                }`}>
                                   {student.isPresent && <CheckCircle2 size={14} className="text-cyber-bg" />}
                                </div>
                             </div>
                           </div>
                         ))
                       ) : (
                         <div className="py-20 text-center text-cyber-text-secondary/30 font-mono italic">
                            <Search size={48} className="mx-auto mb-4 opacity-10" />
                            No identifiers found matching query...
                         </div>
                       )}
                    </div>
                 </CyberCard>
               ) : (
                 <CyberCard title="AUDIT ENGINE" className="!p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                       <table className="w-full text-left font-mono">
                          <thead>
                             <tr className="border-b border-cyber-border/30 text-[10px] text-cyber-text-secondary uppercase tracking-widest font-black">
                                <th className="px-6 py-4">TIMESTAMP</th>
                                <th className="px-6 py-4">OPERATIVE</th>
                                <th className="px-6 py-4">TRANSITION</th>
                                <th className="px-6 py-4">REMARKS</th>
                             </tr>
                          </thead>
                          <tbody className="text-[11px]">
                             {auditLogs.length > 0 ? (
                               auditLogs.map((log) => (
                                 <tr key={log.id} className="border-b border-cyber-border/10 hover:bg-cyber-neon/5 transition-all">
                                    <td className="px-6 py-6 text-cyber-text-secondary uppercase">
                                       {format(new Date(log.changed_at), 'dd.MM HH:mm')}
                                    </td>
                                    <td className="px-6 py-6 font-black uppercase text-cyber-text">
                                       {log.student_name}<br/>
                                       <span className="text-[9px] text-cyber-neon/60">{log.usn}</span>
                                    </td>
                                    <td className="px-6 py-6">
                                       <div className="flex items-center gap-2">
                                          <span className={log.previous_status ? 'text-cyber-neon' : 'text-[#ff00ff]'}>{log.previous_status ? 'PRESENT' : 'ABSENT'}</span>
                                          <span className="text-cyber-text-secondary">➜</span>
                                          <span className={log.new_status ? 'text-cyber-neon' : 'text-[#ff00ff] font-bold'}>{log.new_status ? 'PRESENT' : 'ABSENT'}</span>
                                       </div>
                                    </td>
                                    <td className="px-6 py-6 text-cyber-text-secondary italic">
                                       {log.remarks || 'BULK_EDIT'}
                                       <div className="text-[9px] text-cyber-neon mt-1">BY: {log.changed_by}</div>
                                    </td>
                                 </tr>
                               ))
                             ) : (
                               <tr>
                                  <td colSpan="4" className="px-6 py-20 text-center text-cyber-text-secondary/40 italic">
                                     NO AUDIT TRAILS DETECTED FOR THIS SESSION.
                                  </td>
                               </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </CyberCard>
               )}
            </div>
          </div>
        )}

        {!session && dateState !== 'future' && !loading && (
          <CyberCard className="text-center py-20 bg-cyber-neon/5 border-cyber-neon/20">
            <div className="max-w-md mx-auto space-y-6">
               <CalendarDays size={64} className="mx-auto text-cyber-neon/20" />
               <div className="space-y-2">
                 <h3 className="text-2xl font-black text-cyber-text uppercase font-mono tracking-tighter">NO SESSION REGISTERED</h3>
                 <p className="text-sm text-cyber-text-secondary font-mono leading-relaxed px-8">
                   Systems show no active session for <span className="text-cyber-neon">{format(selectedDate, 'MMMM dd, yyyy')}</span>. Click below to initialize a new session.
                 </p>
               </div>
               <Button variant="primary" size="lg" onClick={loadSession} className="px-10 h-14">
                 INITIALIZE SESSION
               </Button>
            </div>
          </CyberCard>
        )}
        
        {loading && (
          <div className="py-40 flex flex-col items-center justify-center space-y-6">
             <RotateCcw size={64} className="text-cyber-neon animate-spin opacity-40" />
             <p className="font-mono text-sm text-cyber-neon animate-pulse tracking-[0.3em] font-black uppercase">Syncing Records...</p>
          </div>
        )}
      </div>
    </>
  );
}

const CalendarDays = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>
  </svg>
);
