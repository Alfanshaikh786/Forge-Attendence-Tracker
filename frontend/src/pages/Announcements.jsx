import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnnouncements, markAnnouncementAsRead } from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { AlertCircle, BookOpen, CheckCircle2, Clock } from 'lucide-react';

export default function Announcements() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'

  useEffect(() => {
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await getAnnouncements();
      setAnnouncements(data.announcements || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load announcements');
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (announcementId) => {
    try {
      await markAnnouncementAsRead(announcementId);
      setAnnouncements(prev =>
        prev.map(ann =>
          ann._id === announcementId ? { ...ann, isRead: true } : ann
        )
      );
    } catch (err) {
      console.error('Error marking announcement as read:', err);
    }
  };

  const pinnedAnnouncements = announcements.filter(ann => ann.isPinned);
  const regularAnnouncements = announcements.filter(ann => !ann.isPinned);
  const unreadCount = announcements.filter(ann => !ann.isRead).length;

  const filteredAnnouncements = filter === 'unread'
    ? [...pinnedAnnouncements.filter(a => !a.isRead), ...regularAnnouncements.filter(a => !a.isRead)]
    : [...pinnedAnnouncements, ...regularAnnouncements];

  if (loading && announcements.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen size={32} className="text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          </div>
          <p className="text-gray-600">
            Stay updated with important announcements from your mentor
          </p>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-l-4 border-red-500 bg-red-50">
            <div className="flex gap-3 items-start">
              <AlertCircle className="text-red-600 mt-1" size={20} />
              <div>
                <p className="font-semibold text-red-800">Error</p>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All ({announcements.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <EmptyState
              heading="No announcements"
              subtext={
                filter === 'unread'
                  ? 'You have read all announcements!'
                  : 'No announcements yet. Check back later!'
              }
              icon={BookOpen}
            />
          ) : (
            filteredAnnouncements.map(announcement => (
              <Card
                key={announcement._id}
                className={`p-5 border-l-4 transition-all ${
                  announcement.isRead
                    ? 'border-l-gray-300 bg-white'
                    : 'border-l-blue-600 bg-blue-50'
                } ${announcement.isPinned ? 'ring-2 ring-yellow-300' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Title with badges */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {announcement.title}
                      </h3>
                      {announcement.isPinned && (
                        <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-medium rounded">
                          📌 Pinned
                        </span>
                      )}
                      {!announcement.isRead && (
                        <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs font-medium rounded">
                          New
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                      {announcement.content}
                    </p>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock size={16} />
                        <span>
                          {new Date(announcement.createdAt).toLocaleDateString(
                            undefined,
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }
                          )}
                        </span>
                      </div>
                      {announcement.createdBy && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">From:</span>
                          <span>{announcement.createdBy.displayName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  {!announcement.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(announcement._id)}
                      className="flex-shrink-0 mt-1 p-2 hover:bg-blue-200 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <CheckCircle2 size={24} className="text-blue-600" />
                    </button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <Button
            onClick={fetchAnnouncements}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>
    </div>
  );
}
