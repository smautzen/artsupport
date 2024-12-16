import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { db } from '../../firebase/firebase-config';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import './NodeEntitiesComponent.css';

const NodeEntitiesComponent = ({ entityIds, projectId, space, categoryId, nodeId }) => {
  const [entities, setEntities] = useState([]);

  // Fetch entity data based on IDs and subscribe for updates
  useEffect(() => {
    if (!entityIds || !Array.isArray(entityIds) || entityIds.length === 0) {
      console.log('No entities')
      return; // No entity IDs to fetch
    }

    console.log('Entities: ', entityIds)

    const unsubscribers = entityIds.map((id) => {
      const entityRef = doc(db, 'projects', projectId, 'entities', id);

      return onSnapshot(
        entityRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const updatedEntity = snapshot.data();
            updatedEntity.id = id; // Ensure the ID is included
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

    // Cleanup listeners on component unmount
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [entityIds, projectId]);

  // Separate liked and unliked entities
  const likedEntities = entities.filter((entity) => entity.liked);
  const unlikedEntities = entities.filter((entity) => !entity.liked);

  // Handle like button click
  const handleLikeClick = async (entityId) => {
    try {
      const response = await axios.post('http://localhost:4000/likeEntityFromSpace', {
        projectId,
        space,
        categoryId,
        nodeId,
        entityId,
      });

      if (response.status === 200) {
        console.log(`Entity with ID ${entityId} liked successfully!`);
      } else {
        console.error('Failed to like entity:', response.data);
      }
    } catch (err) {
      console.error('Error liking entity:', err.response?.data || err.message);
    }
  };

  return (
    <div className="node-entities">
      {likedEntities.length > 0 && (
        <>
          <h3>Liked Entities:</h3>
          <div className="entity-list">
            {likedEntities.map((entity) => (
              <div key={entity.id} className="entity-box">
                {entity.title}
              </div>
            ))}
          </div>
        </>
      )}
      {unlikedEntities.length > 0 && (
        <>
          <strong><span>Suggested entities for node:</span></strong>
          <div className="entity-list">
            {unlikedEntities.map((entity) => (
              <div key={entity.id} className="entity-box suggested">
                <em>{entity.title}</em>
                <button
                  className="like-button"
                  onClick={() => handleLikeClick(entity.id)}
                >
                  Like
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default NodeEntitiesComponent;
