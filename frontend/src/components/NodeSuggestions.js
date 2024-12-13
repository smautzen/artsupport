import React from 'react';
import './SystemMessage.css';

const NodeSuggestions = ({ item, index, likedSuggestions, handleLike }) => {
  return (
    <div className="suggestion">
      <button
        className={`highlight-button ${likedSuggestions[index]?.liked ? 'liked' : ''}`}
        onClick={(event) => handleLike(index, null, event)}
        disabled={likedSuggestions[index]?.liked}
      >
        {item.title || 'Unnamed Suggestion'}
      </button>
      <div className="item-description">
        {item.description || 'No description available'}
      </div>
      <ul>
        {item.nodes &&
          item.nodes.map((node) => (
            <li key={`node-${node.id}`}>
              <button
                className={`highlight-button ${
                  likedSuggestions[index]?.nodes?.[node.id] ? 'liked' : ''
                }`}
                onClick={(event) => handleLike(index, node.id, event)}
                disabled={likedSuggestions[index]?.nodes?.[node.id]}
              >
                {node.title || 'Unnamed Node'}
              </button>{' '}
              - {node.description || 'No description'} ({node.type})
            </li>
          ))}
      </ul>
    </div>
  );
};

export default NodeSuggestions;
