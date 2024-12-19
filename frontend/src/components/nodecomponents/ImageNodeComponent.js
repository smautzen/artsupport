import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase-config';
import OverlayComponent from '../Overlay/OverlayComponent';
import './ImageNodeComponent.css';

const ImageNodeComponent = ({ node, projectId }) => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

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

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const closeOverlay = () => {
    setSelectedImage(null);
  };

  if (!images || images.length === 0) {
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
            onClick={() => handleImageClick(image)}
          />
        ))}
      </div>

      {selectedImage && (
        <OverlayComponent
          action="image"
          item={selectedImage}
          onClose={closeOverlay}
        />
      )}
    </div>
  );
};

export default ImageNodeComponent;
