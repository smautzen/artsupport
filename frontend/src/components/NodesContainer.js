import React from 'react';
import './NodesContainer.css';

const NodesContainer = ({ selectedNodes, onRemoveNode }) => {
  return (
    <div className="nodes-container">
      <div className="nodes-scrollable">
        {selectedNodes.map((node) => (
          <div key={node.id} className="node-item">
            <div
              className="node-name"
              style={{
                backgroundColor: node.space === 'material' ? '#007bff' : '#28a745',
              }}
            >
              {node.title}
            </div>
            <div className="node-delete">
              <button
                className="node-delete-btn"
                onClick={() => onRemoveNode(node.id)}
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NodesContainer;
