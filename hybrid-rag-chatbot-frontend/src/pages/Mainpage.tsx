// frontend/src/pages/Mainpage.tsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Chatpage from '../components/Chatpage';
import * as api from '../services/api';

interface Chat {
  id: string;
  title: string;
  timestamp: Date;
  pinned: boolean;
}

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const Mainpage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<{ [chatId: string]: Message[] }>({});
  const [loading, setLoading] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);

  // Load chats on mount
  useEffect(() => {
    loadChatsFromBackend();
  }, []);

  // Load chats from backend
  const loadChatsFromBackend = async () => {
    try {
      setIsLoadingChats(true);
      console.log('📥 Loading chats from backend...');
      
      const response = await api.getAllChats();
      console.log('✅ Loaded chats:', response);
      
      if (response && response.length > 0) {
        const loadedChats = response.map((chat: any) => ({
          id: chat.id,
          title: chat.title,
          timestamp: new Date(chat.created_at),
          pinned: chat.pinned || false,
        }));
        
        // Sort: pinned first, then by timestamp
        loadedChats.sort((a: Chat, b: Chat) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return b.timestamp.getTime() - a.timestamp.getTime();
        });
        
        setChats(loadedChats);
        
        // Auto-load the most recent chat
        const mostRecentChat = loadedChats[0];
        if (mostRecentChat) {
          console.log('🔄 Auto-loading most recent chat:', mostRecentChat.id);
          setActiveChat(mostRecentChat.id);
          await loadChatMessages(mostRecentChat.id);
        }
      }
      
      setIsLoadingChats(false);
    } catch (error) {
      console.error('❌ Failed to load chats:', error);
      setIsLoadingChats(false);
    }
  };

  // Load messages for a specific chat
  const loadChatMessages = async (chatId: string) => {
    // Don't reload if already loaded
    if (chatMessages[chatId] && chatMessages[chatId].length > 0) {
      console.log('✓ Messages already loaded for chat:', chatId);
      return;
    }

    try {
      console.log('📥 Loading messages for chat:', chatId);
      const response = await api.getChatMessages(chatId);
      console.log('✅ Loaded messages:', response);
      
      if (response && response.length > 0) {
        const messages = response.map((msg: any) => ({
          id: msg.id,
          type: msg.type,
          content: msg.content,
          timestamp: new Date(msg.created_at),
        }));
        
        setChatMessages(prev => ({ ...prev, [chatId]: messages }));
      } else {
        // Initialize empty array if no messages
        setChatMessages(prev => ({ ...prev, [chatId]: [] }));
      }
    } catch (error) {
      console.error('❌ Failed to load messages:', error);
      setChatMessages(prev => ({ ...prev, [chatId]: [] }));
    }
  };

  // Handle new chat creation (called from Chatpage or Sidebar)
  const handleCreateNewChat = async (chatId: string): Promise<void> => {
    try {
      console.log('🆕 Creating new chat:', chatId);
      
      // Check if chat already exists
      const existingChat = chats.find(c => c.id === chatId);
      if (existingChat) {
        console.log('✓ Chat already exists, setting active:', chatId);
        setActiveChat(chatId);
        
        // ✅ FIX: Initialize messages if not already done
        if (!chatMessages[chatId]) {
          setChatMessages(prev => ({ ...prev, [chatId]: [] }));
        }
        
        return;
      }

      // Create chat in backend FIRST
      await api.createChat(chatId, 'New Chat', false);
      console.log('✅ Chat created in backend:', chatId);
      
      // Add to local state
      const newChat: Chat = {
        id: chatId,
        title: 'New Chat',
        timestamp: new Date(),
        pinned: false,
      };
      
      setChats(prev => [newChat, ...prev]);
      setActiveChat(chatId);
      
      // Initialize empty messages array
      setChatMessages(prev => ({ ...prev, [chatId]: [] }));
      
      console.log('✅ Chat added to local state:', chatId);
    } catch (error) {
      console.error('❌ Failed to create chat:', error);
      throw error;
    }
  };

  // Handle first message (rename chat)
  const handleFirstMessage = async (chatId: string, firstPrompt: string): Promise<void> => {
    try {
      console.log('✏️ Updating chat title:', chatId, firstPrompt);
      
      // Truncate title if too long
      const truncatedTitle = firstPrompt.length > 50 
        ? firstPrompt.substring(0, 50) + '...' 
        : firstPrompt;
      
      // Update backend
      await api.updateChat(chatId, { title: truncatedTitle });
      console.log('✅ Chat title updated in backend:', truncatedTitle);
      
      // Update local state
      setChats(prevChats => prevChats.map(chat => 
        chat.id === chatId ? { ...chat, title: truncatedTitle, timestamp: new Date() } : chat
      ));
      
      console.log('✅ Chat title updated in local state');
    } catch (error) {
      console.error('❌ Failed to update chat title:', error);
    }
  };

  // Handle adding message locally
  const handleAddMessageLocally = (chatId: string, message: Message) => {
    console.log('➕ Adding message locally:', chatId, message.type);
    setChatMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), message]
    }));
  };

  // Handle sending message to backend
  const handleSendMessage = async (chatId: string, userMessage: string): Promise<void> => {
    try {
      setLoading(true);
      console.log('📤 Sending message to backend:', chatId, userMessage);

      // Send to backend and get bot response
      const response = await api.sendMessage(chatId, userMessage);
      console.log('✅ Received bot response:', response);
      
      // Add bot response
      const botMsg: Message = {
        id: response.message_id || `bot_${Date.now()}`,
        type: 'bot',
        content: response.content,
        timestamp: new Date(response.timestamp || new Date()),
      };
      
      handleAddMessageLocally(chatId, botMsg);
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      setLoading(false);
      
      // Show error message
      const errorMsg: Message = {
        id: `error_${Date.now()}`,
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      handleAddMessageLocally(chatId, errorMsg);
      
      throw error;
    }
  };

  // Handle chat deletion
  const handleDeleteChat = async (chatId: string) => {
    try {
      console.log('🗑️ Deleting chat:', chatId);
      await api.deleteChat(chatId);
      
      setChats(chats.filter((chat) => chat.id !== chatId));
      
      // Remove messages for this chat
      setChatMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[chatId];
        return newMessages;
      });
      
      // If the deleted chat was active, reset to default page
      if (activeChat === chatId) {
        setActiveChat('');
      }
      
      console.log('✅ Chat deleted:', chatId);
    } catch (error) {
      console.error('❌ Failed to delete chat:', error);
    }
  };

  // Handle switching to active chat
  const handleSetActiveChat = async (chatId: string) => {
    console.log('🔄 Switching to chat:', chatId);
    setActiveChat(chatId);
    
    // Load messages for this chat
    await loadChatMessages(chatId);
  };

  // Handle updating chat (rename, pin)
  const handleUpdateChat = async (chatId: string, updates: { title?: string; pinned?: boolean }) => {
    try {
      console.log('🔄 Updating chat:', chatId, updates);
      await api.updateChat(chatId, updates);
      
      setChats(prevChats => {
        const updated = prevChats.map(chat => 
          chat.id === chatId ? { ...chat, ...updates } : chat
        );
        
        // Re-sort: pinned first, then by timestamp
        updated.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return b.timestamp.getTime() - a.timestamp.getTime();
        });
        
        return updated;
      });
      
      console.log('✅ Chat updated:', chatId);
    } catch (error) {
      console.error('❌ Failed to update chat:', error);
    }
  };

  // Show loading state
  if (isLoadingChats) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          <p className="mt-4 text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onMouseEnter={() => setIsSidebarOpen(true)}
        onMouseLeave={() => setIsSidebarOpen(false)}
        chats={chats}
        setChats={setChats}
        activeChat={activeChat}
        setActiveChat={handleSetActiveChat}
        onDeleteChat={handleDeleteChat}
        onCreateNewChat={handleCreateNewChat}
        onUpdateChat={handleUpdateChat}
      />

      {/* Main Chat Area */}
      <div
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? 'ml-[300px]' : 'ml-[70px]'
        }`}
      
      >
        <Chatpage 
          activeChatId={activeChat}
          messages={chatMessages[activeChat] || []}
          onFirstMessage={handleFirstMessage}
          onSendMessage={handleSendMessage}
          onCreateNewChat={handleCreateNewChat}
          onAddMessageLocally={handleAddMessageLocally}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default Mainpage;
