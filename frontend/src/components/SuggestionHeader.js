import React from 'react';
import categoryIcon from '../assets/category.png';
import textNodeIcon from '../assets/textnode.png';
import './SuggestionHeader.css';

const SuggestionHeader = ({ handleLike, title, type, liked, index, space, nodeId, categoryId }) => {
  // Determine the icon based on the type
  const getIcon = () => {
    switch (type) {
      case 'category':
        return categoryIcon;
      case 'textNode':
        return textNodeIcon;
      default:
        return categoryIcon; // Fallback icon
    }
  };

  // Determine the display text for the type
  const getTypeText = () => {
    switch (type) {
      case 'category':
        return 'Category';
      case 'textNode':
        return 'Node';
      default:
        return 'Unknown';
    }
  };

  // Map type to actionType
  const mapTypeToActionType = (type) => {
    switch (type) {
      case 'category':
        return 'nodes';
      case 'textNode':
        return 'nodes'; // Map textNode to nodes
      default:
        return 'unknown';
    }
  };

  // Determine the class for the left section based on space
  const leftSectionClass = space === 'material' ? 'left-section material-space' : 'left-section';

  return (
    <div className="suggestion-header">
      {/* Left Section: Type and Icon */}
      <div className={leftSectionClass}>
        <div className="type-text">{getTypeText()}</div>
        <div className="type-icon">
          <img src={getIcon()} alt={`${type} Icon`} className="node-icon" />
        </div>
      </div>

      {/* Middle Section: Title */}
      <div className="middle-section">
        <span>{title || 'Unnamed Suggestion'}</span>
      </div>

      {/* Right Section: Like Button */}
      <div className="right-section">
        <button
          className={`highlight-button ${liked ? 'liked' : ''}`}
          onClick={(event) =>
            handleLike(
              index,
              type === 'textNode' ? nodeId : null,
              event,
              mapTypeToActionType(type),
              categoryId
            )
          }
          disabled={liked}
        >
          {liked ? 'Liked' : '+ Like'}
        </button>
      </div>
    </div>
  );
};

export default SuggestionHeader;
