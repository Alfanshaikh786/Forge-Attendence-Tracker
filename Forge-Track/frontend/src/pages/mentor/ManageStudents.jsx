import { useState, useEffect } from 'react';
import { Plus, Search, Download, Trash2, Edit2, Users, Loader2, Shield } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { CyberCard } from '../../components/ui/CyberCard';
import { CyberTable } from '../../components/ui/CyberTable';
import { CyberBackground } from '../../components/ui/CyberBackground';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { AddStudentModal } from '../../components/ui/AddStudentModal';
import { useAuth } from '../../context/AuthContext';
import { getStudents, removeStudent } from '../../lib/api';
import gsap from 'gsap';
import toast from 'react-hot-toast';

export function ManageStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitial, setAddModalInitial] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 15;

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await getStudents();
      setStudents(data.students || []);
    } catch (err) {
      toast.error('Failed to load students: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(
    (student) =>
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.usn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    const toastId = toast.loading('Removing student...');
    try {
      await removeStudent(deleteConfirm._id);
      setStudents((prev) => prev.filter((s) => s._id !== deleteConfirm._id));
      toast.success('Student removed successfully', { id: toastId });
      setDeleteConfirm(null);
    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  };

  const handleExportCSV = () => {
    const headers = ['Full Name', 'USN', 'Email', 'Department', 'Phone', 'Batch Year', 'Attendance %'];
    const rows = students.map((s) => [
      s.fullName,
      s.usn,
      s.email,
      s.department,
      s.phone || '-',
      s.batchYear,
      s.attendancePercentage || 0,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Exported student list');
  };

  return (
    <>
      <CyberBackground interactive={true} particleCount={300} />
      
      <div className="space-y-8 animate-fade-in pb-20 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <section>
            <div className="flex items-center gap-3 text-cyber-neon mb-2">
              <Shield size={20} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]">User Registry</span>
            </div>
            <h2 className="font-mono text-4xl font-bold text-cyber-neon tracking-widest uppercase">
              IDENTITY SCAN <span className="text-cyber-text-secondary font-mono text-2xl font-normal ml-2">[{students.length}]</span>
            </h2>
          </section>

          <div className="flex gap-3 w-full lg:w-auto">
            <Button
              variant="secondary"
              onClick={handleExportCSV}
              className="flex-1 lg:flex-none"
            >
              <Download size={18} />
              EXPORT
            </Button>
            <Button
              variant="primary"
              onClick={() => { setAddModalInitial(null); setIsAddModalOpen(true); }}
              className="flex-1 lg:flex-none"
            >
              <Plus size={20} />
              ENROLL
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <CyberCard title="SEARCH INTERFACE" icon="🔍" interactive={true}>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyber-neon/50" />
              <input
                type="text"
                placeholder="Scan USN / Name / Email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-cyber-surface border border-cyber-border rounded-sm pl-12 pr-4 py-2.5 text-sm text-cyber-text placeholder-cyber-text-secondary focus:border-cyber-neon focus:bg-cyber-card outline-none transition-all font-mono"
              />
            </div>

            <div className="text-xs font-mono text-cyber-text-secondary whitespace-nowrap">
              ENTRIES: {paginatedStudents.length} / {filteredStudents.length}
            </div>
          </div>
        </CyberCard>

        {/* Table/Content */}
        <div>
          {loading ? (
            <CyberCard title="SYSTEM STATUS" icon="⏳" className="min-h-[400px] flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-cyber-neon" size={40} />
              <p className="text-sm font-mono text-cyber-text-secondary animate-pulse mt-4">
                SYNCHRONIZING DATABASE...
              </p>
            </CyberCard>
          ) : students.length === 0 ? (
            <CyberCard title="REGISTRY STATUS" icon="📭" className="min-h-[400px] flex flex-col items-center justify-center">
              <div className="text-center">
                <p className="text-cyber-neon font-mono text-2xl mb-4">▸ EMPTY REGISTRY</p>
                <p className="text-sm text-cyber-text-secondary font-mono max-w-sm mb-8">
                  No identities detected. Enroll a student to begin.
                </p>
                <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                  ENROLL FIRST SUBJECT
                </Button>
              </div>
            </CyberCard>
          ) : (
            <CyberCard className="!p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-sm">
                  <thead>
                    <tr className="bg-cyber-surface/50 border-b border-cyber-border">
                      <th className="px-6 py-4 text-[10px] text-cyber-neon uppercase tracking-widest">ID</th>
                      <th className="px-6 py-4 text-[10px] text-cyber-neon uppercase tracking-widest">NAME / USN</th>
                      <th className="px-6 py-4 text-[10px] text-cyber-neon uppercase tracking-widest">DEPT</th>
                      <th className="px-6 py-4 text-[10px] text-cyber-neon uppercase tracking-widest">BATCH</th>
                      <th className="px-6 py-4 text-[10px] text-cyber-neon uppercase tracking-widest">ATTENDANCE</th>
                      <th className="px-6 py-4 text-[10px] text-cyber-neon uppercase tracking-widest">STATUS</th>
                      <th className="px-6 py-4 text-right text-[10px] text-cyber-neon uppercase tracking-widest">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-border/30">
                    {paginatedStudents.map((student, idx) => {
                      const attendanceStatus = student.attendancePercentage >= 80 
                        ? 'active' 
                        : student.attendancePercentage >= 60 
                        ? 'delayed' 
                        : 'offline';
                      
                      return (
                        <tr 
                          key={student._id} 
                          className="hover:bg-cyber-neon/5 transition-colors group border-cyber-border/20"
                        >
                          <td className="px-6 py-4">
                            <div className="w-8 h-8 rounded-sm bg-cyber-neon/10 border border-cyber-neon/30 flex items-center justify-center text-cyber-neon font-bold text-xs">
                              {String(idx + 1).padStart(2, '0')}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-cyber-text font-semibold">{student.fullName}</span>
                              <span className="text-[10px] text-cyber-text-secondary uppercase tracking-wider">{student.usn}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-cyber-text-secondary">
                            {student.department}
                          </td>
                          <td className="px-6 py-4 text-cyber-text-secondary font-mono">
                            {student.batchYear}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold tabular-nums ${
                                attendanceStatus === 'active' ? 'text-cyber-neon' :
                                attendanceStatus === 'delayed' ? 'text-warning-color' :
                                'text-gray-500'
                              }`}>
                                {student.attendancePercentage || 0}%
                              </span>
                              <div className="w-16 h-1 bg-cyber-surface rounded-full overflow-hidden border border-cyber-border/30">
                                <div 
                                  className={`h-full transition-all duration-1000 ${
                                    attendanceStatus === 'active' ? 'bg-cyber-neon' :
                                    attendanceStatus === 'delayed' ? 'bg-warning-color' :
                                    'bg-gray-600'
                                  }`}
                                  style={{ width: `${student.attendancePercentage || 0}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={attendanceStatus} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => { setAddModalInitial(student); setIsAddModalOpen(true); }}
                                className="p-1.5 hover:bg-cyber-neon/10 text-cyber-text-secondary hover:text-cyber-neon rounded transition-all" 
                                title="Edit"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => setDeleteConfirm(student)}
                                className="p-1.5 hover:bg-danger-color/10 text-cyber-text-secondary hover:text-danger-color rounded transition-all" 
                                title="Remove"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-cyber-border/30 bg-cyber-surface/30 flex items-center justify-between font-mono text-sm">
                  <p className="text-xs text-cyber-text-secondary">
                    PAGE {currentPage} / {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      ◄ PREV
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      NEXT ►
                    </Button>
                  </div>
                </div>
              )}
            </CyberCard>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
            <CyberCard title="⚠️ CONFIRM DELETION" className="relative w-full max-w-sm">
              <div className="flex flex-col">
                <p className="text-sm text-cyber-text-secondary font-mono mb-6">
                  Permanent removal of:<br />
                  <span className="text-cyber-neon font-bold">{deleteConfirm.fullName}</span><br />
                  <span className="text-[10px] text-cyber-text-secondary">({deleteConfirm.usn})</span>
                </p>
                <div className="flex gap-3">
                  <Button 
                    variant="secondary" 
                    className="flex-1" 
                    onClick={() => setDeleteConfirm(null)}
                  >
                    CANCEL
                  </Button>
                  <Button 
                    variant="primary" 
                    className="flex-1 bg-danger-color/20 border-danger-color/50 text-danger-color hover:bg-danger-color/30" 
                    onClick={handleDelete}
                  >
                    CONFIRM
                  </Button>
                </div>
              </div>
            </CyberCard>
          </div>
        )}

        <AddStudentModal
          isOpen={isAddModalOpen}
          initialData={addModalInitial}
          onClose={() => { setIsAddModalOpen(false); setAddModalInitial(null); }}
          onSuccess={() => { fetchStudents(); setAddModalInitial(null); }}
        />
      </div>
    </>
  );
}
