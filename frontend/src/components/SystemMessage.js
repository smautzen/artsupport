import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SystemMessage.css';
import ImageSuggestions from './ImageSuggestions';
import NodeSuggestions from './NodeSuggestions';
import EntitySuggestions from './EntitySuggestions';

const SystemMessage = ({ action, payload, projectId, messageId }) => {
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

      const rect = event.target.getBoundingClientRect();
      const targetSpace = suggestion.space === 'material' ? 'left' : 'right';
      const animationId = Date.now();

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

      let endpoint;
      let requestBody;

      switch (action) {
        case 'images':
          endpoint = 'http://localhost:4000/likeImage';
          requestBody = {
            projectId,
            messageId,
            suggestionIndex: index,
            title: suggestion.title || 'Unnamed Image',
            description: suggestion.description || 'No description provided',
            url: suggestion.url,
          };
          break;
        case 'entities':
          endpoint = 'http://localhost:4000/likeEntity';
          requestBody = {
            projectId,
            messageId,
            suggestionIndex: index,
          };
          break;
        default:
          endpoint = 'http://localhost:4000/likeSuggestion';
          requestBody = nodeId
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
      }

      await axios.post(endpoint, requestBody);

console.log('PL:',requestBody);

      setTimeout(() => {
        setAnimations((prevAnimations) =>
          prevAnimations.filter((anim) => anim.id !== animationId)
        );
      }, 1000);
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
        payload.map((item, index) => {
          switch (action) {
            case 'images':
              return (
                <ImageSuggestions
                  key={`suggestion-${index}`}
                  item={item}
                  index={index}
                  likedSuggestions={likedSuggestions}
                  handleLike={handleLike}
                  openOverlay={openOverlay}
                />
              );
            case 'entities':
              return (
                <EntitySuggestions
                  key={`suggestion-${index}`}
                  item={item}
                  index={index}
                  handleLike={handleLike}
                />
              );
            default:
              return (
                <NodeSuggestions
                  key={`suggestion-${index}`}
                  item={item}
                  index={index}
                  likedSuggestions={likedSuggestions}
                  handleLike={handleLike}
                />
              );
          }
        })
      ) : (
        <p>No suggestions available.</p>
      )}

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
