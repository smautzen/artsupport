import React from 'react';
import './SpaceBox.css'; // Import the CSS file
import NodeTree from './NodeTree'; // Import the NodeTree component

const SpaceBox = ({ projectId, spaceName }) => {
  return (
    <div className={`space-box ${spaceName.toLowerCase()}-space`}>
      <h2>{spaceName} Space</h2>
      <NodeTree projectId={projectId} space={spaceName.toLowerCase()} />
      {/* <div style={{ height: '90vh', border: '1px solid red', color: 'red'}}></div> */}
    </div>
  );
};

export default SpaceBox;
