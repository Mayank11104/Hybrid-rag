import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Plus } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface ChatpageProps {
  onNewChatCreated: (firstPrompt: string) => void;
}

const Chatpage: React.FC<ChatpageProps> = ({ onNewChatCreated }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const COLORS = {
    chatBg: '#F4F7FC',
    userBubble: '#C9E5FC',
    botBubble: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    inputBorder: '#E5E7EB',
    sendButton: '#A689FF',
  };

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;

    // If first message, create chat in sidebar
    if (isFirstMessage) {
      onNewChatCreated(inputValue.trim());
      setIsFirstMessage(false);
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputValue('');

    // Simulate bot response (replace with actual API call later)
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'I received your message: "' + inputValue + '". This is a sample response. Once connected to the backend, I\'ll provide real analytics from your Excel/CSV data.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
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

  // Check if chat is empty
  const isChatEmpty = messages.length === 0;

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        padding: '10px',
      }}
    >
      {/* Chat Window Container */}
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
        {/* Conditional Rendering: Empty State or Chat Messages */}
        {isChatEmpty ? (
          // EMPTY STATE - Welcome View
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
            {/* Welcome Message */}
            <h1
              style={{
                fontSize: '32px',
                fontWeight: '500',
                color: COLORS.text,
                marginBottom: '40px',
                textAlign: 'center',
              }}
            >
              Ready when you are.
            </h1>

            {/* Centered Input Box */}
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
              {/* Plus Icon */}
              <button
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

              {/* Input Field */}
              <input
                type="text"
                placeholder="Ask anything"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
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

              {/* Send Button (appears when typing) */}
              {inputValue.trim() && (
                <button
                  onClick={handleSendMessage}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: COLORS.sendButton,
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#8D74DA';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.sendButton;
                  }}
                >
                  <Send size={16} />
                </button>
              )}
            </div>

            {/* Helper Text */}
            <p
              style={{
                fontSize: '13px',
                color: COLORS.textSecondary,
                marginTop: '24px',
                textAlign: 'center',
              }}
            >
              Upload Excel/CSV files and ask questions about your supply chain data
            </p>
          </div>
        ) : (
          // CHAT STATE - Normal Messages View
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
                    {/* Message Bubble */}
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

                    {/* Timestamp */}
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
                {/* File Attach Button */}
                <button
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

                {/* Text Input */}
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
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

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={inputValue.trim() === ''}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: inputValue.trim() ? COLORS.sendButton : '#D1D5DB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (inputValue.trim()) {
                      e.currentTarget.style.backgroundColor = '#8D74DA';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (inputValue.trim()) {
                      e.currentTarget.style.backgroundColor = COLORS.sendButton;
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  <Send size={16} />
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Custom Scrollbar Styles */}
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
      `}</style>
    </div>
  );
};

export default Chatpage;
