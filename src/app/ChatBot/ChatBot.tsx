import * as React from 'react';
import './ChatBot.css';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const ChatBot: React.FunctionComponent = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m Claude, your AI assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const simulateResponse = (userMessage: string) => {
    setIsTyping(true);

    // Simulate API call delay
    setTimeout(() => {
      const responses = [
        'I can help you with that! What specific aspect would you like to know more about?',
        'That\'s a great question! Let me provide you with some information.',
        'I understand. Here\'s what I can tell you about that.',
        'Interesting! I\'d be happy to assist you with this.',
        'Let me help you navigate through this. What would you like to do?',
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      const botMessage: Message = {
        id: Date.now().toString(),
        text: randomResponse,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleSend = () => {
    if (inputValue.trim()) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: inputValue,
        sender: 'user',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');

      // Simulate bot response
      simulateResponse(inputValue);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Bubble */}
      <button className="chat-bubble" onClick={handleToggle} aria-label="Open chat">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12C2 13.93 2.61 15.73 3.64 17.2L2.05 21.95C1.98 22.18 2.04 22.42 2.21 22.59C2.32 22.7 2.46 22.76 2.61 22.76C2.68 22.76 2.75 22.75 2.82 22.72L7.57 21.13C9.04 22.16 10.84 22.77 12.77 22.77C18.29 22.77 22.77 18.29 22.77 12.77C22.77 6.48 18.29 2 12 2ZM12 20C10.38 20 8.86 19.5 7.57 18.64L7.28 18.46L4.42 19.35L5.31 16.49L5.13 16.2C4.27 14.91 3.77 13.39 3.77 11.77C3.77 7.55 7.28 4.04 11.5 4.04C15.72 4.04 19.23 7.55 19.23 11.77C19.23 16.45 16.45 20 12 20Z"
            fill="white"
          />
          <circle cx="8" cy="12" r="1" fill="white" />
          <circle cx="12" cy="12" r="1" fill="white" />
          <circle cx="16" cy="12" r="1" fill="white" />
        </svg>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-content">
              <div className="chat-avatar">C</div>
              <div>
                <div className="chat-title">Claude AI</div>
                <div className="chat-status">Online</div>
              </div>
            </div>
            <button className="chat-close" onClick={handleToggle} aria-label="Close chat">
              ×
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
              >
                <div className="message-content">{message.text}</div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-message bot-message">
                <div className="message-content typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button className="chat-send" onClick={handleSend} disabled={!inputValue.trim()}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export { ChatBot };
