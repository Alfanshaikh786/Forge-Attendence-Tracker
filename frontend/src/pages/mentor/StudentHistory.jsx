import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download,
  Loader2,
  TrendingUp,
  Zap
} from 'lucide-react';
import { clsx } from 'clsx';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import StatusPill from '../../components/ui/StatusPill';
import HeatmapGrid from '../../components/ui/HeatmapGrid';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { getStudents, getStudentAnalytics } from '../../lib/api';
import toast from 'react-hot-toast';

export const StudentHistory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAllStudents = async () => {
      try {
        const { students } = await getStudents();
        setAllStudents(students);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllStudents();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    const found = allStudents.find(s => 
      s.usn.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (found) {
      try {
        setLoading(true);
        const { analytics: analyticsData } = await getStudentAnalytics(found._id);
        setSelectedStudent(found);
        setAnalytics(analyticsData);
      } catch (err) {
        toast.error('Failed to fetch student analytics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      toast.error('Student not found');
      setSelectedStudent(null);
      setAnalytics(null);
    }
  };

  const heatmapData = analytics?.history?.map(h => ({
    date: h.date.split('T')[0],
    status: h.status
  })) || [];

  const history = analytics?.history || [];

  const handleExportCsv = () => {
    if (!history.length) {
      toast('No attendance history is available to export.');
      return;
    }

    const rows = [
      ['Date', 'Topic', 'Status', 'Duration', 'Notes'],
      ...history.map((row) => [
        new Date(row.date).toLocaleDateString(),
        row.topic || '',
        row.status || '',
        row.duration || '',
        row.notes || '-',
      ]),
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedStudent?.usn || 'student'}-attendance-history.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Student history exported.');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <section>
        <h2 className="font-display text-3xl font-bold text-fg-primary">Student History</h2>
        <p className="text-fg-secondary text-sm mt-1">Search and view detailed learning journey of students.</p>
      </section>

      {/* Search Section */}
      <Card className="!p-0">
        <form onSubmit={handleSearch} className="flex items-center p-4">
          <Search size={20} className="text-fg-tertiary ml-2" />
          <input
            type="text"
            placeholder="Search student by Name or USN..."
            className="flex-1 bg-transparent border-none px-4 py-2 text-fg-primary placeholder:text-fg-tertiary focus:ring-0 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>
      </Card>

      {selectedStudent ? (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Profile Card */}
            <Card className="lg:col-span-5 flex flex-col items-center text-center">
              <Avatar name={selectedStudent.fullName} size="lg" className="mb-6 ring-4 ring-surface-inset ring-offset-4 ring-offset-accent/20" />
              <h3 className="font-display text-[32px] font-bold text-fg-primary leading-tight">
                {selectedStudent.fullName}
              </h3>
              <p className="text-sm font-mono text-fg-tertiary uppercase tracking-[0.15em] mt-1">
                {selectedStudent.usn}
              </p>
              
              <div className="flex gap-2 mt-4">
                <div className="bg-surface-raised px-3 py-1 rounded-full text-[10px] font-bold text-fg-secondary border border-border-subtle uppercase">
                  {selectedStudent.department}
                </div>
                <div className="bg-surface-raised px-3 py-1 rounded-full text-[10px] font-bold text-fg-secondary border border-border-subtle uppercase">
                  Batch {selectedStudent.batchYear}
                </div>
              </div>

              <div className="w-full h-px bg-border-subtle my-8" />

              <div className="grid grid-cols-1 gap-6 w-full">
                <div className="space-y-1">
                  <div className={clsx(
                    "text-[48px] font-display font-bold tabular-nums leading-none",
                    analytics.attendancePercentage >= 75 ? "text-success" : 
                    analytics.attendancePercentage >= 60 ? "text-warning" : "text-danger"
                  )}>
                    {analytics.attendancePercentage}%
                  </div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-fg-tertiary">
                    Overall Attendance
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-inset p-3 rounded-xl border border-border-subtle flex flex-col items-center">
                    <Zap size={16} className="text-warning mb-1" />
                    <span className="text-lg font-bold text-white">{analytics.currentStreak}</span>
                    <span className="text-[10px] text-fg-tertiary uppercase">Current Streak</span>
                  </div>
                  <div className="bg-surface-inset p-3 rounded-xl border border-border-subtle flex flex-col items-center">
                    <TrendingUp size={16} className="text-accent mb-1" />
                    <span className="text-lg font-bold text-white">{analytics.longestStreak}</span>
                    <span className="text-[10px] text-fg-tertiary uppercase">Longest Streak</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Heatmap Card */}
            <Card className="lg:col-span-7">
              <HeatmapGrid 
                data={heatmapData} 
                month={new Date().toLocaleString('default', { month: 'long' })} 
                year={new Date().getFullYear().toString()} 
              />
              
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-inset border border-border-subtle">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 bg-success rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-[11px] font-medium uppercase tracking-widest text-fg-tertiary">Present Days</span>
                  </div>
                  <div className="text-2xl font-bold text-fg-primary tabular-nums">
                    {history.filter(h => h.status === 'present').length}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-surface-inset border border-border-subtle">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 bg-danger rounded-full shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                    <span className="text-[11px] font-medium uppercase tracking-widest text-fg-tertiary">Absent Days</span>
                  </div>
                  <div className="text-2xl font-bold text-fg-primary tabular-nums">
                    {history.filter(h => h.status === 'absent').length}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Monthly Breakdown Chart (Simplistic) */}
          {analytics.monthlyBreakdown?.length > 0 && (
            <Card>
              <h4 className="text-[11px] font-medium uppercase tracking-[0.15em] text-fg-tertiary mb-6">
                Monthly Performance Breakdown
              </h4>
              <div className="flex items-end gap-4 h-32 px-4">
                {analytics.monthlyBreakdown.map((m, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center group">
                    <div className="w-full relative h-full bg-surface-inset rounded-t-lg overflow-hidden">
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-accent/40 group-hover:bg-accent/60 transition-all rounded-t-sm"
                        style={{ height: `${m.percentage}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        {m.percentage}%
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-fg-tertiary mt-2 uppercase">{m.name}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* History Table */}
          <Card className="!p-0 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-border-subtle flex justify-between items-center bg-surface/50">
              <h3 className="text-[11px] font-medium uppercase tracking-[0.15em] text-fg-tertiary">
                Detailed Attendance Log
              </h3>
              <Button variant="ghost" size="sm" onClick={handleExportCsv}>
                <Download size={16} />
                Export CSV
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-inset">
                    <th className="px-6 py-4 text-[11px] font-bold text-fg-tertiary uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-fg-tertiary uppercase tracking-widest">Topic</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-fg-tertiary uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-fg-tertiary uppercase tracking-widest">Duration</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-fg-tertiary uppercase tracking-widest">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {history.map((row, idx) => (
                    <tr key={idx} className="hover:bg-surface-raised transition-colors group">
                      <td className="px-6 py-4 text-sm font-mono text-fg-secondary group-hover:text-fg-primary">
                        {new Date(row.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-fg-primary">{row.topic}</td>
                      <td className="px-6 py-4">
                        <StatusPill status={row.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-fg-secondary">2h</td>
                      <td className="px-6 py-4 text-xs text-fg-tertiary italic">-</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <EmptyState 
          icon={loading ? Loader2 : Search}
          heading={loading ? "Analyzing Data..." : "Start Searching"}
          subtext={loading ? "Fetching comprehensive attendance history and calculating program streaks." : "Enter a student USN or Name to view their complete attendance history and heatmap overview."}
        />
      )}
    </div>
  );
};

export default StudentHistory;
