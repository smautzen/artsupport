import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import './SystemMessage.css';

const ImageSuggestions = ({ imageId, projectId, openOverlay }) => {
  const [imageData, setImageData] = useState(null);

  // Subscribe to the Firestore image document
  useEffect(() => {
    if (!imageId || !projectId) return;

    const imageRef = doc(db, 'projects', projectId, 'images', imageId);

    const unsubscribe = onSnapshot(
      imageRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setImageData(snapshot.data());
        } else {
          console.error(`Image with ID ${imageId} not found.`);
        }
      },
      (error) => {
        console.error('Error subscribing to the image document:', error);
      }
    );

    return () => unsubscribe();
  }, [imageId, projectId]);

  if (!imageData) {
    return <div className="suggestion">Loading image data...</div>;
  }

  const { url, title, liked, timestamp, description } = imageData;

  return (
    <div className={`suggestion ${liked ? 'liked-suggestion' : ''}`}>
      <div className="timestamp">
        {timestamp ? new Date(timestamp).toLocaleString() : 'Timestamp not available'}
      </div>
      <div className="image-container">
        <button
          className={`like-button ${liked ? 'liked' : ''}`}
          onClick={() => console.log('Like button clicked for image', imageId)}
          disabled={liked}
        >
          {liked ? 'Liked' : 'Like'}
        </button>
        {url ? (
          <img
            src={url}
            alt={title || 'Generated Image'}
            className="suggestion-image"
            onClick={() => openOverlay(url)}
          />
        ) : (
          <div className="missing-image">Image URL is missing</div>
        )}
        <div className="image-title">
          <strong>{title || 'Unnamed Suggestion'}</strong>
        </div>
        <div className="image-description">
          {description || 'No description provided.'}
        </div>
      </div>
    </div>
  );
};

export default ImageSuggestions;
