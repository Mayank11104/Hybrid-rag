import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';

const Mainpage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Main Area */}
      <div
        className={`flex-1 bg-white transition-all duration-300 ${
          isSidebarOpen ? 'ml-[300px]' : 'ml-[70px]'
        }`}
      >
        {/* Your main content here */}
      </div>
    </div>
  );
};

export default Mainpage;
