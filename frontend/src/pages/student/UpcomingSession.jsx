import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  FileText, 
  MessageSquare,
  AlertCircle,
  Bell,
  Loader2
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import StatusPill from '../../components/ui/StatusPill';
import { getUpcomingSession } from '../../lib/api';
import toast from 'react-hot-toast';

export const UpcomingSession = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await getUpcomingSession();
        setSession(res.session);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={40} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <Card className="text-center py-16">
          <Calendar size={48} className="mx-auto text-fg-tertiary mb-4 opacity-20" />
          <h3 className="text-2xl font-bold text-fg-primary mb-2">No Upcoming Sessions</h3>
          <p className="text-fg-secondary">All caught up! Check back later for your next scheduled workshop.</p>
        </Card>
      </div>
    );
  }

  const formattedDate = new Date(session.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const displayData = {
    date: formattedDate,
    time: session.startTime && session.endTime 
      ? `${session.startTime} - ${session.endTime}` 
      : "Time TBD",
    topic: session.topic,
    mentor: session.mentorId?.displayName || "Your Mentor",
    type: session.sessionType || "Live Workshop",
    location: session.meetingLink || session.location || "TBD",
    description: session.notes || `Prepare for today's session on ${session.topic}. Ensure you have your environment ready.`,
    prep: [
      "Review materials from previous sessions",
      "Ensure stable internet connection",
      "Join 5 minutes early"
    ]
  };

  const handleJoinMeeting = () => {
    const meetingUrl = session.meetingLink || session.meetingUrl;

    if (meetingUrl && /^https?:\/\//i.test(meetingUrl)) {
      window.open(meetingUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    toast('No meeting link is available for this session yet.');
  };

  const handleRemindMe = () => {
    const reminder = {
      sessionId: session._id,
      topic: session.topic,
      date: session.date,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem('forgetrack-upcoming-session-reminder', JSON.stringify(reminder));
    toast.success('Reminder saved locally for this session.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <section>
        <h2 className="font-display text-3xl font-bold text-fg-primary">Upcoming Session</h2>
        <p className="text-fg-secondary text-sm mt-1">Details for your next scheduled learning session.</p>
      </section>

      <Card glow className="relative">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="space-y-6 flex-1">
            <div className="flex items-center gap-3">
              <StatusPill status="info" />
              <span className="text-sm font-mono text-fg-tertiary">{displayData.date}</span>
            </div>
 
            <h1 className="text-4xl font-display font-bold text-fg-primary leading-tight">
              {displayData.topic}
            </h1>
 
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-fg-secondary">
                <Clock size={20} className="text-accent" />
                <span className="text-sm">{displayData.time}</span>
              </div>
              <div className="flex items-center gap-3 text-fg-secondary">
                <MapPin size={20} className="text-accent" />
                <span className="text-sm">{displayData.location}</span>
              </div>
            </div>
 
            <div className="p-6 rounded-2xl bg-surface-inset border border-border-subtle">
              <h4 className="text-xs font-bold text-fg-secondary uppercase tracking-widest mb-3">Description</h4>
              <p className="text-sm text-fg-primary leading-relaxed">
                {displayData.description}
              </p>
            </div>
          </div>
 
          <div className="md:w-64 space-y-6">
            <div className="p-6 rounded-2xl bg-surface-raised border border-border-subtle flex flex-col items-center text-center">
              <span className="text-[10px] font-bold text-fg-tertiary uppercase tracking-widest mb-4">Your Mentor</span>
              <Avatar name={displayData.mentor} size="lg" className="mb-3" />
              <h4 className="font-bold text-fg-primary">{displayData.mentor}</h4>
              <p className="text-xs text-fg-secondary">Lead Instructor</p>
              <button type="button" onClick={() => navigate('/messages')} className="mt-4 text-accent text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-2">
                <MessageSquare size={14} />
                Ask a Question
              </button>
            </div>
            
            <Button variant="primary" className="w-full h-12 shadow-[0_0_20px_rgba(99,102,241,0.3)]" onClick={handleJoinMeeting}>
              <Video size={20} />
              Join Zoom Meeting
            </Button>
            <Button variant="secondary" className="w-full h-12" onClick={handleRemindMe}>
              <Bell size={20} />
              Remind Me
            </Button>
          </div>
        </div>
      </Card>
 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h4 className="text-xs font-bold text-fg-secondary uppercase tracking-widest mb-6 flex items-center gap-2">
            <AlertCircle size={16} className="text-warning" />
            Preparation Required
          </h4>
          <ul className="space-y-4">
            {displayData.prep.map((item, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-fg-secondary leading-normal">
                <div className="w-5 h-5 rounded-full bg-surface-inset border border-border-subtle flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                  {idx + 1}
                </div>
                {item}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h4 className="text-xs font-bold text-fg-secondary uppercase tracking-widest mb-6 flex items-center gap-2">
            <FileText size={16} className="text-accent" />
            Pre-session Resources
          </h4>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText size={28} className="text-fg-tertiary opacity-20 mb-3" />
            <p className="text-sm text-fg-tertiary italic">
              Your mentor will share materials before the session.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UpcomingSession;
