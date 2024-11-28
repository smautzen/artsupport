import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import './ChatBox.css';

// Forward ref to expose methods
const ChatBox = forwardRef(({ projectId }, ref) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedNodes, setSelectedNodes] = useState([]); // Internal state for selected nodes
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
      // Construct the payload with selectedNodes
      const payload = {
        projectId,
        message: input,
        nodeReferences: selectedNodes.map((node) => ({
          id: node.id,
          title: node.title,
        })),
      };

      console.log('Payload sent to server:', payload); // Debug

      // Send the message
      await axios.post('http://localhost:4000/chat', payload);

      setInput(''); // Clear the input field
      setSelectedNodes([]); // Clear selected nodes
    } catch (error) {
      console.error('Error sending message to server:', error);
    }
  };

  const addNode = (node) => {
    setSelectedNodes((prevNodes) => {
      const isAlreadySelected = prevNodes.some((n) => n.id === node.id);
      if (!isAlreadySelected) {
        return [...prevNodes, node]; // Add the node if not already selected
      }
      return prevNodes;
    });
  };

  const removeNode = (nodeId) => {
    setSelectedNodes((prevNodes) => prevNodes.filter((node) => node.id !== nodeId));
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    addNode,
  }));

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
            {selectedNodes.map((node) => (
              <div key={node.id} className="node-item">
                <div className="node-name">{node.title}</div>
                <div className="node-delete">
                  <button onClick={() => removeNode(node.id)}>Delete</button>
                </div>
              </div>
            ))}
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
});

export default ChatBox;
