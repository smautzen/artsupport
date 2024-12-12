import React, { useState } from 'react';
import './ImageNodeComponent.css';

const ImageNodeComponent = ({ node }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageClick = (uri) => {
    setSelectedImage(uri); // Set the clicked image as the selected one
  };

  const closeOverlay = () => {
    setSelectedImage(null); // Close the overlay by resetting the state
  };

  if (!node || !node.images || !Array.isArray(node.images) || node.images.length === 0) {
    // Do not render anything if there are no images
    return null;
  }

  return (
    <div className="image-node">
      <h3>Images:</h3>
      <div className="image-row">
        {node.images.map((image, index) => (
          <img
            key={index}
            src={image.url}
            alt={image.title || `Image ${index + 1}`}
            className="thumbnail"
            onClick={() => handleImageClick(image.url)} // Handle click to open overlay
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
