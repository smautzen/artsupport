import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import './ChatBox.css'; // Import the CSS file

function ChatBox({ projectId, selectedNode }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const db = getFirestore();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!projectId) return;

    const chatCollectionRef = collection(db, 'projects', projectId, 'chat');

    const unsubscribe = onSnapshot(chatCollectionRef, (snapshot) => {
      const updatedMessages = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp
            ? data.timestamp.toMillis
              ? data.timestamp.toMillis()
              : new Date(data.timestamp).getTime()
            : 0,
        };
      });
      setMessages(updatedMessages);
    });

    return () => unsubscribe();
  }, [db, projectId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
  
    try {
      // Send the user's message to the server
      await axios.post('http://localhost:4000/chat', {
        projectId,
        message: input,
      });
  
      setInput(''); // Clear the input field after sending
    } catch (error) {
      console.error('Error sending message to server:', error);
    }
  };
  

  return (
    <div className="chatbox">
      <h2>Chat</h2>
      <div className="chatbox-messages">
        {messages
          .sort((a, b) => a.timestamp - b.timestamp)
          .map((msg) => (
            <div key={msg.id} className={`chat-message ${msg.messageType}`}>
              <div className="timestamp">
                {new Date(msg.timestamp).toLocaleString()}
              </div>
              {msg.content}
            </div>
          ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="action-div">
        <div className="nodes-container">
          <div className="nodes-scrollable">
            {selectedNode && <div>{selectedNode.title}</div>} {/* Render clicked node */}
          </div>
        </div>
        <button className="generate-images-btn">Generate images</button>
      </div>

      <div className="chatbox-input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default ChatBox;

