import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase-config';
import './ImageNodeComponent.css';

const ImageNodeComponent = ({ node, projectId }) => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  // Fetch image data from Firestore using IDs in the node's images array
  useEffect(() => {
    const fetchImages = async () => {
      if (!node || !node.images || !Array.isArray(node.images) || node.images.length === 0) {
        setImages([]);
        return;
      }

      try {
        const imagePromises = node.images.map(async (imageId) => {
          const imageRef = doc(db, 'projects', projectId, 'images', imageId);
          const imageSnapshot = await getDoc(imageRef);
          if (imageSnapshot.exists()) {
            return { id: imageId, ...imageSnapshot.data() };
          } else {
            console.warn(`Image with ID ${imageId} not found.`);
            return null;
          }
        });

        const fetchedImages = await Promise.all(imagePromises);
        setImages(fetchedImages.filter((image) => image !== null));
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };

    fetchImages();
  }, [node, projectId]);

  const handleImageClick = (uri) => {
    setSelectedImage(uri); // Set the clicked image as the selected one
  };

  const closeOverlay = () => {
    setSelectedImage(null); // Close the overlay by resetting the state
  };

  if (!images || images.length === 0) {
    // Do not render anything if there are no images
    return null;
  }

  return (
    <div className="image-node">
      <h3>Images:</h3>
      <div className="image-row">
        {images.map((image) => (
          <img
            key={image.id}
            src={image.url}
            alt={image.title || 'Untitled Image'}
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
