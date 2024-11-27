import React from 'react';
import './SpaceBox.css'; // Import the CSS file
import NodeTree from './NodeTree'; // Import the NodeTree component

const SpaceBox = ({ projectId, spaceName }) => {
  return (
    <div className="conceptual-space">
      <h2>{spaceName} Space</h2>
      {/* Use the NodeTree component and pass projectId and space="material" */}
      <NodeTree projectId={projectId} space={spaceName.toLowerCase()} />
    </div>
  );
};

export default SpaceBox;
