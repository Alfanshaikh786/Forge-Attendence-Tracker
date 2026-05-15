import { useState, useEffect } from 'react';

import Card from '../../components/ui/Card';
import HeatmapGrid from '../../components/ui/HeatmapGrid';
import StatusPill from '../../components/ui/StatusPill';
import Button from '../../components/ui/Button';
import { Download, Loader2 } from 'lucide-react';
import { getAttendanceStats, getAttendanceHistory, getAttendanceHeatmap } from '../../lib/api';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

export const StudentAttendance = () => {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);

  const [displayMonth, setDisplayMonth] = useState(new Date());
  const [heatmapLoading, setHeatmapLoading] = useState(true);

  const handleExportHistory = () => {
    if (!history.length) {
      toast('No attendance history is available to export.');
      return;
    }

    const rows = [
      ['Date', 'Topic', 'Mentor', 'Status', 'Duration'],
      ...history.map((session) => [
        new Date(session.date).toLocaleDateString(),
        session.topic || '',
        session.mentorName || 'Mentor',
        session.status || '',
        session.duration || '',
      ]),
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'forgetrack-attendance-history.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Attendance history exported.');
  };

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          getAttendanceStats(),
          getAttendanceHistory(1, 50),
        ]);

        setStats(statsRes.stats);
        setHistory(historyRes.history);
      } catch (err) {
        toast.error('Failed to load attendance records');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    const fetchHeatmapForMonth = async (date) => {
      setHeatmapLoading(true);
      try {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const monthParam = `${y}-${m}`;
        const heatmapRes = await getAttendanceHeatmap(monthParam);

        const year = date.getFullYear();
        const monthIndex = date.getMonth();
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const firstWeekday = new Date(year, monthIndex, 1).getDay(); // 0=Sun
        const weekdayMondayFirst = (firstWeekday + 6) % 7; // 0=Mon

        const arr = [];
        for (let i = 0; i < weekdayMondayFirst; i++) arr.push({ status: 'pad' });
        for (let d = 1; d <= daysInMonth; d++) {
          const dt = new Date(Date.UTC(year, monthIndex, d));
          const dateStr = dt.toISOString().split('T')[0];
          arr.push({ date: dateStr, status: heatmapRes.heatmap[dateStr] || 'none' });
        }

        setHeatmap(arr);
      } catch (err) {
        console.error('Failed to load heatmap', err);
        toast.error('Failed to load attendance heatmap');
      } finally {
        setHeatmapLoading(false);
      }
    };

    fetchHeatmapForMonth(displayMonth);
  }, [displayMonth]);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="flex justify-between items-end">
        <div>
          <h2 className="font-display text-3xl font-bold text-fg-primary">My Attendance</h2>
          <p className="text-fg-secondary text-sm mt-1">Review your session attendance records and patterns.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleExportHistory}>
          <Download size={16} />
          Export History
        </Button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 flex flex-col items-center justify-center text-center py-10">
          <div className={clsx(
            "text-[64px] font-display font-bold leading-none mb-2",
            stats?.attendancePercentage >= 75 ? "text-success" : 
            stats?.attendancePercentage >= 60 ? "text-warning" : "text-danger"
          )}>
            {stats?.attendancePercentage || 0}%
          </div>
          <p className="text-[11px] font-bold text-fg-tertiary uppercase tracking-widest">Attendance Score</p>
          <div className="mt-8 flex flex-col gap-2 w-full max-w-[200px]">
            <div className="flex justify-between text-xs">
              <span className="text-fg-secondary">Present</span>
              <span className="text-fg-primary font-mono">{stats?.sessionsAttended || 0}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-fg-secondary">Absent</span>
              <span className="text-fg-primary font-mono">{stats?.sessionsMissed || 0}</span>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-8">
          <HeatmapGrid
            data={heatmap}
            month={displayMonth.toLocaleString('default', { month: 'long' })}
            year={displayMonth.getFullYear().toString()}
            onMonthChange={(delta) => {
              const d = new Date(displayMonth);
              d.setMonth(d.getMonth() + delta);
              setDisplayMonth(d);
            }}
          />
        </Card>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-inset">
                <th className="px-8 py-4 text-[10px] font-bold text-fg-tertiary uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-[10px] font-bold text-fg-tertiary uppercase tracking-widest">Topic</th>
                <th className="px-8 py-4 text-[10px] font-bold text-fg-tertiary uppercase tracking-widest">Mentor</th>
                <th className="px-8 py-4 text-[10px] font-bold text-fg-tertiary uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-bold text-fg-tertiary uppercase tracking-widest">Duration</th>
              </tr>
            </thead>
                <tbody className="divide-y divide-border-subtle">
              {history.map((session, idx) => (
                <tr key={idx} className="hover:bg-surface-raised transition-colors">
                  <td className="px-8 py-4 text-sm font-mono text-fg-tertiary">
                    {new Date(session.date).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-4 text-sm font-semibold text-fg-primary">{session.topic}</td>
                  <td className="px-8 py-4 text-sm text-fg-secondary">{session.mentorName || 'Mentor'}</td>
                  <td className="px-8 py-4">
                    <StatusPill status={session.status} />
                  </td>
                  <td className="px-8 py-4 text-sm text-fg-secondary">{session.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default StudentAttendance;
