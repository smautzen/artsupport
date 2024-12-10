import React, { useState } from 'react';
import './SpaceBox.css'; // Import the CSS file
import NodeTree from './NodeTree'; // Import the NodeTree component
import DefaultCategorySuggestions from './DefaultCategorySuggestions';

import materialSpaceIcon from '../assets/materialspace.png';
import conceptualSpaceIcon from '../assets/conceptualspace.png';
import helpIcon from '../assets/help.png';

const SpaceBox = ({ projectId, spaceName, onNodeClick, selectedNodes, onNodeDeselect }) => {
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
      <NodeTree
        projectId={projectId}
        space={spaceName.toLowerCase()}
        onNodeClick={onNodeClick}
        selectedNodes={selectedNodes}
        onNodeDeselect={onNodeDeselect}
      />
      <DefaultCategorySuggestions spaceName={spaceName} />
</div>
  );
};

export default SpaceBox;
