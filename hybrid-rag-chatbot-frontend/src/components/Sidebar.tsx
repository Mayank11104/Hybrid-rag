import React, { useState } from 'react';
import { Plus, Settings, MessageSquare, Trash2, Search, ArrowLeft, Pin } from 'lucide-react';

interface Chat {
  id: string;
  title: string;
  timestamp: Date;
  pinned: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  activeChat: string;
  setActiveChat: React.Dispatch<React.SetStateAction<string>>;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onMouseEnter, 
  onMouseLeave,
  chats,
  setChats,
  activeChat,
  setActiveChat
}) => {
  const [hoveredChat, setHoveredChat] = useState<string | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Colors
  const COLORS = {
    sidebarBg: '#24252D',
    highlight: '#A689FF',
    active: '#8D74DA',
    text: '#FFFFFF',
  };

  const COLLAPSED_WIDTH = '70px';
  const EXPANDED_WIDTH = '300px';

  // Filter chats based on search query
  const filteredChats = searchQuery.trim() 
    ? chats.filter(chat => 
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chats;

  // Separate pinned and unpinned chats
  const pinnedChats = filteredChats.filter(chat => chat.pinned);
  const unpinnedChats = filteredChats.filter(chat => !chat.pinned);

  // Group unpinned chats by date
  const groupChatsByDate = (chatList: Chat[]) => {
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

    chatList.forEach((chat) => {
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
      pinned: false,
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

  const handlePinChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setChats(chats.map(chat => 
      chat.id === chatId ? { ...chat, pinned: !chat.pinned } : chat
    ));
  };

  const handleSearchToggle = () => {
    setIsSearchActive(!isSearchActive);
    if (isSearchActive) {
      setSearchQuery('');
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

  const groupedChats = groupChatsByDate(unpinnedChats);

  const renderChatItem = (chat: Chat) => (
    <div
      key={chat.id}
      onClick={() => setActiveChat(chat.id)}
      onMouseEnter={() => setHoveredChat(chat.id)}
      onMouseLeave={() => setHoveredChat(null)}
      className="group relative flex items-start gap-2 px-2 py-1.5 rounded-lg transition-all duration-200"
      style={{
        backgroundColor: activeChat === chat.id ? `${COLORS.active}30` : 'transparent',
        borderRight: activeChat === chat.id ? `3px solid ${COLORS.active}` : 'none',
        cursor: 'pointer'
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
        size={13}
        className="mt-0.5 flex-shrink-0"
        style={{ color: activeChat === chat.id ? COLORS.active : '#9CA3AF' }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs truncate leading-tight" style={{ color: COLORS.text }}>
          {chat.title}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>
          {getTimeAgo(chat.timestamp)}
        </p>
      </div>
      {hoveredChat === chat.id && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
          {/* Pin Button */}
          <button
            onClick={(e) => handlePinChat(e, chat.id)}
            className="p-1 rounded transition-colors"
            style={{ color: chat.pinned ? COLORS.highlight : '#9CA3AF', cursor: 'pointer' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${COLORS.highlight}30`;
              e.currentTarget.style.color = COLORS.highlight;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = chat.pinned ? COLORS.highlight : '#9CA3AF';
            }}
          >
            <Pin size={12} style={{ transform: chat.pinned ? 'rotate(45deg)' : 'none' }} />
          </button>
          {/* Delete Button */}
          <button
            onClick={(e) => handleDeleteChat(e, chat.id)}
            className="p-1 rounded transition-colors"
            style={{ color: '#9CA3AF', cursor: 'pointer' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#EF444420';
              e.currentTarget.style.color = '#EF4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#9CA3AF';
            }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
      {/* Show pin icon when chat is pinned and not hovered */}
      {chat.pinned && hoveredChat !== chat.id && (
        <Pin 
          size={11} 
          className="absolute right-1.5 top-1/2 -translate-y-1/2" 
          style={{ color: COLORS.highlight, transform: 'rotate(45deg)' }}
        />
      )}
    </div>
  );

  return (
    <>
      {/* Sidebar - Hover to expand */}
      <div
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="fixed top-0 left-0 h-full text-white transition-all duration-300 ease-in-out z-50 flex flex-col"
        style={{ 
          width: isOpen ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
          backgroundColor: COLORS.sidebarBg
        }}
      >
        {/* Collapsed State - Icon Only View */}
        <div 
          className="flex flex-col items-center py-4 gap-4 h-full"
          style={{
            opacity: !isOpen ? 1 : 0,
            visibility: !isOpen ? 'visible' : 'hidden',
            transition: 'opacity 200ms ease-in-out, visibility 200ms',
            transitionDelay: !isOpen ? '100ms' : '0ms'
          }}
        >
          {/* New Chat Icon */}
          <button
            onClick={handleNewChat}
            className="p-3 rounded-lg transition-colors"
            style={{ color: COLORS.highlight, cursor: 'pointer' }}
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
            style={{ color: COLORS.highlight, cursor: 'pointer' }}
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
            style={{ color: '#9CA3AF', cursor: 'pointer' }}
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

        {/* Expanded State - Full View */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            opacity: isOpen ? 1 : 0,
            visibility: isOpen ? 'visible' : 'hidden',
            transition: 'opacity 200ms ease-in-out, visibility 200ms',
            transitionDelay: isOpen ? '100ms' : '0ms'
          }}
        >
          {/* Header */}
          <div className="p-4 border-b relative" style={{ borderColor: '#374151' }}>
            <div className="text-center">
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

          {/* Action Buttons or Search Input */}
          <div className="p-3">
            {!isSearchActive ? (
              <div className="space-y-2">
                {/* New Chat Button */}
                <button
                  onClick={handleNewChat}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200"
                  style={{ 
                    backgroundColor: COLORS.sidebarBg,
                    borderColor: `${COLORS.highlight}50`,
                    cursor: 'pointer'
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
                  onClick={handleSearchToggle}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200"
                  style={{ 
                    backgroundColor: COLORS.sidebarBg,
                    borderColor: `${COLORS.highlight}50`,
                    cursor: 'pointer'
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
            ) : (
              // Active Search Input
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSearchToggle}
                  className="p-2 rounded-lg transition-colors flex-shrink-0"
                  style={{ color: '#9CA3AF', cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${COLORS.highlight}33`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <ArrowLeft size={18} />
                </button>
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{
                    backgroundColor: `${COLORS.highlight}10`,
                    borderColor: COLORS.highlight,
                    color: COLORS.text,
                  }}
                />
              </div>
            )}
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto px-3 pb-3 custom-scrollbar">
            {chats.length === 0 ? (
              <div className="text-center py-8" style={{ color: '#6B7280' }}>
                <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs">No chats yet</p>
              </div>
            ) : searchQuery && filteredChats.length === 0 ? (
              <div className="text-center py-8" style={{ color: '#6B7280' }}>
                <Search size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No chats found</p>
              </div>
            ) : (
              <>
                {/* Pinned Chats Section */}
                {pinnedChats.length > 0 && (
                  <div className="mb-3">
                    <h3 
                      className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 px-2 flex items-center gap-1.5"
                      style={{ color: COLORS.highlight }}
                    >
                      <Pin size={10} style={{ transform: 'rotate(45deg)' }} />
                      Pinned
                    </h3>
                    <div className="space-y-0.5">
                      {pinnedChats.map(chat => renderChatItem(chat))}
                    </div>
                  </div>
                )}

                {/* Regular Chats Grouped by Date */}
                {Object.entries(groupedChats).map(
                  ([group, groupChats]) =>
                    groupChats.length > 0 && (
                      <div key={group} className="mb-3">
                        <h3 
                          className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 px-2"
                          style={{ color: '#9CA3AF' }}
                        >
                          {group}
                        </h3>
                        <div className="space-y-0.5">
                          {groupChats.map(chat => renderChatItem(chat))}
                        </div>
                      </div>
                    )
                )}
              </>
            )}
          </div>

          {/* Settings */}
          <div className="p-3 border-t" style={{ borderColor: '#374151' }}>
            <button 
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200"
              style={{ cursor: 'pointer' }}
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
        </div>
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
