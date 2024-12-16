import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import axios from 'axios';
import './SystemMessage.css';
import ImageSuggestions from './ImageSuggestions';
import NodeSuggestions from './NodeSuggestions';
import EntitySuggestions from './EntitySuggestions';

const SystemMessage = ({ action, payload, projectId, messageId }) => {
  const [likedSuggestions, setLikedSuggestions] = useState({});
  const [animations, setAnimations] = useState([]); // Track animations
  const [overlayImage, setOverlayImage] = useState(null); // Track overlay image
  const [entities, setEntities] = useState([]); // Store entity data
  const [suggestions, setSuggestions] = useState([]); // Store image or node suggestions

  // Fetch entity data from Firestore
  useEffect(() => {
    const fetchEntities = async () => {
      if (action !== 'entities' || !payload || !Array.isArray(payload)) return;

      try {
        const fetchedEntities = await Promise.all(
          payload.map(async (item) => {
            const entityRef = doc(db, 'projects', projectId, 'entities', item.id);
            const entitySnapshot = await getDoc(entityRef);
            if (entitySnapshot.exists()) {
              return { id: item.id, ...entitySnapshot.data() };
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

    if (action === 'entities') {
      fetchEntities();
    }
  }, [action, payload, projectId]);

  // Subscribe to message suggestions for images or nodes
  useEffect(() => {
    if (!messageId) return;

    const messageRef = doc(db, 'projects', projectId, 'chat', messageId);

    const unsubscribe = onSnapshot(
      messageRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const messageData = snapshot.data();

          if (action === 'images' && Array.isArray(messageData.suggestions)) {
            setSuggestions(messageData.suggestions);
          } else if (action === 'nodes' && Array.isArray(messageData.suggestions)) {
            setSuggestions(messageData.suggestions);
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

  // Handle "like" interactions
  const handleLike = async (index, id = null, event) => {
    try {
      const rect = event.target.getBoundingClientRect();
      const animationId = Date.now();
      const animationTitle = await getAnimationTitle(index, id, action);

      const targetSpace =
        action === 'node'
          ? payload[index]?.space === 'material'
            ? 'left'
            : 'right'
          : 'center'; // Default for non-node types

      setAnimations((prevAnimations) => [
        ...prevAnimations,
        {
          id: animationId,
          title: animationTitle,
          target: targetSpace,
          startX: rect.left + rect.width / 2,
          startY: rect.top + rect.height / 2,
        },
      ]);

      switch (action) {
        case 'nodes':
          await handleNodeLike(index, id);
          break;
        case 'images':
          await handleImageLike(index);
          break;
        case 'entities':
          await handleEntityLike(index, id);
          break;
        default:
          console.error('Unknown action type:', action);
      }

      setTimeout(() => {
        setAnimations((prevAnimations) =>
          prevAnimations.filter((anim) => anim.id !== animationId)
        );
      }, 1000);
    } catch (error) {
      console.error(`Error handling like for action type ${action}:`, error);
    }
  };

  const handleNodeLike = async (index, nodeId) => {
    const suggestion = payload[index];
    if (!suggestion) return;

    const endpoint = 'http://localhost:4000/likeSuggestion';
    const requestBody = nodeId
      ? {
        projectId,
        messageId,
        suggestionIndex: index,
        type: 'node',
        nodeId,
        categoryId: suggestion.id,
        title: suggestion.nodes.find((n) => n.id === nodeId)?.title || 'Unnamed Node',
        description: suggestion.nodes.find((n) => n.id === nodeId)?.description || '',
        categoryTitle: suggestion.title,
        categoryDescription: suggestion.description || '',
      }
      : {
        projectId,
        messageId,
        suggestionIndex: index,
        type: 'category',
        categoryId: suggestion.id,
        title: suggestion.title,
        description: suggestion.description || '',
      };

    await axios.post(endpoint, requestBody);
    console.log('Node like request body:', requestBody);
  };

  const handleImageLike = async (index) => {
    const suggestion = payload[index];
    if (!suggestion) return;

    const endpoint = 'http://localhost:4000/likeImage';
    const requestBody = {
      projectId,
      messageId,
      suggestionIndex: index,
      title: suggestion.title || 'Unnamed Image',
      description: suggestion.description || 'No description provided',
      url: suggestion.url,
    };

    await axios.post(endpoint, requestBody);
    console.log('Image like request body:', requestBody);
  };

  const handleEntityLike = async (index, entityId) => {
    const endpoint = 'http://localhost:4000/likeEntity';
    const requestBody = {
      projectId,
      messageId,
      entityId,
    };

    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    console.log('Entity like request body:', requestBody);

    // Update local liked state for entities
    setEntities((prevEntities) =>
      prevEntities.map((entity) =>
        entity.id === entityId ? { ...entity, liked: true } : entity
      )
    );
  };

  const getAnimationTitle = async (index, id, actionType) => {
    switch (actionType) {
      case 'node': {
        const suggestion = payload[index];
        return id
          ? suggestion.nodes.find((n) => n.id === id)?.title || 'Unnamed Node'
          : suggestion?.title || 'Unnamed Suggestion';
      }
      case 'image': {
        const suggestion = payload[index];
        return suggestion?.title || 'Unnamed Image';
      }
      case 'entity': {
        const entity = entities.find((e) => e.id === id);
        return entity?.title || 'Unnamed Entity';
      }
      default:
        return 'Unnamed Animation';
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

      {action === 'images' && suggestions.length > 0 && (
        suggestions.map((item, index) => (
          <ImageSuggestions
            key={`image-${index}`}
            imageId={item.id}
            projectId={projectId}
            openOverlay={openOverlay}
          />
        ))
      )}

      {action === 'nodes' && suggestions.length > 0 && (
        suggestions.map((item, index) => (
          <NodeSuggestions
            key={`node-${index}`}
            item={item} // Pass the entire item object
            index={index}
            handleLike={handleLike}
          />
        ))
      )}


      {action === 'entities' && entities.length > 0 && (
        entities.map((entity, index) => (
          <EntitySuggestions
            key={`entity-${index}`}
            entityId={entity.id} // Pass the entity ID
            projectId={projectId} // Pass the project ID
            index={index}
            handleLike={handleLike}
          />
        ))
      )}


      {(action !== 'entities' && action !== 'images' && action !== 'nodes') ||
        (entities.length === 0 && suggestions.length === 0) ? (
        <p>No suggestions available.</p>
      ) : null}

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
