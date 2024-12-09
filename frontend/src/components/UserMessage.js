import React, { useEffect } from 'react';

const UserMessage = ({ content, timestamp, linkedNodes }) => {
  useEffect(() => {
    if (linkedNodes && linkedNodes.length > 0) {
        console.log('Attached Nodes:', linkedNodes);
      }  }, [linkedNodes]);

  return (
    <div>
      <div className="timestamp">{new Date(timestamp).toLocaleString()}</div>
      {linkedNodes && linkedNodes.length > 0 && (
        <div>
          <strong>Attached Nodes:</strong>
          <ul>
            {linkedNodes.map((node) => (
              <li key={node.id}>{node.title}</li>
            ))}
          </ul>
        </div>
      )}
      <div>{content}</div>
    </div>
  );
};

export default UserMessage;
