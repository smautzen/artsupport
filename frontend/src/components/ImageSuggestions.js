import React from 'react';
import './SystemMessage.css';

const ImageSuggestions = ({ item, index, likedSuggestions, handleLike, openOverlay }) => {
  return (
    <div
      className={`suggestion ${item.url && likedSuggestions[index]?.liked ? 'liked-suggestion' : ''}`}
    >
      <div className="timestamp">
        {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Timestamp not available'}
      </div>
      <div className="image-container">
        <button
          className={`like-button ${likedSuggestions[index]?.liked ? 'liked' : ''}`}
          onClick={(event) => handleLike(index, null, event)}
          disabled={likedSuggestions[index]?.liked}
        >
          {likedSuggestions[index]?.liked ? 'Liked' : 'Like'}
        </button>
        <img
          src={item.url}
          alt={item.title || 'Generated Image'}
          className="suggestion-image"
          onClick={() => openOverlay(item.url)}
        />
        <div className="image-title">
          <strong>{item.title || 'Unnamed Suggestion'}</strong>
        </div>
      </div>
    </div>
  );
};

export default ImageSuggestions;
