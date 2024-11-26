import React, { useState } from 'react';
import axios from 'axios';
import './ChatBox.css'; // Import the CSS file

function ChatBox({ projectId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add the user's message to the chat
    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Send the message to the backend
      const response = await axios.post('http://localhost:4000/chat', {
        projectId, // Include project ID for context
        message: input,
      });

      // Add the assistant's response to the chat
      const botMessage = { role: 'assistant', content: response.data.reply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error interacting with LLM:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'system', content: 'An error occurred. Please try again.' },
      ]);
    }

    setInput(''); // Clear the input
  };

  return (
    <div className="chatbox">
      <h2>Chat</h2>
      <div className="chatbox-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      <div className="chatbox-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default ChatBox;
