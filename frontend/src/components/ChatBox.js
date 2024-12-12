import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import './ChatBox.css';
import SystemMessage from './SystemMessage';
import UserMessage from './UserMessage';
import ImageGeneration from './ImageGeneration';
import NodesContainer from './NodesContainer';

import chatIcon from '../assets/chat.png';
import helpIcon from '../assets/help.png';

const ChatBox = forwardRef(({ projectId, onNodeDeselect }, ref) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dots, setDots] = useState('');
  const [selectedHierarchy, setSelectedHierarchy] = useState(null);
  const [showImageGeneration, setShowImageGeneration] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false); // Tooltip state
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
          linkedHierarchy: data.linkedHierarchy || null,
          timestamp: data.timestamp
            ? data.timestamp.toDate
              ? data.timestamp.toDate().getTime()
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
      setLoading(true);

      const payload = {
        projectId,
        message: input,
        hierarchy: selectedHierarchy,
      };

      setInput('');
      setSelectedHierarchy(null);

      console.log('PL:', payload);

      await axios.post('http://localhost:4000/chat', payload);
    } catch (error) {
      setLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!input.trim()) return;

    try {
      setLoading(true);

      const payload = {
        projectId,
        message: input,
        hierarchy: selectedHierarchy,
      };

      setInput('');
      setSelectedHierarchy(null);

      console.log('PL:', payload);

      await axios.post('http://localhost:4000/testchat', payload);
    } catch (error) {
      setLoading(false);
    }
  };

  const generateImages = async ({ prompt, n }) => {
    console.log('Preparing to generate images with the following details:');
    console.log('Project ID:', projectId);
    console.log('Prompt:', prompt);
    console.log('Number of Images:', n);
    console.log('Attached Hierarchy:', selectedHierarchy);
  
    try {
      const payload = {
        projectId,
        prompt,
        n,
        attachedHierarchy: selectedHierarchy, // Pass the full hierarchy
      };
  
      console.log('Final payload being sent to server:', payload);
  
      const response = await axios.post('http://localhost:4000/generate-image', payload);
      console.log('Response from server:', response);
    } catch (error) {
      console.error('Error generating images:', error);
    }
  };
  
  

  const addHierarchy = (hierarchy) => {
    setSelectedHierarchy(hierarchy);
  };

  const removeHierarchy = () => {
    setSelectedHierarchy(null);
    if (onNodeDeselect) {
      onNodeDeselect();
    }
  };

  useImperativeHandle(ref, () => ({
    addHierarchy,
    generateImages,
    toggleImageGeneration: () => setShowImageGeneration((prev) => !prev),
  }));

  const toggleImageGeneration = () => {
    setShowImageGeneration((prev) => !prev);
  };

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
        <div
          className="help-icon-wrapper"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <img src={helpIcon} alt="Help Icon" className="help-icon" />
        </div>
        {showTooltip && (
          <div className="tooltip">
            This is where you can get help and guidance for your creative process.
          </div>
        )}
      </div>
      <div className="chatbox-messages">
        {messages.map((msg, index) => (
          <div key={msg.id} className={`chat-message ${msg.messageType}`}>
            {msg.messageType === 'user' ? (
              <UserMessage
                content={msg.content}
                timestamp={msg.timestamp}
                linkedHierarchy={msg.hierarchy || null}
              />
            ) : msg.messageType === 'system' ? (
              <>
                {msg.timestamp && (
                  <div className="timestamp">
                    {new Date(msg.timestamp).toLocaleString()}
                  </div>
                )}
                <div className="system-response-text">{msg.content}</div>
                {msg.suggestions?.length > 0 && (
                  <SystemMessage
                    payload={msg.suggestions}
                    projectId={projectId}
                    messageId={msg.id}
                  />
                )}
              </>
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
        <div className="side-by-side">
            <NodesContainer selectedHierarchy={selectedHierarchy} onRemoveNode={removeHierarchy} />
          {showImageGeneration && (
            <div className="image-generation-wrapper">
              <button className="close-btn" onClick={toggleImageGeneration}>
                x
              </button>
              <ImageGeneration
                attachedHierarchy={selectedHierarchy}
                generateImages={generateImages}
              />
            </div>
          )}
        </div>
        {!showImageGeneration && (
          <button className="generate-images-btn" onClick={toggleImageGeneration}>
            Generate Images
          </button>
        )}
      </div>
      <div className={`chatbox-input ${showImageGeneration ? 'disabled' : ''}`}>
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
          disabled={showImageGeneration}
        />
        <button onClick={sendMessage} disabled={showImageGeneration}>
          Send
        </button>
        <button onClick={sendTestMessage} disabled={showImageGeneration}>
          Send test message
        </button>
      </div>
    </div>
  );
});

export default ChatBox;