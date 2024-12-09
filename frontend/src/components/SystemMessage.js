import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SystemMessage.css';

const SystemMessage = ({ payload, projectId, messageId }) => {
  const [likedSuggestions, setLikedSuggestions] = useState({});
  const [animations, setAnimations] = useState([]); // Track multiple active animations
  const [overlayImage, setOverlayImage] = useState(null); // Track the image for the overlay

  useEffect(() => {
    if (payload && Array.isArray(payload)) {
      const likedData = payload.reduce((acc, item, index) => {
        const anyNodeLiked = (item.nodes || []).some((node) => node.liked);
        acc[index] = {
          liked: item.liked || anyNodeLiked,
          nodes: (item.nodes || []).reduce((nodeAcc, node) => {
            nodeAcc[node.id] = node.liked || false;
            return nodeAcc;
          }, {}),
        };
        return acc;
      }, {});
      setLikedSuggestions(likedData);
    }
  }, [payload]);

  const handleLike = async (index, nodeId = null, event) => {
    // The like logic remains unchanged
  };

  const openOverlay = (imageUrl) => {
    setOverlayImage(imageUrl);
  };

  const closeOverlay = () => {
    setOverlayImage(null);
  };

  return (
    <div className="system-message">
      <h4>Suggestions:</h4>
      {animations.map((animation) => (
        <div
          key={animation.id}
          className={`phantom phantom-${animation.target}`}
          style={{
            left: animation.startX,
            top: animation.startY,
          }}
        >
          {animation.title}
        </div>
      ))}
      {Array.isArray(payload) && payload.length > 0 ? (
        payload.map((item, index) => (
          <div key={`suggestion-${index}`} className="suggestion">
            <button
              className={`highlight-button ${likedSuggestions[index]?.liked ? 'liked' : ''}`}
              onClick={(event) => handleLike(index, null, event)}
              disabled={likedSuggestions[index]?.liked}
            >
              {item.title || 'Unnamed Suggestion'}
            </button>
            <div className="item-description">{item.description || 'No description available'}</div>
            {item.url && (
              <div className="image-container">
                <img
                  src={item.url}
                  alt={item.title || 'Generated Image'}
                  className="suggestion-image"
                  onClick={() => openOverlay(item.url)}
                />
              </div>
            )}
            <ul>
              {item.nodes &&
                item.nodes.map((node) => (
                  <li key={`node-${node.id}`}>
                    <button
                      className={`highlight-button ${
                        likedSuggestions[index]?.nodes?.[node.id] ? 'liked' : ''
                      }`}
                      onClick={(event) => handleLike(index, node.id, event)}
                      disabled={likedSuggestions[index]?.nodes?.[node.id]}
                    >
                      {node.title || 'Unnamed Node'}
                    </button>{' '}
                    - {node.description || 'No description'} ({node.type})
                  </li>
                ))}
            </ul>
          </div>
        ))
      ) : (
        <p>No suggestions available.</p>
      )}

      {/* Overlay */}
      {overlayImage && (
        <div className="overlay" onClick={closeOverlay}>
          <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
            <img src={overlayImage} alt="Full Size" className="overlay-image" />
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemMessage;
