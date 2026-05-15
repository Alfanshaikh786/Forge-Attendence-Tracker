import React, { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  FileText, 
  Link as LinkIcon, 
  Video, 
  ExternalLink,
  ChevronDown,
  Filter,
  Loader2,
  X,
  Trash2
} from 'lucide-react';
import { clsx } from 'clsx';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import { getMaterials, getStudentMaterials, addMaterial, removeMaterial, getSessionByDate } from '../../lib/api';
import toast from 'react-hot-toast';

export const MaterialsLibrary = ({ role = 'student' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    sessionDate: new Date().toISOString().split('T')[0],
    title: '',
    type: 'pdf',
    url: '',
    description: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = role === 'mentor' ? await getMaterials() : await getStudentMaterials();
      setMaterials(res.materials);
    } catch (error) {
      toast.error('Failed to load materials');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchData();
  }, [role]);

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    try {
      const { session } = await getSessionByDate(newMaterial.sessionDate);
      await addMaterial({
        sessionId: session._id,
        title: newMaterial.title,
        type: newMaterial.type,
        url: newMaterial.url,
        description: newMaterial.description
      });
      toast.success('Material added successfully');
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to add material. Ensure session exists for this date.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    try {
      await removeMaterial(id);
      toast.success('Material removed');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  // Group materials by session
  const grouped = materials.reduce((acc, m) => {
    const sessionId = m.sessionId?._id || 'unknown';
    if (!acc[sessionId]) {
      acc[sessionId] = {
        topic: m.sessionId?.topic || 'General',
        date: m.sessionId?.date ? new Date(m.sessionId.date).toLocaleDateString() : 'N/A',
        items: []
      };
    }
    acc[sessionId].items.push(m);
    return acc;
  }, {});

  const filteredSessions = Object.entries(grouped).filter(([_, data]) => 
    data.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIcon = (type) => {
    switch (type) {
      case 'pdf': return FileText;
      case 'video': return Video;
      case 'link': return LinkIcon;
      default: return FileText;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="font-display text-3xl font-bold text-fg-primary">Materials Library</h2>
          <p className="text-fg-secondary text-sm mt-1">Access slides, recordings, and reference notes from all sessions.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary" />
            <input 
              type="text"
              placeholder="Search topics..."
              className="w-full bg-surface-inset border border-border-default rounded-md pl-10 pr-4 py-2.5 text-sm text-fg-primary focus:border-accent outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            {role === 'mentor' && (
              <Button variant="primary" className="flex-1 sm:flex-none" onClick={() => setShowAddModal(true)}>
                <Plus size={18} />
                Add Material
              </Button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin text-accent" size={32} />
        </div>
      ) : filteredSessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map(([sessionId, session]) => (
            <Card key={sessionId} hover className="flex flex-col h-full group">
              <div className="mb-4">
                <span className="text-[10px] font-mono text-fg-tertiary uppercase tracking-[0.15em] font-bold">
                  {session.date}
                </span>
                <h3 className="text-lg font-bold text-fg-primary mt-1 leading-tight group-hover:text-accent transition-colors">
                  {session.topic}
                </h3>
              </div>

              <div className="w-full h-px bg-border-subtle my-4" />

              <div className="space-y-1 flex-1">
                {session.items.map((item) => {
                  const Icon = getIcon(item.type);
                  return (
                    <div key={item._id} className="group/item flex flex-col">
                      <div className="flex items-center justify-between p-2 rounded-md hover:bg-surface-raised transition-all">
                        <a 
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 flex-1"
                        >
                          <div className="p-1.5 bg-surface-inset rounded-md text-accent border border-border-subtle group-hover/item:bg-accent/10 transition-colors">
                            <Icon size={16} strokeWidth={2} />
                          </div>
                          <span className="text-sm font-medium text-fg-secondary group-hover/item:text-fg-primary transition-colors">
                            {item.title}
                          </span>
                        </a>
                        <div className="flex items-center gap-2">
                          <ExternalLink size={14} className="text-fg-tertiary opacity-0 group-hover/item:opacity-100 transition-opacity" />
                          {role === 'mentor' && (
                            <button onClick={() => handleDelete(item._id)} className="text-danger/50 hover:text-danger opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      {item.description && (
                        <p className="text-[10px] text-fg-tertiary pl-11 mb-2 pr-2">{item.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={BookOpen}
          heading="No Materials Found"
          subtext={searchQuery ? `No results for "${searchQuery}". Try a different search term.` : "There are no materials uploaded yet. Check back later."}
          action={role === 'mentor' && (
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} />
              Upload First Material
            </Button>
          )}
        />
      )}

      {/* Add Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-md">
          <Card className="w-full max-w-md animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add New Material</h3>
              <button onClick={() => setShowAddModal(false)} className="text-fg-tertiary hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddMaterial} className="space-y-4">
              <Input 
                label="Session Date" 
                type="date" 
                value={newMaterial.sessionDate}
                onChange={e => setNewMaterial({...newMaterial, sessionDate: e.target.value})}
                required
              />
              <Input 
                label="Title" 
                placeholder="e.g. Session Slides"
                value={newMaterial.title}
                onChange={e => setNewMaterial({...newMaterial, title: e.target.value})}
                required
              />
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-fg-tertiary uppercase tracking-widest">Type</label>
                <select 
                  className="w-full bg-surface-inset border border-border-default rounded-md px-3 py-2 text-sm text-fg-primary focus:border-accent outline-none"
                  value={newMaterial.type}
                  onChange={e => setNewMaterial({...newMaterial, type: e.target.value})}
                >
                  <option value="pdf">PDF / Slides</option>
                  <option value="video">Video Recording</option>
                  <option value="link">External Link</option>
                </select>
              </div>
              <Input 
                label="URL" 
                placeholder="https://..."
                value={newMaterial.url}
                onChange={e => setNewMaterial({...newMaterial, url: e.target.value})}
                required
              />
              <Input 
                label="Description (Optional)" 
                placeholder="Quick summary of the material"
                value={newMaterial.description}
                onChange={e => setNewMaterial({...newMaterial, description: e.target.value})}
              />
              
              <div className="pt-4 flex gap-3">
                <Button variant="secondary" className="flex-1" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button variant="primary" className="flex-1" type="submit">Add Material</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MaterialsLibrary;
