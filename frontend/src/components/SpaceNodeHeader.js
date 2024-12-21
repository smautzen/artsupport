import React from 'react';
import categoryIcon from '../assets/category.png';
import textNodeIcon from '../assets/textnode.png';
import entityIcon from '../assets/entity.png';
import imageIcon from '../assets/imagenode.png';
import './SpaceNodeHeader.css';

const SpaceNodeHeader = ({ title, type, space, onClick }) => {
  // Determine the icon based on the type
  const getIcon = () => {
    switch (type) {
      case 'category':
        return categoryIcon;
      case 'textNode':
        return textNodeIcon;
      case 'entity':
        return entityIcon;
      case 'images':
        return imageIcon;
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
      case 'entity':
        return 'Entity';
      case 'images':
        return 'Images';
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

  // Handle clicking on the node title
  const handleTitleClick = () => {
    console.log(`Clicked on node title: ${title || 'Unnamed Suggestion'}`);
    // Logic to handle the click event can be added here
  };

  // Determine the class for the left section based on space
  const leftSectionClass = space === 'material' ? 'left-section material-space' : 'left-section';

  return (
    <div className="node-header">
      {/* Left Section: Type and Icon */}
      <div className={leftSectionClass}>
        <div className="type-text">{getTypeText()}</div>
        <div className="type-icon">
          <img src={getIcon()} alt={`${type} Icon`} className="node-icon" />
        </div>
      </div>

      {/* Middle Section: Title */}
      <div className="middle-section">
        <div className="node-header-title" onClick={onClick}>
          {title || 'Unnamed Suggestion'}
        </div>
      </div>

      {/* Right Section: Like Button */}
      <div className="right-section"></div>
    </div>
  );
};

export default SpaceNodeHeader;
