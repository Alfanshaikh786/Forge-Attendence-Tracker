import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getConversations,
  getMessages,
  sendMessage,
  startConversation,
  markConversationAsRead,
  getMentorList,
  getStudentList
} from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { MessageSquare, Send, Search, Plus, X, Clock } from 'lucide-react';

export default function Messaging() {
  const { auth } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [participantList, setParticipantList] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesFetchRef = useRef(null);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
      messagesFetchRef.current = setInterval(fetchMessages, 15000); // Refresh messages every 15 seconds
      return () => {
        if (messagesFetchRef.current) clearInterval(messagesFetchRef.current);
      };
    }
  }, [selectedConversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedConversation) return;
    try {
      const data = await getMessages(selectedConversation._id, 1, 50);
      setMessages(data.messages || []);
      
      // Mark as read
      try {
        await markConversationAsRead(selectedConversation._id);
      } catch (err) {
        console.error('Error marking as read:', err);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    const messageToSend = messageText.trim();
    setMessageText('');
    setSendingMessage(true);

    try {
      await sendMessage(selectedConversation._id, messageToSend);
      await fetchMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      setMessageText(messageToSend); // Restore message on error
    } finally {
      setSendingMessage(false);
    }
  };

  const handleStartConversation = async (participantId) => {
    try {
      const data = await startConversation(participantId);
      setSelectedConversation(data.conversation);
      setShowNewConversation(false);
      setSelectedParticipant(null);
      await fetchConversations();
    } catch (err) {
      console.error('Error starting conversation:', err);
    }
  };

  const loadParticipantList = async () => {
    try {
      const data = auth?.user?.role === 'student'
        ? await getMentorList()
        : await getStudentList();
      setParticipantList(data.participants || data.students || []);
    } catch (err) {
      console.error('Error loading participant list:', err);
    }
  };

  useEffect(() => {
    if (showNewConversation) {
      loadParticipantList();
    }
  }, [showNewConversation]);

  const unreadCount = conversations.filter(
    conv => conv.unreadCounts && conv.unreadCounts[auth?.user?._id]
  ).length;

  const filteredConversations = conversations.filter(conv => {
    const participants = conv.participantIds.filter(p => p._id !== auth?.user?._id);
    const names = participants.map(p => p.displayName || p.email).join(', ');
    return names.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare size={32} className="text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
              <p className="text-sm text-gray-600">
                {unreadCount > 0 && `${unreadCount} unread conversation${unreadCount !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowNewConversation(!showNewConversation)}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            {showNewConversation ? 'Cancel' : 'New Message'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className="lg:col-span-1 h-fit">
            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="ml-2 p-2 text-gray-500 hover:bg-gray-100 rounded">
                  <Search size={18} />
                </button>
              </div>
            </div>

            {/* New Conversation Form */}
            {showNewConversation && (
              <div className="p-4 border-b border-gray-200 bg-blue-50">
                <h3 className="font-semibold text-sm mb-3">Start a new conversation</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {participantList.length === 0 ? (
                    <p className="text-sm text-gray-600">No participants available</p>
                  ) : (
                    participantList.map(participant => (
                      <button
                        key={participant._id}
                        onClick={() => handleStartConversation(participant._id)}
                        className="w-full text-left px-3 py-2 hover:bg-white rounded transition-colors text-sm"
                      >
                        {participant.displayName || participant.email}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Conversations List */}
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center">
                  <MessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-600">
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </p>
                </div>
              ) : (
                filteredConversations.map(conversation => {
                  const otherParticipants = conversation.participantIds.filter(
                    p => p._id !== auth?.user?._id
                  );
                  const isUnread =
                    conversation.unreadCounts &&
                    conversation.unreadCounts[auth?.user?._id] > 0;

                  return (
                    <button
                      key={conversation._id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`w-full text-left p-4 transition-colors ${
                        selectedConversation?._id === conversation._id
                          ? 'bg-blue-100 border-l-4 border-blue-600'
                          : isUnread
                          ? 'bg-blue-50 hover:bg-blue-100'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className={`font-medium truncate ${isUnread ? 'text-blue-900' : 'text-gray-900'}`}>
                            {otherParticipants.map(p => p.displayName).join(', ')}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {conversation.lastMessage || 'No messages yet'}
                          </p>
                        </div>
                        {isUnread && (
                          <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Refresh Button */}
            <div className="p-4 border-t border-gray-200">
              <Button
                onClick={fetchConversations}
                disabled={loading}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </Card>

          {/* Messages Area */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Message Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {selectedConversation.participantIds
                        .filter(p => p._id !== auth?.user?._id)
                        .map(p => p.displayName)
                        .join(', ')}
                    </h2>
                  </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: '400px' }}>
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageSquare size={48} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-gray-600">No messages yet. Start the conversation!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const isOwn = message.senderId._id === auth?.user?._id;
                      return (
                        <div key={index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-xs px-4 py-2 rounded-lg ${
                              isOwn
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm break-words">{message.content}</p>
                            <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-600'}`}>
                              {new Date(message.createdAt).toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message..."
                      disabled={sendingMessage}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                    <Button
                      type="submit"
                      disabled={sendingMessage || !messageText.trim()}
                      className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Send size={18} />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <EmptyState
                  heading="No conversation selected"
                  subtext="Select a conversation or start a new one to begin messaging"
                  icon={MessageSquare}
                />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
