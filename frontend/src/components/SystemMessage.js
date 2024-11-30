import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SystemMessage.css';

const SystemMessage = ({ payload, projectId, messageId }) => {
  const [likedSuggestions, setLikedSuggestions] = useState({});

  useEffect(() => {
    // Initialize liked suggestions from payload
    if (payload && Array.isArray(payload)) {
      const likedData = payload.reduce((acc, item, index) => {
        // Check if any child node is liked
        const anyNodeLiked = (item.nodes || []).some((node) => node.liked);
        acc[index] = {
          liked: item.liked || anyNodeLiked, // Force category as liked if any child node is liked
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

  const handleLike = async (index, nodeId = null) => {
    try {
      console.log('Clicked Node ID:', nodeId);
      console.log('Parent Category Index:', index);

      const suggestion = payload[index];

      if (!suggestion) {
        console.error('Invalid suggestion at index:', index);
        return;
      }

      let requestBody;

      if (nodeId) {
        const node = suggestion.nodes.find((n) => n.id === nodeId); // Use ID to find the node

        if (!node) {
          console.error('Node not found with ID:', nodeId);
          return;
        }

        console.log('Node object:', node);

        requestBody = {
          projectId,
          messageId,
          suggestionIndex: index,
          type: 'node',
          nodeId: node.id, // Include node ID
          categoryId: suggestion.id, // Include parent category ID
          title: node.title,
          description: node.description || 'No description provided',
          categoryTitle: suggestion.title,
          categoryDescription: suggestion.description || 'No description available',
        };

        console.log('Parent Category Title:', suggestion.title);
      } else {
        requestBody = {
          projectId,
          messageId,
          suggestionIndex: index,
          type: 'category',
          categoryId: suggestion.id, // Include category ID
          title: suggestion.title,
          description: suggestion.description || 'No description provided',
        };

        console.log('Category Title:', suggestion.title);
      }

      console.log('Request payload before sending:', requestBody);

      const response = await axios.post('http://localhost:4000/likeSuggestion', requestBody);

      console.log('Server response:', response.data);
    } catch (error) {
      console.error('Error liking suggestion:', error);
    }
  };

  return (
    <div className="system-message">
      <h4>Suggestions:</h4>
      {Array.isArray(payload) && payload.length > 0 ? (
        payload.map((item, index) => (
          <div key={`suggestion-${index}`} className="suggestion">
            <button
              className={`highlight-button ${likedSuggestions[index]?.liked ? 'liked' : ''}`}
              onClick={() => handleLike(index)}
              disabled={likedSuggestions[index]?.liked}
            >
              {item.title || 'Unnamed Suggestion'}
            </button>
            <div className="item-description">{item.description || 'No description available'}</div>
            <ul>
              {item.nodes &&
                item.nodes.map((node) => (
                  <li key={`node-${node.id}`}>
                    <button
                      className={`highlight-button ${
                        likedSuggestions[index]?.nodes?.[node.id] ? 'liked' : ''
                      }`}
                      onClick={() => handleLike(index, node.id)}
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
    </div>
  );
};

export default SystemMessage;
