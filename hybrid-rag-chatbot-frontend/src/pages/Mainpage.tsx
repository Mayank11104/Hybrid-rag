import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Chatpage from '../components/Chatpage';

interface Chat {
  id: string;
  title: string;
  timestamp: Date;
  pinned: boolean;
}

const Mainpage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Closed by default
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string>('');

  // Handle new chat creation from Chatpage
  const handleNewChatCreated = (firstPrompt: string) => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: firstPrompt,
      timestamp: new Date(),
      pinned: false,
    };
    setChats([newChat, ...chats]);
    setActiveChat(newChat.id);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar with hover functionality */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onMouseEnter={() => setIsSidebarOpen(true)}
        onMouseLeave={() => setIsSidebarOpen(false)}
        chats={chats}
        setChats={setChats}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
      />

      {/* Main Chat Area */}
      <div
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? 'ml-[300px]' : 'ml-[70px]'
        }`}
      >
        <Chatpage onNewChatCreated={handleNewChatCreated} />
      </div>
    </div>
  );
};

export default Mainpage;
