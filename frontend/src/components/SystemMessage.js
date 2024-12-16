import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import './SystemMessage.css';
import ImageSuggestions from './ImageSuggestions';
import NodeSuggestions from './NodeSuggestions';
import EntitySuggestions from './EntitySuggestions';

const SystemMessage = ({ action, payload, projectId, messageId }) => {
  const [entities, setEntities] = useState([]); // Store entity IDs from the message
  const [animations, setAnimations] = useState([]); // Track animations
  const [overlayImage, setOverlayImage] = useState(null); // Track overlay image

  // Subscribe to the Firestore message document
  useEffect(() => {
    if (action !== 'entities' || !messageId) return;

    const messageRef = doc(db, 'projects', projectId, 'chat', messageId);

    const unsubscribe = onSnapshot(
      messageRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const messageData = snapshot.data();
          if (messageData && messageData.suggestions && Array.isArray(messageData.suggestions)) {
            // Extract entity IDs from the suggestions array
            setEntities(messageData.suggestions.map((suggestion) => suggestion.id));
          } else {
            console.warn('No valid suggestions found in the message document.');
          }
        } else {
          console.error(`Message with ID ${messageId} not found.`);
        }
      },
      (error) => {
        console.error('Error subscribing to the message document:', error);
      }
    );

    return () => unsubscribe();
  }, [action, projectId, messageId]);

  // Handle like button interactions
  const handleLike = async (index, entityId, event) => {
    try {
      if (!entityId) return;

      const rect = event.target.getBoundingClientRect();
      const animationId = Date.now();

      setAnimations((prev) => [
        ...prev,
        {
          id: animationId,
          title: `Entity ${entityId}`,
          startX: rect.left + rect.width / 2,
          startY: rect.top + rect.height / 2,
        },
      ]);

      const endpoint = 'http://localhost:4000/likeEntityFromSpace';
      const requestBody = { projectId, messageId, entityId };

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('Like request sent:', requestBody);

      setTimeout(() => {
        setAnimations((prev) => prev.filter((anim) => anim.id !== animationId));
      }, 1000);
    } catch (error) {
      console.error('Error liking entity:', error);
    }
  };

  const openOverlay = (imageUrl) => setOverlayImage(imageUrl);
  const closeOverlay = () => setOverlayImage(null);

  return (
    <div className="system-message">
      <h4>Suggestions:</h4>
      {animations.map((animation) => (
        <div
          key={animation.id}
          className="phantom"
          style={{
            left: animation.startX,
            top: animation.startY,
          }}
        >
          {animation.title}
        </div>
      ))}
      {action === 'entities' && entities.length > 0 && (
        entities.map((entityId, index) => (
          <EntitySuggestions
            key={`entity-${entityId}`}
            entityId={entityId}
            projectId={projectId}
            index={index}
            handleLike={handleLike}
          />
        ))
      )}
      {(action !== 'entities' || entities.length === 0) && <p>No suggestions available.</p>}
      {overlayImage && (
        <div className="overlay" onClick={closeOverlay}>
          <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
            <img src={overlayImage} alt="Full Size" className="overlay-image" />
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemMessage;
