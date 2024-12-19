import React, { useEffect } from 'react';
import AddNodeComponent from './AddNodeComponent'; // Import AddNodeComponent
import './OverlayComponent.css';

const OverlayComponent = ({ action, item, onClose }) => {
    useEffect(() => {
        console.log('OverlayComponent rendered with:', { action, item });
      }, [action, item]);
      
  
    if (!action || !item) {
    return null;
  }

  const renderContent = () => {
    switch (action) {
      case 'image':
        return <img src={item.url} alt={item.title || 'Image'} className="full-image" />;
      case 'text':
        return <p className="text-content">{item.text}</p>;
      case 'addnode': // Add support for the AddNodeComponent
        return (
          <AddNodeComponent
            hierarchy={item} // Pass the hierarchy from item
            onClose={onClose}
            onAdd={item.onAdd} // Pass the onAdd handler from item
          />
        );
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
