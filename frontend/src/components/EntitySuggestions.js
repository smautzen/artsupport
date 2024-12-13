import React from 'react';
import './SystemMessage.css';

const EntitySuggestions = ({ item, index }) => {
  const handleLike = () => {
    console.log(item.title); // Log the title when the like button is pressed
  };

  return (
    <div className="entity-suggestion">
      <div className="entity-title" style={{ fontWeight: 'bold' }}>{item.title}</div>
      <div className="entity-description" style={{ margin: '10px 0' }}>{item.description}</div>
      <button onClick={handleLike}>
        Like
      </button>
    </div>
  );
};

export default EntitySuggestions;
