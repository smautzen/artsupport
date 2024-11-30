import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SystemMessage.css';

const SystemMessage = ({ payload, projectId, messageId }) => {
  const [likedSuggestions, setLikedSuggestions] = useState({});

  useEffect(() => {
    // Initialize liked suggestions from payload
    if (payload && Array.isArray(payload)) {
      const likedData = payload.reduce((acc, item, index) => {
        acc[index] = {
          liked: item.liked || false,
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
      const suggestion = payload[index];

      if (!suggestion) {
        console.error('Invalid suggestion at index:', index);
        return;
      }

      let requestBody;

      // If a node is clicked
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
          title: node.title, // Node-specific data
          description: node.description || 'No description provided',
          categoryTitle: suggestion.title, // Parent category title
          categoryDescription: suggestion.description || 'No description available',
        };

        // Update local state for the node
        setLikedSuggestions((prev) => ({
          ...prev,
          [index]: {
            ...prev[index],
            nodes: {
              ...prev[index]?.nodes,
              [nodeId]: true,
            },
          },
        }));
      } else {
        // If a category is clicked
        requestBody = {
          projectId,
          messageId,
          suggestionIndex: index,
          type: 'category',
          title: suggestion.title,
          description: suggestion.description || 'No description provided',
        };

        // Update local state for the category
        setLikedSuggestions((prev) => ({
          ...prev,
          [index]: {
            ...prev[index],
            liked: true,
          },
        }));
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
