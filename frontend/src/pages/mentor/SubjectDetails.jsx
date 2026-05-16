import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Users, Calendar, BarChart2, ArrowLeft, Plus, Trash2, 
  Search, Download, Edit3, CheckCircle, XCircle, Info,
  TrendingUp, Clock, FileSpreadsheet, UserCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell 
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

const SubjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

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
    if (!window.confirm('Are you sure you want to delete this session and all its attendance records?')) return;
    try {
      await deleteSession(sessionId);
      toast.success('Session deleted');
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      // Refresh stats
      const detailsRes = await getSubjectDetails(id);
      setSubject(detailsRes.subject);
    } catch (err) {
      toast.error('Failed to delete session');
    }
  };

  if (loading) return <LoadingScreen message="Loading subject matrix..." />;
  if (!subject) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyber-border pb-6">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <button className="p-2 hover:bg-cyber-surface rounded-full transition-colors text-cyber-neon border border-transparent hover:border-cyber-neon/30">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-cyber-neon/10 text-cyber-neon text-[10px] font-mono border border-cyber-neon/30 rounded uppercase tracking-tighter">
                {subject.code}
              </span>
              <h1 className="text-2xl font-bold text-cyber-text tracking-tight font-mono uppercase">
                {subject.name}
              </h1>
            </div>
            <p className="text-cyber-text-secondary text-sm font-mono flex items-center gap-2">
              <UserCheck size={14} className="text-cyber-neon/60" />
              Assigned Faculty: <span className="text-cyber-text">{subject.assigned_faculty_id ? 'You' : 'Unassigned'}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/mentor/mark-attendance?subjectId=${id}`}>
            <Button variant="cyber" className="flex items-center gap-2 px-6">
              <Plus size={18} />
              NEW SESSION
            </Button>
          </Link>
          <Link to="/mentor/bulk-import">
            <Button variant="outline" className="flex items-center gap-2">
              <FileSpreadsheet size={18} />
              IMPORT
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cyber-border/30 gap-8 overflow-x-auto no-scrollbar">
        {['overview', 'students', 'sessions'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-sm font-mono uppercase tracking-widest relative transition-colors ${
              activeTab === tab ? 'text-cyber-neon' : 'text-cyber-text-secondary hover:text-cyber-text'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyber-neon shadow-[0_0_10px_rgba(0,255,0,0.5)]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Stats Cards */}
            <CyberCard title="ANALYTICS" icon={<TrendingUp size={16} />} className="md:col-span-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-cyber-surface/50 p-4 rounded border border-cyber-border/30">
                  <p className="text-[10px] font-mono text-cyber-text-secondary uppercase mb-1">Attendance</p>
                  <p className="text-2xl font-bold font-mono text-cyber-neon">{subject.stats.avgAttendance}%</p>
                </div>
                <div className="bg-cyber-surface/50 p-4 rounded border border-cyber-border/30">
                  <p className="text-[10px] font-mono text-cyber-text-secondary uppercase mb-1">Total Classes</p>
                  <p className="text-2xl font-bold font-mono text-cyber-neon">{subject.stats.totalSessions}</p>
                </div>
                <div className="bg-cyber-surface/50 p-4 rounded border border-cyber-border/30">
                  <p className="text-[10px] font-mono text-cyber-text-secondary uppercase mb-1">Students</p>
                  <p className="text-2xl font-bold font-mono text-cyber-neon">{subject.stats.totalStudents}</p>
                </div>
                <div className="bg-cyber-surface/50 p-4 rounded border border-cyber-border/30">
                  <p className="text-[10px] font-mono text-cyber-text-secondary uppercase mb-1">Last Date</p>
                  <p className="text-sm font-bold font-mono text-cyber-text mt-1">
                    {subject.stats.lastSessionDate ? format(new Date(subject.stats.lastSessionDate), 'MMM dd') : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="h-[250px] w-full">
                {analytics.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics}>
                      <defs>
                        <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00ff00" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00ff00" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '4px' }}
                        itemStyle={{ color: '#00ff00' }}
                      />
                      <Area type="monotone" dataKey="attendance" stroke="#00ff00" fillOpacity={1} fill="url(#colorAtt)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-cyber-text-secondary font-mono text-xs opacity-50">
                    <BarChart2 size={32} className="mb-2" />
                    NO ATTENDANCE DATA YET
                  </div>
                )}
              </div>
            </CyberCard>

            <CyberCard title="QUICK INFO" icon={<Info size={16} />}>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono text-cyber-text-secondary uppercase">Description</label>
                  <p className="text-sm text-cyber-text mt-1 leading-relaxed">
                    This module manages all attendance records, student tracking, and analytical reports for {subject.name} ({subject.code}).
                  </p>
                </div>
                <div className="pt-4 border-t border-cyber-border/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-mono text-cyber-text-secondary uppercase">Syllabus Progress</span>
                    <span className="text-[10px] font-mono text-cyber-neon">{Math.min(100, subject.stats.totalSessions * 5)}%</span>
                  </div>
                  <ProgressBar progress={Math.min(100, subject.stats.totalSessions * 5)} size="xs" />
                </div>
                <div className="pt-6">
                  <Link to={`/mentor/mark-attendance?subjectId=${id}`}>
                    <Button variant="outline" className="w-full text-xs font-mono py-2 border-cyber-neon/30 hover:bg-cyber-neon/5">
                      GO TO CALENDAR
                    </Button>
                  </Link>
                </div>
              </div>
            </CyberCard>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <CyberCard>
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-text-secondary" size={18} />
                  <input
                    type="text"
                    placeholder="Search USN or Name..."
                    className="w-full bg-cyber-surface/50 border border-cyber-border rounded py-2 pl-10 pr-4 text-cyber-text focus:outline-none focus:border-cyber-neon font-mono text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Link to="/mentor/manage-students">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Users size={16} />
                    MANAGE ENROLLMENT
                  </Button>
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-cyber-border/50 text-cyber-text-secondary text-[10px] font-mono uppercase tracking-widest">
                      <th className="px-4 py-3 font-normal">Student</th>
                      <th className="px-4 py-3 font-normal">USN</th>
                      <th className="px-4 py-3 font-normal">Branch</th>
                      <th className="px-4 py-3 font-normal">Attendance</th>
                      <th className="px-4 py-3 font-normal text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <tr key={student.id} className="border-b border-cyber-border/20 hover:bg-cyber-neon/5 transition-colors group">
                          <td className="px-4 py-4">
                            <div className="font-medium text-cyber-text">{student.fullName}</div>
                          </td>
                          <td className="px-4 py-4">
                            <code className="text-cyber-neon/70">{student.usn}</code>
                          </td>
                          <td className="px-4 py-4 text-cyber-text-secondary">{student.department}</td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-24">
                                <ProgressBar progress={student.attendancePercentage} size="xs" color={student.attendancePercentage < 75 ? 'error' : 'success'} />
                              </div>
                              <span className={`text-[10px] font-mono ${student.attendancePercentage < 75 ? 'text-red-500' : 'text-cyber-neon'}`}>
                                {student.attendancePercentage}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Link to={`/mentor/students/${student.id}/history`}>
                              <button className="p-2 text-cyber-text-secondary hover:text-cyber-neon transition-colors">
                                <BarChart2 size={16} />
                              </button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-4 py-12 text-center text-cyber-text-secondary font-mono italic opacity-50">
                          {searchTerm ? 'No matching students found' : 'No students found for this subject'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CyberCard>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <CyberCard>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-cyber-border/50 text-cyber-text-secondary text-[10px] font-mono uppercase tracking-widest">
                      <th className="px-4 py-3 font-normal">Date</th>
                      <th className="px-4 py-3 font-normal">Topic</th>
                      <th className="px-4 py-3 font-normal">Present</th>
                      <th className="px-4 py-3 font-normal">%</th>
                      <th className="px-4 py-3 font-normal text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-mono">
                    {sessions.length > 0 ? (
                      sessions.map((session) => (
                        <tr key={session.id} className="border-b border-cyber-border/20 hover:bg-cyber-neon/5 transition-colors">
                          <td className="px-4 py-4 text-cyber-text">
                            {format(new Date(session.date), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-4 py-4 max-w-xs truncate text-cyber-text-secondary">
                            {session.topic || 'No topic specified'}
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-cyber-neon">{session.present}</span>
                            <span className="text-cyber-text-secondary"> / {session.total}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={session.total > 0 && session.present/session.total < 0.75 ? 'text-red-400' : 'text-cyber-neon'}>
                              {session.total > 0 ? Math.round((session.present / session.total) * 100) : 0}%
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link to={`/mentor/mark-attendance?date=${session.date}&subjectId=${id}`}>
                                <button className="p-2 text-cyber-text-secondary hover:text-cyber-neon transition-colors" title="Edit Session">
                                  <Edit3 size={16} />
                                </button>
                              </Link>
                              <button 
                                onClick={() => handleDeleteSession(session.id)}
                                className="p-2 text-cyber-text-secondary hover:text-red-500 transition-colors" 
                                title="Delete Session"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-4 py-12 text-center text-cyber-text-secondary font-mono italic opacity-50">
                          No sessions conducted yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CyberCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectDetails;
