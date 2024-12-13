import React from 'react';
import './SystemMessage.css';

const EntitySuggestions = ({ item, index, handleLike }) => {
  return (
    <div className="entity-suggestion">
      <div className="entity-title" style={{ fontWeight: 'bold' }}>{item.title}</div>
      <div className="entity-description" style={{ margin: '10px 0' }}>{item.description}</div>
      <button onClick={(event) => handleLike(index, null, event)}>
        Like
      </button>
    </div>
  );
};

export default EntitySuggestions;
