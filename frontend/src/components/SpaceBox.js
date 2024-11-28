import React from 'react';
import './SpaceBox.css'; // Import the CSS file
import NodeTree from './NodeTree'; // Import the NodeTree component

import materialSpaceIcon from '../assets/materialspace.png';
import conceptualSpaceIcon from '../assets/conceptualspace.png';
import helpIcon from '../assets/help.png';

const SpaceBox = ({ projectId, spaceName, onNodeClick }) => {
  const icon = spaceName.toLowerCase() === 'material' ? materialSpaceIcon : conceptualSpaceIcon;

  // Set the description based on spaceName
  const description =
    spaceName.toLowerCase() === 'material'
      ? 'Tools, medium...'
      : 'Concepts, ideas, emotions...';

  return (
    <div className={`space-box ${spaceName.toLowerCase()}-space`}>
      <div className="space-header">
        <h2>{spaceName} Space</h2>
        <img src={icon} alt={`${spaceName} Icon`} className="space-icon" />
      </div>
      <div className="space-info">
      <strong><span className="space-description">{description}</span></strong>
      <img src={helpIcon} alt={`${spaceName} help`} className="help-icon" />
      </div>
      <NodeTree
        projectId={projectId}
        space={spaceName.toLowerCase()}
        onNodeClick={onNodeClick}
      />
    </div>
  );
};

export default SpaceBox;
