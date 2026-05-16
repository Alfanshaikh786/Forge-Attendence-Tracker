import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  markAnnouncementAsRead,
} from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import {
  BookOpen, Plus, Trash2, Pin, CheckCircle2,
  Clock, AlertCircle, X, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Announcements() {
  const { user } = useAuth();
  const isMentor = user?.role === 'mentor';

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', isPinned: false });

  useEffect(() => {
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await getAnnouncements();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setSubmitting(true);
    try {
      await createAnnouncement(form.title, form.content, form.isPinned);
      toast.success('Announcement posted!');
      setForm({ title: '', content: '', isPinned: false });
      setShowForm(false);
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.message || 'Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAnnouncement(id);
      setAnnouncements(prev => prev.filter(a => a._id !== id));
      toast.success('Announcement deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markAnnouncementAsRead(id);
      setAnnouncements(prev =>
        prev.map(a => a._id === id ? { ...a, isRead: true } : a)
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const pinned = announcements.filter(a => a.isPinned || a.is_pinned);
  const regular = announcements.filter(a => !a.isPinned && !a.is_pinned);
  const unreadCount = announcements.filter(a => !a.isRead).length;

  const filtered = filter === 'unread'
    ? [...pinned, ...regular].filter(a => !a.isRead)
    : [...pinned, ...regular];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <section className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-fg-primary flex items-center gap-3">
            <BookOpen size={28} className="text-accent" />
            Announcements
          </h2>
          <p className="text-fg-secondary text-sm mt-1">
            {isMentor
              ? 'Create and manage announcements for your students.'
              : 'Stay updated with important announcements from your mentor.'}
          </p>
        </div>
        {isMentor && (
          <Button variant="primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancel' : 'New Announcement'}
          </Button>
        )}
      </section>

      {/* Create Form (mentor only) */}
      {isMentor && showForm && (
        <Card className="border border-accent/30">
          <h3 className="text-lg font-bold text-fg-primary mb-6 flex items-center gap-2">
            <Plus size={18} className="text-accent" /> Create Announcement
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-fg-tertiary uppercase tracking-widest mb-2">
                Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Announcement title..."
                className="w-full bg-surface-inset border border-border-default rounded-xl px-4 py-3 text-fg-primary placeholder:text-fg-tertiary focus:border-accent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-fg-tertiary uppercase tracking-widest mb-2">
                Content
              </label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Write your announcement here..."
                rows={5}
                className="w-full bg-surface-inset border border-border-default rounded-xl px-4 py-3 text-fg-primary placeholder:text-fg-tertiary focus:border-accent outline-none transition-all resize-none"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.isPinned}
                onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))}
                className="w-4 h-4 accent-[var(--accent-primary)]"
              />
              <span className="flex items-center gap-2 text-sm text-fg-secondary group-hover:text-fg-primary transition-colors">
                <Pin size={15} className="text-warning" /> Pin this announcement to the top
              </span>
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Post Announcement
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'unread'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${
              filter === f
                ? 'bg-accent text-black'
                : 'bg-surface-raised text-fg-secondary border border-border-subtle hover:border-border-strong'
            }`}
          >
            {f === 'all' ? `All (${announcements.length})` : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && announcements.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-accent" />
        </div>
      )}

      {/* Announcements List */}
      {!loading && filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          heading={filter === 'unread' ? 'All caught up!' : 'No announcements yet'}
          subtext={
            filter === 'unread'
              ? 'You have read all announcements.'
              : isMentor
              ? 'Click "New Announcement" above to post one.'
              : 'No announcements yet. Check back later!'
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map(ann => {
            const isPinned = ann.isPinned || ann.is_pinned;
            const isRead = ann.isRead;
            return (
              <Card
                key={ann._id}
                className={`transition-all border-l-4 ${
                  isPinned ? 'border-l-warning' : isRead ? 'border-l-border-subtle' : 'border-l-accent'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {isPinned && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-warning/15 text-warning text-xs font-bold rounded-full border border-warning/30">
                          <Pin size={10} /> Pinned
                        </span>
                      )}
                      {!isRead && (
                        <span className="px-2 py-0.5 bg-accent/15 text-accent text-xs font-bold rounded-full border border-accent/30">
                          New
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-fg-primary mb-2">{ann.title}</h3>
                    <p className="text-fg-secondary text-sm whitespace-pre-wrap leading-relaxed mb-4">
                      {ann.content}
                    </p>

                    <div className="flex flex-wrap gap-4 text-xs text-fg-tertiary">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(ann.created_at || ann.createdAt).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                      {ann.createdBy?.displayName && (
                        <span className="font-medium">From: {ann.createdBy.displayName}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Students: mark as read */}
                    {!isMentor && !isRead && (
                      <button
                        onClick={() => handleMarkAsRead(ann._id)}
                        title="Mark as read"
                        className="p-2 rounded-lg hover:bg-accent/10 text-fg-tertiary hover:text-accent transition-all"
                      >
                        <CheckCircle2 size={20} />
                      </button>
                    )}
                    {/* Mentor: delete */}
                    {isMentor && (
                      <button
                        onClick={() => handleDelete(ann._id)}
                        title="Delete announcement"
                        className="p-2 rounded-lg hover:bg-danger/10 text-fg-tertiary hover:text-danger transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
