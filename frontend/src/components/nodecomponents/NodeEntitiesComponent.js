import React from 'react';
import './NodeEntitiesComponent.css';

const NodeEntitiesComponent = ({ entities }) => {
  if (!entities || !Array.isArray(entities) || entities.length === 0) {
    return null; // Render nothing if there are no entities
  }

  return (
    <div className="node-entities">
      <h3>Entities:</h3>
      <div className="entity-list">
        {entities.map((entity, index) => (
          <div key={index} className="entity-box">
            {entity.title}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NodeEntitiesComponent;
