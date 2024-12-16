import React from 'react';
import './NodeEntitiesComponent.css';

const NodeEntitiesComponent = ({ entities }) => {
  if (!entities || !Array.isArray(entities) || entities.length === 0) {
    return null; // Render nothing if there are no entities
  }

  // Separate liked and unliked entities
  const likedEntities = entities.filter(entity => entity.liked);
  const unlikedEntities = entities.filter(entity => !entity.liked);

  return (
    <div className="node-entities">
      {likedEntities.length > 0 && (
        <>
          <h3>Liked Entities:</h3>
          <div className="entity-list">
            {likedEntities.map((entity, index) => (
              <div key={index} className="entity-box">
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
            {unlikedEntities.map((entity, index) => (
              <div
                key={index}
                className="entity-box suggested"
              >
                <em>{entity.title}</em>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default NodeEntitiesComponent;
