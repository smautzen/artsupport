import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import './ChatBox.css'; // Import the CSS file

function ChatBox({ projectId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const db = getFirestore();

  useEffect(() => {
    if (!projectId) return;

    const chatCollectionRef = collection(db, 'projects', projectId, 'chat');

    // Listen to Firestore for real-time chat updates
    const unsubscribe = onSnapshot(chatCollectionRef, (snapshot) => {
      const updatedMessages = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp ? data.timestamp.toMillis ? data.timestamp.toMillis() : new Date(data.timestamp).getTime() : 0, // Convert timestamp to milliseconds
        };
      });
      setMessages(updatedMessages);
    });

    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, [db, projectId]);

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
          .sort((a, b) => a.timestamp - b.timestamp) // Sort by timestamp
          .map((msg) => (
            <div key={msg.id} className={`chat-message ${msg.messageType}`}>
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
