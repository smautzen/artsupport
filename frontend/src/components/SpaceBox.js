import React from 'react';
import './SpaceBox.css'; // Import the CSS file
import NodeTree from './NodeTree'; // Import the NodeTree component

const SpaceBox = ({ projectId, spaceName, onNodeClick }) => {
  return (
    <div className={`space-box ${spaceName.toLowerCase()}-space`}>
      <h2>{spaceName} Space</h2>
      <NodeTree
        projectId={projectId}
        space={spaceName.toLowerCase()}
        onNodeClick={onNodeClick}
      />
    </div>
  );
};

export default SpaceBox;
