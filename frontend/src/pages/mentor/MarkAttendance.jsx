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
import { ChevronLeft, ChevronRight, Lock, Search, Zap } from 'lucide-react';
import Button from '../../components/ui/Button';
import { CyberCard } from '../../components/ui/CyberCard';
import { CyberBackground } from '../../components/ui/CyberBackground';
import { StatusBadge } from '../../components/ui/StatusBadge';
import Avatar from '../../components/ui/Avatar';
import { getSessionByDate, getSessionAttendance, saveAttendance } from '../../lib/api';
import gsap from 'gsap';
import toast from 'react-hot-toast';

export default function MarkAttendance() {
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(startOfDay(new Date())));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [topic, setTopic] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const terminalRef = useRef(null);

  const today = startOfDay(new Date());
  const dateState = isAfter(selectedDate, today) ? 'future' : isBefore(selectedDate, today) ? 'past' : 'today';
  const isLocked = dateState !== 'today';

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
    try {
      setLoading(true);
      const { session: sessionData } = await getSessionByDate(dateStr);
      setSession(sessionData);
      
      if (sessionData) {
        setTopic(sessionData.topic || '');
        const { students: studentList } = await getSessionAttendance(sessionData._id);
        setStudents(
          studentList.map((student) =>
            normalizeStudent({
              ...student,
              isPresent: student.status === 'present',
            })
          )
        );
      } else {
        setStudents([]);
        setTopic('');
      }
      setHasChanges(false);
    } catch (err) {
      toast.error('Failed to load session data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
    // Keep currentWeekStart synced if selectedDate jumps out of bounds (e.g. going to today)
    if (isBefore(selectedDate, currentWeekStart) || isAfter(selectedDate, endOfWeek(currentWeekStart))) {
      setCurrentWeekStart(startOfWeek(selectedDate));
    }
  }, [dateStr]);

  const handleSave = async () => {
    if (!session || isLocked) return;
    
    try {
      setSaving(true);
      const payload = {
        topic,
        attendance: students.map(s => ({
          studentId: s.studentId,
          status: s.isPresent ? 'present' : 'absent'
        }))
      };

      await saveAttendance(session._id, payload);
      toast.success('Attendance saved successfully');
      setHasChanges(false);
    } catch (err) {
      toast.error(err.message || 'Failed to save attendance');
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

  const filteredStudents = students.filter((student) => {
    const query = searchQuery.toLowerCase();
    const fullName = String(student.fullName || '').toLowerCase();
    const usn = String(student.usn || '').toLowerCase();
    return fullName.includes(query) || usn.includes(query);
  });

  const presentCount = students.filter(s => s.isPresent).length;
  const absentCount = students.length - presentCount;
  const attendancePct = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  // Calendar Strip logic
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: endOfWeek(currentWeekStart) });

  return (
    <>
      <CyberBackground interactive={false} particleCount={200} />
      
      <div className="space-y-6 pb-24 animate-fade-in max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <section>
          <h2 className="font-mono text-4xl font-bold text-cyber-neon tracking-widest uppercase">
            RFID SCANNER
          </h2>
          <p className="text-cyber-text-secondary text-sm font-mono mt-2">
            {dateState === 'today' && '▸ LIVE - Ready for marking'}
            {dateState === 'past' && '◄ ARCHIVED - View only'}
            {dateState === 'future' && '⏳ LOCKED - Date not yet available'}
          </p>
        </section>

        {/* Calendar Strip */}
        <CyberCard title="📅 DATE SELECTOR" animated={true} interactive={true}>
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-sm text-cyber-neon uppercase tracking-widest">
              {format(currentWeekStart, 'MMMM yyyy')}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentWeekStart(prev => subWeeks(prev, 1))}
                className="w-8 h-8 flex items-center justify-center border border-cyber-border rounded hover:border-cyber-neon hover:bg-cyber-neon/10 transition-all"
              >
                <ChevronLeft size={16} className="text-cyber-text-secondary" />
              </button>
              <button 
                onClick={() => {
                  setSelectedDate(today);
                  setCurrentWeekStart(startOfWeek(today));
                }}
                className="px-3 h-8 flex items-center justify-center border border-cyber-border rounded text-xs font-mono text-cyber-text-secondary hover:text-cyber-neon hover:border-cyber-neon transition-all uppercase"
              >
                Today
              </button>
              <button 
                onClick={() => setCurrentWeekStart(prev => addWeeks(prev, 1))}
                className="w-8 h-8 flex items-center justify-center border border-cyber-border rounded hover:border-cyber-neon hover:bg-cyber-neon/10 transition-all"
              >
                <ChevronRight size={16} className="text-cyber-text-secondary" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
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
                    flex flex-col items-center gap-1 py-2 px-1 rounded border transition-all font-mono
                    ${isDayFuture ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                    ${isSelected ? 'border-cyber-neon bg-cyber-neon/10' : 'border-cyber-border/30 hover:border-cyber-neon/50'}
                  `}
                >
                  <span className="text-[10px] text-cyber-text-secondary uppercase">{format(day, 'EEE')}</span>
                  <span className={`text-sm font-bold ${isSelected ? 'text-cyber-neon' : 'text-cyber-text'}`}>
                    {format(day, 'd')}
                  </span>
                  {isDayToday && <div className="w-1 h-1 rounded-full bg-cyber-neon" />}
                </button>
              );
            })}
          </div>
        </CyberCard>

        {session && (
          <>
            {/* Session Info */}
            <CyberCard title="📍 SESSION INFO" animated={true}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-cyber-text-secondary font-mono uppercase mb-1">Date</p>
                  <p className="font-mono text-cyber-text font-bold">{format(selectedDate, 'MMM dd')}</p>
                </div>
                <div>
                  <p className="text-xs text-cyber-text-secondary font-mono uppercase mb-1">Total</p>
                  <p className="font-mono text-cyber-text font-bold text-lg">{students.length}</p>
                </div>
                <div>
                  <p className="text-xs text-cyber-text-secondary font-mono uppercase mb-1">Present</p>
                  <p className="font-mono text-cyber-neon font-bold text-lg">{presentCount}</p>
                </div>
                <div>
                  <p className="text-xs text-cyber-text-secondary font-mono uppercase mb-1">Absent</p>
                  <p className="font-mono text-warning-color font-bold text-lg">{absentCount}</p>
                </div>
              </div>
              <div className="mt-4 p-2 bg-cyber-surface border border-cyber-border rounded text-center">
                <p className="text-xs text-cyber-text-secondary font-mono mb-1">ATTENDANCE %</p>
                <p className={`font-mono text-2xl font-bold ${attendancePct >= 80 ? 'text-cyber-neon' : attendancePct >= 60 ? 'text-warning-color' : 'text-danger-color'}`}>
                  {attendancePct}%
                </p>
              </div>
            </CyberCard>

            {/* Search & Student List */}
            <CyberCard className="!p-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-neon/50" />
                    <input
                      type="text"
                      placeholder="Scan USN or Name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 pl-10 text-sm text-cyber-text placeholder-cyber-text-secondary focus:border-cyber-neon focus:bg-cyber-card outline-none transition-all font-mono"
                    />
                  </div>
                  {!isLocked && (
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => markAll(true)}>
                        ALL ✓
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => markAll(false)}>
                        ALL ✗
                      </Button>
                    </div>
                  )}
                </div>

                {/* Student List */}
                <div className="max-h-96 overflow-y-auto border border-cyber-border rounded p-3 space-y-2">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.studentId}
                      onClick={() => toggleAttendance(student.studentId)}
                      className={`
                        flex items-center gap-3 p-2 rounded border cursor-pointer transition-all font-mono text-sm
                        ${student.isPresent 
                          ? 'bg-cyber-neon/10 border-cyber-neon/40 text-cyber-neon' 
                          : 'bg-cyber-surface border-cyber-border/30 text-cyber-text-secondary hover:border-cyber-text-secondary'
                        }
                      `}
                    >
                      <div className={`w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                        student.isPresent ? 'bg-cyber-neon border-cyber-neon' : 'border-cyber-border'
                      }`}>
                        {student.isPresent && <span className="text-[10px] text-cyber-bg font-bold">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-bold">{student.fullName}</p>
                        <p className="text-[10px] opacity-70 truncate">{student.usn}</p>
                      </div>
                      <span className="flex-shrink-0">
                        {student.isPresent ? '✓' : '✗'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Save Button */}
                {!isLocked && (
                  <Button 
                    variant="primary" 
                    className="w-full" 
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                  >
                    <Zap size={18} />
                    {saving ? 'SAVING...' : 'SAVE ATTENDANCE'}
                  </Button>
                )}

                {isLocked && (
                  <div className="flex items-center gap-2 p-3 bg-danger-color/10 border border-danger-color/30 rounded text-danger-color text-sm font-mono">
                    <Lock size={16} />
                    {dateState === 'past' ? 'ARCHIVED - READ ONLY' : 'FUTURE DATE - LOCKED'}
                  </div>
                )}
              </div>
            </CyberCard>
          </>
        )}

        {!session && dateState !== 'future' && !loading && (
          <CyberCard title="⏳ NO SESSION" className="text-center py-8">
            <p className="text-cyber-text-secondary font-mono mb-4">
              ✗ No session found for {format(selectedDate, 'yyyy-MM-dd')}
            </p>
            {dateState === 'today' && (
              <Button variant="primary" onClick={loadSession}>
                CREATE SESSION
              </Button>
            )}
          </CyberCard>
        )}
      </div>
    </>
  );
}
