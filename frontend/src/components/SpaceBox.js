import React, { useState, useEffect } from 'react';
import './SpaceBox.css';
import NodeTree from './NodeTree';
import DefaultCategorySuggestions from './DefaultCategorySuggestions';
import NewNodeComponent from './NewNodeComponent';

import materialSpaceIcon from '../assets/materialspace.png';
import conceptualSpaceIcon from '../assets/conceptualspace.png';
import helpIcon from '../assets/help.png';

const SpaceBox = ({ projectId, spaceName, onHierarchyChange, selectedHierarchy, onGenerateImages }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const icon = spaceName.toLowerCase() === 'material' ? materialSpaceIcon : conceptualSpaceIcon;

  const description =
    spaceName.toLowerCase() === 'material'
      ? 'Tools, medium...'
      : 'Concepts, ideas, emotions...';

  const tooltipText =
    spaceName.toLowerCase() === 'material'
      ? 'This space includes all physical tools, materials, and techniques used to create the work.'
      : 'This space includes abstract ideas, themes, and emotions guiding the creative process.';

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
        <NewNodeComponent
          projectId={projectId}
          spaceName={spaceName}
          category={null}
          node={null}
          childNode={null} />
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
