import React from 'react';
import './EntitySuggestions.css';

const EntitySuggestions = ({ item, index, handleLike }) => {
  return (
    <div className="entity-suggestion">
      <div className="entity-title" style={{ fontWeight: 'bold' }}>{item.title}</div>
      <div className="entity-description" style={{ margin: '10px 0' }}>{item.description}</div>
      <button 
        className={`like-button ${item.liked ? 'liked' : ''}`}
        onClick={(event) => handleLike(index, null, event)}
        disabled={item.liked}
      >
        {item.liked ? 'Liked' : 'Like'}
      </button>
    </div>
  );
};

export default EntitySuggestions;
