import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import './SystemMessage.css';
import ImageSuggestions from './ImageSuggestions';
import NodeSuggestions from './NodeSuggestions';
import EntitySuggestions from './EntitySuggestions';

const SystemMessage = ({ action, payload, projectId, messageId }) => {
  const [likedSuggestions, setLikedSuggestions] = useState({});
  const [animations, setAnimations] = useState([]); // Track multiple active animations
  const [overlayImage, setOverlayImage] = useState(null); // Track the image for the overlay
  const [entities, setEntities] = useState([]); // Entities loaded from Firestore

  // Load entities from Firestore when the action is "entities"
  useEffect(() => {
    const fetchEntities = async () => {
      if (action !== 'entities' || !payload || !Array.isArray(payload)) return;

      try {
        const fetchedEntities = await Promise.all(
          payload.map(async (item) => {
            const entityRef = doc(db, 'projects', projectId, 'entities', item.id);
            const entitySnapshot = await getDoc(entityRef);
            if (entitySnapshot.exists()) {
              return { id: item.id, messageId: item.messageId, ...entitySnapshot.data() };
            } else {
              console.warn(`Entity with ID ${item.id} not found.`);
              return null;
            }
          })
        );

        setEntities(fetchedEntities.filter((entity) => entity !== null));
      } catch (error) {
        console.error('Error fetching entities:', error);
      }
    };

    fetchEntities();
  }, [payload, action, projectId]);

  // Initialize liked suggestions for other actions (images, nodes)
  useEffect(() => {
    if (action !== 'entities' && payload && Array.isArray(payload)) {
      const likedData = payload.reduce((acc, item, index) => {
        const anyNodeLiked = (item.nodes || []).some((node) => node.liked);
        acc[index] = {
          liked: item.liked || anyNodeLiked,
          nodes: (item.nodes || []).reduce((nodeAcc, node) => {
            nodeAcc[node.id] = node.liked || false;
            return nodeAcc;
          }, {}),
        };
        return acc;
      }, {});
      setLikedSuggestions(likedData);
    }
  }, [payload, action]);

  // Handle "like" interactions
  const handleLike = async (index, entityId = null, event) => {
    try {
      const suggestion = payload[index];
      if (!suggestion && !entityId) return;

      const rect = event.target.getBoundingClientRect();
      const targetSpace = suggestion?.space === 'material' ? 'left' : 'right';
      const animationId = Date.now();

      setAnimations((prevAnimations) => [
        ...prevAnimations,
        {
          id: animationId,
          title: entityId
            ? entities.find((entity) => entity.id === entityId)?.title || 'Unnamed Entity'
            : suggestion?.title || 'Unnamed Suggestion',
          target: targetSpace,
          startX: rect.left + rect.width / 2,
          startY: rect.top + rect.height / 2,
        },
      ]);

      let endpoint;
      let requestBody;

      if (action === 'entities') {
        endpoint = 'http://localhost:4000/likeEntityFromSpace';
        requestBody = {
          projectId,
          messageId,
          entityId,
        };
      } else {
        endpoint = 'http://localhost:4000/likeSuggestion';
        requestBody = {
          projectId,
          messageId,
          suggestionIndex: index,
        };

        if (entityId) {
          const entity = entities.find((e) => e.id === entityId);
          if (entity) {
            requestBody = { ...requestBody, entity };
          }
        }
      }

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('Liked request body:', requestBody);

      // Update local liked state
      if (action === 'entities' && entityId) {
        setEntities((prevEntities) =>
          prevEntities.map((entity) =>
            entity.id === entityId ? { ...entity, liked: true } : entity
          )
        );
      }

      setTimeout(() => {
        setAnimations((prevAnimations) =>
          prevAnimations.filter((anim) => anim.id !== animationId)
        );
      }, 1000);
    } catch (error) {
      console.error('Error liking suggestion:', error);
    }
  };

  // Open image overlay
  const openOverlay = (imageUrl) => {
    setOverlayImage(imageUrl);
  };

  // Close image overlay
  const closeOverlay = () => {
    setOverlayImage(null);
  };

  return (
    <div className="system-message">
      <h4>Suggestions:</h4>
      {animations.map((animation) => (
        <div
          key={animation.id}
          className={`phantom phantom-${animation.target}`}
          style={{
            left: animation.startX,
            top: animation.startY,
          }}
        >
          {animation.title}
        </div>
      ))}
      {action === 'images' && Array.isArray(payload) && payload.length > 0 && (
        payload.map((item, index) => (
          <ImageSuggestions
            key={`image-${index}`}
            item={item}
            index={index}
            likedSuggestions={likedSuggestions}
            handleLike={handleLike}
            openOverlay={openOverlay}
          />
        ))
      )}
      {action === 'nodes' && Array.isArray(payload) && payload.length > 0 && (
        payload.map((item, index) => (
          <NodeSuggestions
            key={`node-${index}`}
            item={item}
            index={index}
            likedSuggestions={likedSuggestions}
            handleLike={handleLike}
          />
        ))
      )}
      {action === 'entities' && entities.length > 0 && (
        entities.map((entity, index) => (
          <EntitySuggestions
            key={`entity-${index}`}
            item={entity}
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
