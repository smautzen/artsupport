import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import './EntitySuggestions.css';

const EntitySuggestions = ({ entityId, projectId, handleLike, index }) => {
  const [entity, setEntity] = useState(null); // Store entity data

  // Subscribe to the individual entity document
  useEffect(() => {
    if (!entityId) return;

    const entityRef = doc(db, 'projects', projectId, 'entities', entityId);

    const unsubscribe = onSnapshot(
      entityRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setEntity({ id: entityId, ...snapshot.data() });
        } else {
          console.warn(`Entity with ID ${entityId} not found.`);
        }
      },
      (error) => {
        console.error('Error subscribing to entity:', error);
      }
    );

    return () => unsubscribe();
  }, [entityId, projectId]);

  if (!entity) return <p>Loading entity...</p>;

  return (
    <div className="entity-suggestion">
      <div className="entity-title" style={{ fontWeight: 'bold' }}>
        {entity.title || 'Untitled Entity'}
      </div>
      <div className="entity-description" style={{ margin: '10px 0' }}>
        {entity.description || 'No description provided.'}
      </div>
      <button
        className={`like-button ${entity.liked ? 'liked' : ''}`}
        onClick={(event) => handleLike(index, entity.id, event, 'entities')}
        disabled={entity.liked}
      >
        {entity.liked ? 'Liked' : 'Like'}
      </button>
    </div>
  );
};

export default EntitySuggestions;
