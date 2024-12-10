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
    try {
      const suggestion = payload[index];
      if (!suggestion) return;

      console.log('Selected suggestion:', suggestion); // Log the selected suggestion

      const rect = event.target.getBoundingClientRect(); // Get button position
      const targetSpace = suggestion.space === 'material' ? 'left' : 'right'; // Determine direction
      const animationId = Date.now(); // Unique ID for this animation

      // Log animation details
      console.log('Animation details:', {
        animationId,
        title: nodeId
          ? suggestion.nodes.find((n) => n.id === nodeId)?.title || 'Unnamed Node'
          : suggestion.title || 'Unnamed Suggestion',
        targetSpace,
        startX: rect.left + rect.width / 2,
        startY: rect.top + rect.height / 2,
      });

      // Add to animations array
      setAnimations((prevAnimations) => [
        ...prevAnimations,
        {
          id: animationId,
          title: nodeId
            ? suggestion.nodes.find((n) => n.id === nodeId)?.title || 'Unnamed Node'
            : suggestion.title || 'Unnamed Suggestion',
          target: targetSpace,
          startX: rect.left + rect.width / 2,
          startY: rect.top + rect.height / 2,
        },
      ]);

      // Build requestBody for Firestore update
      const requestBody = nodeId
        ? {
            projectId,
            messageId,
            suggestionIndex: index,
            type: 'node',
            nodeId,
            categoryId: suggestion.id,
            title: suggestion.nodes.find((n) => n.id === nodeId)?.title || 'Unnamed Node',
            description: suggestion.nodes.find((n) => n.id === nodeId)?.description || '',
            categoryTitle: suggestion.title,
            categoryDescription: suggestion.description || '',
          }
        : {
            projectId,
            messageId,
            suggestionIndex: index,
            type: 'category',
            categoryId: suggestion.id,
            title: suggestion.title,
            description: suggestion.description || '',
          };

      // Log the request body being sent to the backend
      console.log('Request body being sent:', requestBody);

      // Update Firestore via API call
      const response = await axios.post('http://localhost:4000/likeSuggestion', requestBody);

      // Log the response from the backend
      console.log('Response from server:', response);

      // Remove animation after 1 second
      setTimeout(() => {
        setAnimations((prevAnimations) =>
          prevAnimations.filter((anim) => anim.id !== animationId)
        );
      }, 1000); // Match animation duration
    } catch (error) {
      console.error('Error liking suggestion:', error);
    }
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
          <div
            key={`suggestion-${index}`}
            className={`suggestion ${item.url && likedSuggestions[index]?.liked ? 'liked-suggestion' : ''}`}
          >
            <div className="timestamp">
              {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Timestamp not available'}
            </div>
            {item.url ? (
              // Image suggestion with overlayed Like button
              <div className="image-container">
                <button
                  className={`like-button ${likedSuggestions[index]?.liked ? 'liked' : ''}`}
                  onClick={(event) => handleLike(index, null, event)}
                  disabled={likedSuggestions[index]?.liked}
                >
                  {likedSuggestions[index]?.liked ? 'Liked' : 'Like'}
                </button>
                <img
                  src={item.url}
                  alt={item.title || 'Generated Image'}
                  className="suggestion-image"
                  onClick={() => openOverlay(item.url)}
                />
                <div className="image-title">
                  <strong>{item.title || 'Unnamed Suggestion'}</strong>
                </div>
              </div>
            ) : (
              // Text suggestion with original behavior
              <>
                <button
                  className={`highlight-button ${likedSuggestions[index]?.liked ? 'liked' : ''}`}
                  onClick={(event) => handleLike(index, null, event)}
                  disabled={likedSuggestions[index]?.liked}
                >
                  {item.title || 'Unnamed Suggestion'}
                </button>
                <div className="item-description">
                  {item.description || 'No description available'}
                </div>
              </>
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
