import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import './ChatBox.css';
import SystemMessage from './SystemMessage';

import chatIcon from '../assets/chat.png';
import helpIcon from '../assets/help.png';

const ChatBox = forwardRef(({ projectId, onNodeDeselect }, ref) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dots, setDots] = useState('');
  const [selectedNodes, setSelectedNodes] = useState([]);
  const db = getFirestore();
  const messagesEndRef = useRef(null);

  // Animate dots when loading
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setDots((prev) => (prev === '...' ? '' : prev + '.'));
      }, 500);
    } else {
      setDots('');
    }

    return () => clearInterval(interval);
  }, [loading]);

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

      const sortedMessages = updatedMessages.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(sortedMessages);

      const latestMessage = sortedMessages[sortedMessages.length - 1];

      if (latestMessage) {
        if (latestMessage.messageType === 'user') {
          setLoading(true);
        } else if (latestMessage.messageType === 'system') {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
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
      setInput('');
      setSelectedNodes([]);
  
      setLoading(true);
  
      const payload = {
        projectId,
        message: input,
        nodeReferences: selectedNodes.map((node) => ({
          id: node.id,
          title: node.title,
        })),
      };
  
      console.log("Payload being sent:", payload);  // Log the payload
  
      const response = await axios.post('http://localhost:4000/chat', payload);
      console.log("Response from server:", response);
  
      // Assuming response.data contains the system's message and suggestions
      const { messageId, suggestions } = response.data;
  
      // If suggestions exist and have nodes, render them
      if (suggestions && suggestions.length > 0) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: messageId,
            messageType: 'system',
            suggestions: suggestions,
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        // Add the system message without suggestions
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: messageId,
            messageType: 'system',
            content: response.data.response,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
  
    } catch (error) {
      console.error("Error while sending message:", error);
      setLoading(false);
    }
  };
  
  

  const sendTestMessage = async () => {
    if (!input.trim()) return;

    try {
      setInput('');
      setSelectedNodes([]);

      setLoading(true);

      const payload = {
        projectId,
        message: input,
        nodeReferences: selectedNodes.map((node) => ({
          id: node.id,
          title: node.title,
        })),
      };

      await axios.post('http://localhost:4000/testchat', payload);
    } catch (error) {
      setLoading(false);
    }
  };

  const addNode = (node) => {
    setSelectedNodes((prevNodes) => {
      const isAlreadySelected = prevNodes.some((n) => n.id === node.id);
      if (!isAlreadySelected) {
        return [...prevNodes, node];
      }
      return prevNodes;
    });
  };

  const removeNode = (nodeId) => {
    setSelectedNodes((prevNodes) => {
      const updatedNodes = prevNodes.filter((node) => node.id !== nodeId);
      if (onNodeDeselect) {
        onNodeDeselect(nodeId); // Notify parent about deselection
      }
      return updatedNodes;
    });
  };

  useImperativeHandle(ref, () => ({
    addNode,
  }));

  return (
    <div className="chatbox">
      <div className="chat-header">
        <h2>Chat</h2>
        <img src={chatIcon} alt="Chat Icon" className="chat-icon" />
      </div>
      <div className="space-info">
        <strong>
          <span className="chat-description">
            Where we bring elements from the spaces together to explore new possibilities.
          </span>
        </strong>
        <img src={helpIcon} alt="Help Icon" className="help-icon" />
      </div>
      <div className="chatbox-messages">
        {messages
          .sort((a, b) => a.timestamp - b.timestamp)
          .map((msg, index) => (
            <div
              key={msg.id}
              className={`chat-message ${msg.messageType} ${
                index === messages.length - 1 ? 'new-message' : ''
              }`}
            >
              <div className="timestamp">
                {new Date(msg.timestamp).toLocaleString()}
              </div>
              {msg.messageType === 'system' && msg.suggestions && msg.suggestions.length > 0 ? (
  <SystemMessage
    payload={msg.suggestions}
    projectId={projectId}
    messageId={msg.id}
  />
) : (
  <div>{msg.content}</div>
)}

            </div>
          ))}
        <div className={`chat-message loading ${loading ? 'visible' : ''}`}>
          <div style={{ width: '3ch', textAlign: 'left', overflow: 'hidden' }}>
            {dots || '\u00A0'}
          </div>
        </div>
        <div ref={messagesEndRef} />
      </div>
      <div className="action-div">
        {selectedNodes.length > 0 && (
          <div className="nodes-container">
            <div className="nodes-scrollable">
              {selectedNodes.map((node) => (
                <div key={node.id} className="node-item">
                  <div
                    className="node-name"
                    style={{
                      backgroundColor: node.space === 'material' ? '#007bff' : '#28a745',
                    }}
                  >
                    {node.title}
                  </div>
                  <div className="node-delete">
                    <button
                      className="node-delete-btn"
                      onClick={() => removeNode(node.id)}
                    >
                      x
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <button className="generate-images-btn">Generate images</button>
        <button className="explore-concepts-btn">Explore concepts</button>
        {selectedNodes.length === 0 && <div>Click a node to attach it to your message!</div>}
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
        <button onClick={sendTestMessage}>Send test message</button>
      </div>
    </div>
  );
});

export default ChatBox;
