import React from 'react';
import './NodesContainer.css';

const NodesContainer = ({ selectedHierarchy, onRemoveNode }) => {
  const extractLastNode = (hierarchy) => {
    if (!hierarchy) return null;
    console.log('Initial hierarchy:', hierarchy);

    // Determine the deepest node in the hierarchy
    if (hierarchy.childNode) {
      console.log('Extracted last node (childNode):', hierarchy.childNode);
      return hierarchy.childNode;
    }
    if (hierarchy.node) {
      console.log('Extracted last node (node):', hierarchy.node);
      return hierarchy.node;
    }
    if (hierarchy.category) {
      console.log('Extracted last node (category):', hierarchy.category);
      return hierarchy.category;
    }

    console.error('No valid node found in hierarchy:', hierarchy);
    return null;
  };

  const validateHierarchy = (hierarchy) => {
    if (!hierarchy || typeof hierarchy !== 'object') {
      console.error('Invalid hierarchy structure:', hierarchy);
      return false;
    }
    return true;
  };

  if (!validateHierarchy(selectedHierarchy)) {
    console.error('Hierarchy validation failed.');
    return <div className="nodes-container">Invalid hierarchy</div>;
  }

  const lastNode = extractLastNode(selectedHierarchy);

  const handleRemoveClick = () => {
    console.log('Attempting to remove hierarchy:', selectedHierarchy);
    if (onRemoveNode) {
      console.log('Last node being removed:', lastNode);
      onRemoveNode(selectedHierarchy);
    } else {
      console.error('onRemoveNode function is not defined');
    }
  };

  return (
    <div className="nodes-container">
      <div className="nodes-scrollable">
        {lastNode ? (
          <div key={lastNode.id} className="node-item">
            <div
              className="node-name"
              style={{
                backgroundColor: selectedHierarchy.space === 'material' ? '#007bff' : '#28a745',
              }}
            >
              {lastNode.title || 'Unnamed Node'} ({lastNode.type || 'Type Unavailable'})
            </div>
            <div className="node-delete">
              <button
                className="node-delete-btn"
                onClick={handleRemoveClick}
              >
                x
              </button>
            </div>
          </div>
        ) : (
          <div>No node selected</div>
        )}
      </div>
    </div>
  );
};

export default NodesContainer;
