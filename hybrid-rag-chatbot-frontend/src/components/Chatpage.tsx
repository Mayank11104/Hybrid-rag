// frontend/src/components/Chatpage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Plus } from 'lucide-react';
import Buttons from './Buttons';
import FileUploadModal from './FileUploadModal';


interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}


interface ChatpageProps {
  activeChatId: string;
  messages: Message[];
  onFirstMessage: (chatId: string, firstPrompt: string) => Promise<void>;
  onSendMessage: (chatId: string, message: string) => Promise<void>;
  onCreateNewChat: (chatId: string) => Promise<void>;
  onAddMessageLocally: (chatId: string, message: Message) => void;
  loading: boolean;
}


const Chatpage: React.FC<ChatpageProps> = ({ 
  activeChatId, 
  messages,
  onFirstMessage,
  onSendMessage,
  onCreateNewChat,
  onAddMessageLocally,
  loading
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'purchase' | 'hr' | 'finance'>('purchase');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);


  const COLORS = {
    chatBg: '#F4F7FC',
    userBubble: '#C9E5FC',
    botBubble: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    inputBorder: '#E5E7EB',
    sendButton: '#A689FF',
  };


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const handleTabSelect = (key: 'purchase' | 'hr' | 'finance') => {
    console.log('🔘 Selected tab:', key);
    setSelectedTab(key);
  };


  const handleOpenUploadModal = () => {
    setIsUploadModalOpen(true);
  };


  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || loading || isSending) return;


    const messageContent = inputValue.trim();
    setInputValue('');
    setIsSending(true);


    try {
      let chatId = activeChatId;


      if (!chatId) {
        chatId = Date.now().toString();
        console.log('🆕 No active chat, creating new:', chatId);
        await onCreateNewChat(chatId);
        await new Promise(resolve => setTimeout(resolve, 100));
      }


      const userMsg: Message = {
        id: `msg_${Date.now()}`,
        type: 'user',
        content: messageContent,
        timestamp: new Date(),
      };
      console.log('➕ Adding user message to UI:', messageContent);
      onAddMessageLocally(chatId, userMsg);


      const isFirstMessage = messages.length === 0;
      if (isFirstMessage) {
        console.log('✏️ First message, updating chat title');
        await onFirstMessage(chatId, messageContent);
      }


      console.log('📤 Sending message to backend');
      await onSendMessage(chatId, messageContent);
      
      console.log('✅ Message flow completed successfully');
      
    } catch (error) {
      console.error('❌ Error in message flow:', error);
    } finally {
      setIsSending(false);
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };


  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };


  const isChatEmpty = messages.length === 0;
  const isDisabled = loading || isSending;


  return (
    <div
      style={{
        width: '100%',
        height: 'calc(100vh)',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        padding: '10px',
      }}
    >
      {/* File Upload Modal */}
      <FileUploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        defaultCategory={selectedTab}
      />

      {/* BUTTONS SECTION */}
      <div
        style={{
          width: '100%',
          padding: '8px 0 12px 0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div style={{ maxWidth: '700px', width: '100%' }}>
          <Buttons onSelect={handleTabSelect} />
        </div>
      </div>

      {/* EXISTING CHAT AREA */}
      <div
        style={{
          flex: 1,
          backgroundColor: COLORS.chatBg,
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        }}
      >
        {isChatEmpty ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 20px',
            }}
          >
            <h1
              style={{
                fontSize: '28px',
                fontWeight: '600',
                color: COLORS.text,
                marginBottom: '16px',
                textAlign: 'center',
              }}
            >
              Welcome to ARG Supply Tech Assistant
            </h1>

            <p
              style={{
                fontSize: '15px',
                color: COLORS.textSecondary,
                marginBottom: '40px',
                textAlign: 'center',
                maxWidth: '600px',
                lineHeight: '1.6',
              }}
            >
              Upload your supply chain Excel file to begin. I'll analyze your data and answer questions about inventory, costs, procurement, and more.
            </p>

            <div
              style={{
                width: '100%',
                maxWidth: '700px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: '#FFFFFF',
                padding: '12px 16px',
                borderRadius: '24px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              }}
            >
              <button
                onClick={handleOpenUploadModal}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Plus size={20} style={{ color: COLORS.textSecondary }} />
              </button>

              <input
                ref={inputRef}
                type="text"
                placeholder="Ask anything"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isDisabled}
                autoFocus
                style={{
                  flex: 1,
                  padding: '8px 0',
                  border: 'none',
                  fontSize: '15px',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  color: COLORS.text,
                }}
              />

              {inputValue.trim() && (
                <button
                  onClick={handleSendMessage}
                  disabled={isDisabled}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: isDisabled ? '#D1D5DB' : COLORS.sendButton,
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '16px',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isDisabled) {
                      e.currentTarget.style.backgroundColor = '#8D74DA';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDisabled) {
                      e.currentTarget.style.backgroundColor = COLORS.sendButton;
                    }
                  }}
                >
                  <Send size={16} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Messages Area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
              className="custom-scrollbar"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: message.type === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: message.type === 'user' ? COLORS.userBubble : COLORS.botBubble,
                        color: COLORS.text,
                        padding: '12px 16px',
                        borderRadius: '16px',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        wordWrap: 'break-word',
                      }}
                    >
                      {message.content}
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        color: COLORS.textSecondary,
                        marginTop: '4px',
                        paddingLeft: message.type === 'user' ? '0' : '4px',
                        paddingRight: message.type === 'user' ? '4px' : '0',
                      }}
                    >
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
              
              {/* Loading Indicator */}
              {(loading || isSending) && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      backgroundColor: COLORS.botBubble,
                      padding: '12px 16px',
                      borderRadius: '16px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div
              style={{
                padding: '16px 20px',
                borderTop: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
                borderBottomLeftRadius: '20px',
                borderBottomRightRadius: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <button
                  onClick={handleOpenUploadModal}
                  style={{
                    padding: '10px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Paperclip size={20} style={{ color: COLORS.textSecondary }} />
                </button>

                <input
                  type="text"
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isDisabled}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: `1px solid ${COLORS.inputBorder}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    backgroundColor: COLORS.chatBg,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = COLORS.sendButton;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = COLORS.inputBorder;
                  }}
                />

                <button
                  onClick={handleSendMessage}
                  disabled={inputValue.trim() === '' || isDisabled}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: (inputValue.trim() && !isDisabled) ? COLORS.sendButton : '#D1D5DB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: (inputValue.trim() && !isDisabled) ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (inputValue.trim() && !isDisabled) {
                      e.currentTarget.style.backgroundColor = '#8D74DA';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (inputValue.trim() && !isDisabled) {
                      e.currentTarget.style.backgroundColor = COLORS.sendButton;
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  <Send size={16} />
                  {isDisabled ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #D1D5DB;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9CA3AF;
        }
        
        /* Typing Indicator */
        .typing-indicator {
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .typing-indicator span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #A689FF;
          animation: typing 1.4s infinite;
        }
        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes typing {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
};


export default Chatpage;
