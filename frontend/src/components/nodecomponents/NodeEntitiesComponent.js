import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { db } from '../../firebase/firebase-config';
import { doc, onSnapshot } from 'firebase/firestore';
import './NodeEntitiesComponent.css';

const NodeEntitiesComponent = ({ entityIds, projectId }) => {
  const [entities, setEntities] = useState([]);
  const [showLiked, setShowLiked] = useState(true);
  const [showSuggested, setShowSuggested] = useState(true);

  useEffect(() => {
    if (!entityIds || !Array.isArray(entityIds) || entityIds.length === 0) {
      console.log('No entities');
      return;
    }

    console.log('Entities: ', entityIds);

    const unsubscribers = entityIds.map((id) => {
      const entityRef = doc(db, 'projects', projectId, 'entities', id);

      return onSnapshot(
        entityRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const updatedEntity = snapshot.data();
            updatedEntity.id = id;
            setEntities((prev) => {
              const existingIndex = prev.findIndex((entity) => entity.id === updatedEntity.id);
              if (existingIndex !== -1) {
                const updatedEntities = [...prev];
                updatedEntities[existingIndex] = updatedEntity;
                return updatedEntities;
              } else {
                return [...prev, updatedEntity];
              }
            });
          } else {
            console.warn(`Entity with ID ${id} not found in Firestore.`);
          }
        },
        (error) => {
          console.error(`Error subscribing to entity with ID ${id}:`, error);
        }
      );
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [entityIds, projectId]);

  const likedEntities = entities.filter((entity) => entity.liked);
  const unlikedEntities = entities.filter((entity) => !entity.liked);

  const handleLikeClick = async (entityId) => {
    try {
      if (!entityId) return;

      const requestBody = { projectId, entityId };

      const response = await axios.post('http://localhost:4000/likeEntity', requestBody);

      if (response.status === 200) {
        console.log(`Entity with ID ${entityId} liked successfully!`);
      } else {
        console.error('Failed to like entity:', response.data);
      }
    } catch (err) {
      console.error('Error liking entity:', err.response?.data || err.message);
    }
  };

  const renderEntityPreview = (entities) =>
    entities.slice(0, 3).map((entity) => entity.title).join(', ') + (entities.length > 3 ? '...' : '');

  return (
    <div className="node-entities">
      {likedEntities.length > 0 && (
        <div className="entity-section">
          <h3 onClick={() => setShowLiked(!showLiked)} className="toggle-header">
            {showLiked ? '▼' : '▶'} Liked Entities {showLiked ? '' : `(${likedEntities.length})`}
          </h3>
          {!showLiked && (
            <p className="entity-preview">
              <em>{renderEntityPreview(likedEntities)}</em>
            </p>
          )}
          {showLiked && (
            <div className="entity-list">
              {likedEntities.map((entity) => (
                <div key={entity.id} className="entity-box">
                  <div className="entity-details">
                    <strong><span>{entity.title}</span></strong>
                    <em>{entity.description}</em>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {unlikedEntities.length > 0 && (
        <div className="entity-section">
          <h3 onClick={() => setShowSuggested(!showSuggested)} className="toggle-header">
            {showSuggested ? '▼' : '▶'} Suggested Entities for Node {showSuggested ? '' : `(${unlikedEntities.length})`}
          </h3>
          {!showSuggested && (
            <p className="entity-preview">
              <em>{renderEntityPreview(unlikedEntities)}</em>
            </p>
          )}
          {showSuggested && (
            <div className="entity-list">
              {unlikedEntities.map((entity) => (
                <div key={entity.id} className="entity-box suggested">
                  <div className="entity-details">
                    <strong><span>{entity.title}</span></strong>
                    <em>{entity.description}</em>
                  </div>
                  <button
                    className="like-button"
                    onClick={() => handleLikeClick(entity.id)}
                    disabled={entity.liked}
                  >
                    Like
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {entities.length === 0 && <p>No entities available.</p>}
    </div>
  );
};

export default NodeEntitiesComponent;
