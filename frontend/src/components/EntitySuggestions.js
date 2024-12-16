import React from 'react';
import './EntitySuggestions.css';

const EntitySuggestions = ({ item, handleLike, projectId, index }) => {
  const { id, title, description, liked } = item; // Destructure properties of the single entity

  return (
    <div className="entity-suggestion">
      {/* Render entity title */}
      <div className="entity-title" style={{ fontWeight: 'bold' }}>
        {title || 'Untitled Entity'}
      </div>

      {/* Render entity description */}
      <div className="entity-description" style={{ margin: '10px 0' }}>
        {description || 'No description provided.'}
      </div>

      {/* Render Like button */}
      <button
        className={`like-button ${liked ? 'liked' : ''}`}
        onClick={(event) => handleLike(index, id, event)} // Pass entity ID to handleLike
        disabled={liked} // Disable if already liked
      >
        {liked ? 'Liked' : 'Like'}
      </button>
    </div>
  );
};

export default EntitySuggestions;
