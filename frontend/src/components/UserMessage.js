import React from 'react';
import './UserMessage.css';

const UserMessage = ({ content, timestamp }) => {
  return (
    <div className="user-message">
      <div className="timestamp">{new Date(timestamp).toLocaleString()}</div>
      <div className="message-content">{content}</div>
    </div>
  );
};

export default UserMessage;
