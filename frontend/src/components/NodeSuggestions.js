import React from 'react';
import './SystemMessage.css';

const NodeSuggestions = ({ item, index, handleLike }) => {
  // Debugging: Log `item` for verification
  console.log('NodeSuggestions -> item:', item);

  return (
    <div className="suggestion">
      {/* Suggestion Button */}
      <button
        className={`highlight-button ${item.liked ? 'liked' : ''}`}
        onClick={(event) => handleLike(index, null, event)}
        disabled={item.liked}
      >
        {item.title || 'Unnamed Suggestion'}
      </button>

      {/* Suggestion Description */}
      <div className="item-description">
        {item.description || 'No description available'}
      </div>

      {/* Node List */}
      <ul>
        {item.nodes &&
          item.nodes.map((node) => (
            <li key={`node-${node.id}`}>
              <button
                className={`highlight-button ${node.liked ? 'liked' : ''}`}
                onClick={(event) => handleLike(index, node.id, event)}
                disabled={node.liked}
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
