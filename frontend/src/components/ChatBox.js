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
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [showImageGeneration, setShowImageGeneration] = useState(false);
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
          linkedNodes: data.linkedNodes?.map((node) => ({
            id: node.id,
            title: node.title,
            description: node.description || 'No description available',
          })),
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
      setInput('');
      setSelectedNodes([]);

      setLoading(true);

      const payload = {
        projectId,
        message: input,
        nodeReferences: selectedNodes.map((node) => ({
          id: node.id,
          title: node.title,
          description: node.description, 
        })),
      };

      console.log('Payload being sent:', payload);

      const response = await axios.post('http://localhost:4000/chat', payload);
      console.log('Response from server:', response);

      const { messageId } = response.data;

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: messageId,
          messageType: 'user',
          content: input,
          timestamp: new Date().toISOString(),
          nodeReferences: selectedNodes, // Add attached nodes here
        },
      ]);
    } catch (error) {
      console.error('Error while sending message:', error);
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
          description: node.description,
        })),
      };

      await axios.post('http://localhost:4000/testchat', payload);
    } catch (error) {
      setLoading(false);
    }
  };

  const generateImages = async ({ prompt, n, attachedNodes }) => {
    try {
      setLoading(true);
      setShowImageGeneration(false); // Hide the ImageGeneration component when a request is sent

      const payload = {
        projectId,
        prompt,
        n,
        attachedNodes,
      };

      console.log('Generating images with payload:', payload);

      const response = await axios.post('http://localhost:4000/generate-image', payload);
      console.log('Response from server:', response);

      // System message will be reflected via Firestore subscription
    } catch (error) {
      console.error('Error generating images:', error);
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
        onNodeDeselect(nodeId);
      }
      return updatedNodes;
    });
  };

  useImperativeHandle(ref, () => ({
    addNode,
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
        <img src={helpIcon} alt="Help Icon" className="help-icon" />
      </div>
      <div className="chatbox-messages">
  {messages.map((msg, index) => (
    <div key={msg.id} className={`chat-message ${msg.messageType}`}>
      {msg.messageType === 'user' ? (
        <UserMessage
          content={msg.content}
          timestamp={msg.timestamp}
          linkedNodes={msg.linkedNodes || []}
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
          {(selectedNodes.length > 0 || showImageGeneration) && (
            <NodesContainer selectedNodes={selectedNodes} onRemoveNode={removeNode} />
          )}
          {showImageGeneration && (
            <div className="image-generation-wrapper">
              <button className="close-btn" onClick={toggleImageGeneration}>
                x
              </button>
              <ImageGeneration
                attachedNodes={selectedNodes}
                generateImages={generateImages}
              />
            </div>
          )}
        </div>
        {selectedNodes.length === 0 && !showImageGeneration && (
          <div>Click a node to attach it to your message!</div>
        )}
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
