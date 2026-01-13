import React, { useState } from 'react';
import { Plus, Settings, X, MessageSquare, Trash2, Search, Menu } from 'lucide-react';

interface Chat {
  id: string;
  title: string;
  timestamp: Date;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const [activeChat, setActiveChat] = useState<string>('1');
  const [chats, setChats] = useState<Chat[]>([
    { id: '1', title: 'Vendor Cost Analysis', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { id: '2', title: 'Plant Performance Report', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) },
    { id: '3', title: 'Material Supply Chain', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { id: '4', title: 'Delivery Time Analysis', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { id: '5', title: 'Cost Trends Q4 2025', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  ]);

  const [hoveredChat, setHoveredChat] = useState<string | null>(null);

  // Colors
  const COLORS = {
    sidebarBg: '#24252D',
    highlight: '#A689FF',
    active: '#8D74DA',
    text: '#FFFFFF',
  };

  const COLLAPSED_WIDTH = '70px';
  const EXPANDED_WIDTH = '300px';

  // Group chats by date
  const groupChatsByDate = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const groups: { [key: string]: Chat[] } = {
      Today: [],
      Yesterday: [],
      'Last 7 Days': [],
      'Last 30 Days': [],
      Older: [],
    };

    chats.forEach((chat) => {
      const chatDate = new Date(chat.timestamp);
      if (chatDate >= today) {
        groups.Today.push(chat);
      } else if (chatDate >= yesterday) {
        groups.Yesterday.push(chat);
      } else if (chatDate >= lastWeek) {
        groups['Last 7 Days'].push(chat);
      } else if (chatDate >= lastMonth) {
        groups['Last 30 Days'].push(chat);
      } else {
        groups.Older.push(chat);
      }
    });

    return groups;
  };

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      timestamp: new Date(),
    };
    setChats([newChat, ...chats]);
    setActiveChat(newChat.id);
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setChats(chats.filter((chat) => chat.id !== chatId));
    if (activeChat === chatId) {
      setActiveChat(chats[0]?.id || '');
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
      }
    }
    return 'Just now';
  };

  const groupedChats = groupChatsByDate();

  return (
    <>
      {/* Sidebar */}
      <div
        className="fixed top-0 left-0 h-full text-white transition-all duration-300 ease-in-out z-50 flex flex-col"
        style={{ 
          width: isOpen ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
          backgroundColor: COLORS.sidebarBg
        }}
      >
        {/* Collapsed State - Icon Only View */}
        {!isOpen && (
          <div className="flex flex-col items-center py-4 gap-4 h-full">
            {/* Menu Button */}
            <button
              onClick={onToggle}
              className="p-3 rounded-lg transition-colors hover:bg-opacity-20"
              style={{ color: COLORS.highlight }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${COLORS.highlight}33`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Menu size={24} />
            </button>

            {/* New Chat Icon */}
            <button
              onClick={handleNewChat}
              className="p-3 rounded-lg transition-colors"
              style={{ color: COLORS.highlight }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${COLORS.highlight}33`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Plus size={20} />
            </button>

            {/* Search Icon */}
            <button
              className="p-3 rounded-lg transition-colors"
              style={{ color: COLORS.highlight }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${COLORS.highlight}33`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Search size={20} />
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Settings Icon */}
            <button
              className="p-3 rounded-lg transition-colors"
              style={{ color: '#9CA3AF' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${COLORS.highlight}33`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Settings size={20} />
            </button>
          </div>
        )}

        {/* Expanded State - Full View */}
        {isOpen && (
          <>
            {/* Header with Close Button */}
            <div className="p-4 border-b relative" style={{ borderColor: '#374151' }}>
              {/* Close Button - Top Right */}
              <button
                onClick={onToggle}
                className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
                style={{ color: '#9CA3AF' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${COLORS.highlight}33`;
                  e.currentTarget.style.color = COLORS.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#9CA3AF';
                }}
              >
                <X size={20} />
              </button>

              {/* Company Name & Slogan */}
              <div className="text-center pr-8">
                <h1 
                  className="text-xl font-bold tracking-wide mb-2"
                  style={{ 
                    color: COLORS.text,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}
                >
                  ARG Supply Tech
                </h1>
                <div className="flex items-center justify-center gap-2">
                  <div style={{ 
                    width: '30px', 
                    height: '1px', 
                    background: `linear-gradient(to right, transparent, ${COLORS.highlight})` 
                  }} />
                  <p 
                    className="text-xs font-light italic"
                    style={{ 
                      color: COLORS.highlight,
                      letterSpacing: '0.1em'
                    }}
                  >
                    Fueling Growth
                  </p>
                  <div style={{ 
                    width: '30px', 
                    height: '1px', 
                    background: `linear-gradient(to left, transparent, ${COLORS.highlight})` 
                  }} />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-3 space-y-2">
              {/* New Chat Button */}
              <button
                onClick={handleNewChat}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200"
                style={{ 
                  backgroundColor: COLORS.sidebarBg,
                  borderColor: `${COLORS.highlight}50`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${COLORS.highlight}33`;
                  e.currentTarget.style.borderColor = COLORS.highlight;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.sidebarBg;
                  e.currentTarget.style.borderColor = `${COLORS.highlight}50`;
                }}
              >
                <Plus size={16} style={{ color: COLORS.highlight }} />
                <span className="text-sm font-medium" style={{ color: COLORS.text }}>New Chat</span>
              </button>

              {/* Search Chats Button */}
              <button
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200"
                style={{ 
                  backgroundColor: COLORS.sidebarBg,
                  borderColor: `${COLORS.highlight}50`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${COLORS.highlight}33`;
                  e.currentTarget.style.borderColor = COLORS.highlight;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.sidebarBg;
                  e.currentTarget.style.borderColor = `${COLORS.highlight}50`;
                }}
              >
                <Search size={16} style={{ color: COLORS.highlight }} />
                <span className="text-sm font-medium" style={{ color: COLORS.text }}>Search Chats</span>
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 custom-scrollbar">
              {Object.entries(groupedChats).map(
                ([group, groupChats]) =>
                  groupChats.length > 0 && (
                    <div key={group} className="mb-4">
                      <h3 
                        className="text-xs font-semibold uppercase tracking-wider mb-2 px-2"
                        style={{ color: '#9CA3AF' }}
                      >
                        {group}
                      </h3>
                      <div className="space-y-1">
                        {groupChats.map((chat) => (
                          <div
                            key={chat.id}
                            onClick={() => setActiveChat(chat.id)}
                            onMouseEnter={() => setHoveredChat(chat.id)}
                            onMouseLeave={() => setHoveredChat(null)}
                            className="group relative flex items-start gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200"
                            style={{
                              backgroundColor: activeChat === chat.id ? `${COLORS.active}30` : 'transparent',
                              borderRight: activeChat === chat.id ? `4px solid ${COLORS.active}` : 'none',
                            }}
                            onMouseOver={(e) => {
                              if (activeChat !== chat.id) {
                                e.currentTarget.style.backgroundColor = `${COLORS.highlight}1A`;
                              }
                            }}
                            onMouseOut={(e) => {
                              if (activeChat !== chat.id) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            <MessageSquare
                              size={16}
                              className="mt-0.5 flex-shrink-0"
                              style={{ color: activeChat === chat.id ? COLORS.active : '#9CA3AF' }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate" style={{ color: COLORS.text }}>
                                {chat.title}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                                {getTimeAgo(chat.timestamp)}
                              </p>
                            </div>
                            {hoveredChat === chat.id && (
                              <button
                                onClick={(e) => handleDeleteChat(e, chat.id)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded transition-colors"
                                style={{ color: '#9CA3AF' }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#EF444420';
                                  e.currentTarget.style.color = '#EF4444';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.color = '#9CA3AF';
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
              )}
            </div>

            {/* Settings */}
            <div className="p-3 border-t" style={{ borderColor: '#374151' }}>
              <button 
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${COLORS.highlight}1A`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Settings size={18} style={{ color: '#9CA3AF' }} />
                <span className="text-sm font-medium" style={{ color: COLORS.text }}>Settings</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4B5563;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6B7280;
        }
      `}</style>
    </>
  );
};

export default Sidebar;
