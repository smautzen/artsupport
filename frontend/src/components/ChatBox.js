import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import { getFirestore, doc, onSnapshot, collection } from 'firebase/firestore';
import './ChatBox.css';
import SystemMessage from './SystemMessage';
import UserMessage from './UserMessage';
import NodesContainer from './NodesContainer';
import OverlayComponent from './Overlay/OverlayComponent';

import chatIcon from '../assets/chat.png';
import helpIcon from '../assets/help.png';

const ChatBox = forwardRef(({ projectId, onNodeDeselect, selectedNodeForImageGeneration }, ref) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dots, setDots] = useState('');
  const [currentAction, setCurrentAction] = useState(''); // Store currentAction from Firestore
  const [selectedHierarchy, setSelectedHierarchy] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayData, setOverlayData] = useState(null);

  const db = getFirestore();
  const messagesEndRef = useRef(null);

  // Fetch currentAction from Firestore
  useEffect(() => {
    if (!projectId) return;

    const actionDocRef = doc(db, 'projects', projectId);

    const unsubscribe = onSnapshot(actionDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setCurrentAction(docSnapshot.data()?.currentAction || '');
      }
    });

    return () => unsubscribe();
  }, [db, projectId]);

  // Handle animated dots
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

  // Fetch chat messages
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
        setLoading(latestMessage.messageType === 'user');
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

  useEffect(() => {
    if (selectedNodeForImageGeneration) {
      setOverlayData({
        action: 'image',
        item: selectedNodeForImageGeneration,
        projectId,
      });
      setShowOverlay(true);
    }
  }, [selectedNodeForImageGeneration, projectId]);

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

  const addHierarchy = (hierarchy) => {
    setSelectedHierarchy(hierarchy);
  };

  const removeHierarchy = () => {
    setSelectedHierarchy(null);
    if (onNodeDeselect) {
      onNodeDeselect();
    }
  };

  const closeOverlay = () => {
    setShowOverlay(false);
    setOverlayData(null);
  };

  useImperativeHandle(ref, () => ({
    addHierarchy,
    removeHierarchy,
    toggleImageGeneration: () => {
      setOverlayData({
        action: 'image',
        item: selectedHierarchy,
        projectId,
      });
      setShowOverlay(true);
    },
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
        {messages.map((msg) => (
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
                  <div className="timestamp">{new Date(msg.timestamp).toLocaleString()}</div>
                )}
                <div className="system-response-text">{msg.content}</div>
                {msg.action && (
                  <SystemMessage
                    action={msg.action}
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
          <div style={{ width: '250px', textAlign: 'left', overflow: 'hidden' }}>
            {currentAction ? `${currentAction}${dots}` : '\u00A0'}
          </div>
        </div>
        <div ref={messagesEndRef} />
      </div>

      <div className="action-div">
        <div className="side-by-side">
          <NodesContainer selectedHierarchy={selectedHierarchy} onRemoveNode={removeHierarchy} />
        </div>
        <button
          className="generate-images-btn"
          onClick={() => {
            setOverlayData({ action: 'image', item: null, projectId });
            setShowOverlay(true);
          }}
        >
          Generate Images
        </button>
      </div>
      <div className={`chatbox-input ${showOverlay ? 'disabled' : ''}`}>
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
          disabled={showOverlay}
        />
        <button onClick={sendMessage} disabled={showOverlay}>
          Send
        </button>
        <button onClick={sendTestMessage} disabled={showOverlay}>
          Send test message
        </button>
      </div>

      {showOverlay && (
        <OverlayComponent
          action={overlayData.action}
          item={overlayData.item || null}
          projectId={overlayData.projectId}
          onClose={closeOverlay}
        />
      )}
    </div>
  );
});

export default ChatBox;
