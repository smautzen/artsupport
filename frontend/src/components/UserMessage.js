import React, { useEffect } from 'react';
import './UserMessage.css';


const UserMessage = ({ content, timestamp, linkedNodes }) => {
  useEffect(() => {
    if (linkedNodes && linkedNodes.length > 0) {
      console.log('Attached Nodes:', linkedNodes);
    }
  }, [linkedNodes]);

  return (
    <div>
    <div className="timestamp">{new Date(timestamp).toLocaleString()}</div>
      {linkedNodes && linkedNodes.length > 0 && (
            <div className="user-message">
        <div className="attached-nodes">
          <span>Attached Nodes:</span>
          <div className="node-list">
            {linkedNodes.map((node) => (
              <span key={node.id} className="node-pill" data-description={node.description}>
              {node.title}
              </span>            
            ))}
          </div>
        </div>
        </div>
      )}
    <div className="message-content">{content}</div>
    </div>
  );
};

export default UserMessage;
