import React from 'react';
import './OverlayComponent.css';

const OverlayComponent = ({ action, item, onClose }) => {
  if (!action || !item) {
    return null;
  }

  const renderContent = () => {
    switch (action) {
      case 'image':
        return <img src={item.url} alt={item.title || 'Image'} className="full-image" />;
      case 'text':
        return <p className="text-content">{item.text}</p>;
      // Add more cases for other subcomponents as needed
      default:
        return <p>Unsupported action type: {action}</p>;
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
        {renderContent()}
        <button className="close-button" onClick={onClose}>
          x
        </button>
      </div>
    </div>
  );
};

export default OverlayComponent;
