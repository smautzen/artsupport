import React, { useState } from 'react';
import './ImageNodeComponent.css'; // Include this for styling

const ImageNodeComponent = ({ node }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageClick = (uri) => {
    setSelectedImage(uri); // Set the clicked image as the selected one
  };

  const closeOverlay = () => {
    setSelectedImage(null); // Close the overlay by resetting the state
  };

  return (
    <div className="image-node">
      <p>{node.description}</p>
      <div className="image-row">
        {node.images.map((uri, index) => (
          <img
            key={index}
            src={uri}
            alt={`Image ${index + 1}`}
            className="thumbnail"
            onClick={() => handleImageClick(uri)} // Handle click to open overlay
          />
        ))}
      </div>

      {selectedImage && (
        <div className="overlay" onClick={closeOverlay}>
          <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Full Size" className="full-image" />
            <button className="close-button" onClick={closeOverlay}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageNodeComponent;
