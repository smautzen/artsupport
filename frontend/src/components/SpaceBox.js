import React, { useState, useRef, useEffect } from 'react';
import './SpaceBox.css';
import NodeTree from './NodeTree';
import DefaultCategorySuggestions from './DefaultCategorySuggestions';

import materialSpaceIcon from '../assets/materialspace.png';
import conceptualSpaceIcon from '../assets/conceptualspace.png';
import helpIcon from '../assets/help.png';

const SpaceBox = ({ projectId, spaceName, onHierarchyChange, selectedHierarchy, onGenerateImages }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showNewCategoryMenu, setShowNewCategoryMenu] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowNewCategoryMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const icon = spaceName.toLowerCase() === 'material' ? materialSpaceIcon : conceptualSpaceIcon;

  const description =
    spaceName.toLowerCase() === 'material'
      ? 'Tools, medium...'
      : 'Concepts, ideas, emotions...';

  const tooltipText =
    spaceName.toLowerCase() === 'material'
      ? 'This space includes all physical tools, materials, and techniques used to create the work.'
      : 'This space includes abstract ideas, themes, and emotions guiding the creative process.';

  const handleAddManually = () => {
    console.log('Add manually clicked');
    // Add functionality for manual category addition here
    setShowNewCategoryMenu(false);
  };

  const handleGenerateSuggestions = () => {
    console.log('Generate suggestions clicked');
    // Add functionality for generating suggestions here
    setShowNewCategoryMenu(false);
  };

  return (
    <div className={`space-box ${spaceName.toLowerCase()}-space`}>
      <div className="space-header">
        <h2>{spaceName} Space</h2>
        <img src={icon} alt={`${spaceName} Icon`} className="space-icon" />
      </div>
      <div className="space-info">
        <strong>
          <span className="space-description">{description}</span>
        </strong>
        <div
          className="help-icon-wrapper"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <img src={helpIcon} alt={`${spaceName} help`} className="help-icon" />
        </div>
        {showTooltip && <div className="tooltip">{tooltipText}</div>}
      </div>
      <div className="new-category-wrapper">
        <button
          className="new-category-button"
          onClick={() => setShowNewCategoryMenu((prev) => !prev)}
        >
          New category +
        </button>
        {showNewCategoryMenu && (
          <div ref={menuRef} className="new-category-menu">
            <span>Enter Category details yourself:</span>
            <button className="menu-option" onClick={handleAddManually}>
              Add manually
            </button>
            <span>Let the AI suggest categories based on your project and directions from you:</span>
            <button className="menu-option" onClick={handleGenerateSuggestions}>
              Generate suggestions
            </button>
          </div>
        )}
      </div>
      <NodeTree
        projectId={projectId}
        space={spaceName.toLowerCase()}
        onNodeClick={onHierarchyChange}
        selectedHierarchy={selectedHierarchy}
        onNodeDeselect={() => onHierarchyChange(null)}
        onGenerateImages={onGenerateImages}
      />
      <DefaultCategorySuggestions spaceName={spaceName.toLowerCase()} projectId={projectId} />
    </div>
  );
};

export default SpaceBox;
