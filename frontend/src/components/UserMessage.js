import React, { useEffect } from 'react';
import './UserMessage.css';

const UserMessage = ({ content, timestamp, linkedHierarchy }) => {
  useEffect(() => {
    if (linkedHierarchy) {
      console.log('Attached Hierarchy:', linkedHierarchy);
    }
  }, [linkedHierarchy]);

  const getFinalNode = (hierarchy) => {
    if (hierarchy.childNode) {
      return hierarchy.childNode;
    } else if (hierarchy.node) {
      return hierarchy.node;
    } else {
      return hierarchy.category;
    }
  };

  const finalNode = linkedHierarchy ? getFinalNode(linkedHierarchy) : null;

  return (
    <div>
      <div className="timestamp">{new Date(timestamp).toLocaleString()}</div>
      {finalNode && (
        <div className="user-message">
          <div className="attached-nodes">
            <span>Attached Node:</span>
            <div className="node-list">
              <span key={finalNode.id} className="node-pill" data-description={finalNode.description}>
                {finalNode.title}
              </span>
            </div>
          </div>
        </div>
      )}
      <div className="message-content">{content}</div>
    </div>
  );
};

export default UserMessage;