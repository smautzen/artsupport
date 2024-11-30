import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SystemMessage.css';

const SystemMessage = ({ payload, projectId, messageId }) => {
  const [likedSuggestions, setLikedSuggestions] = useState([]);

  useEffect(() => {
    // Extract the indices of liked suggestions from the payload
    if (payload && Array.isArray(payload)) {
      const likedIndices = payload
        .map((item, index) => (item.liked ? index : null))
        .filter((index) => index !== null); // Filter out null values
      setLikedSuggestions(likedIndices);
    }
  }, [payload]);

  const handleLike = async (index) => {
    try {
      await axios.post('http://localhost:4000/likeSuggestion', {
        projectId,
        messageId,
        suggestionIndex: index,
      });

      // Update the local state
      setLikedSuggestions((prev) => [...prev, index]);
    } catch (error) {
      console.error('Error liking suggestion:', error);
    }
  };

  return (
    <div className="system-message">
      <h4>Suggestions:</h4>
      {Array.isArray(payload) && payload.length > 0 ? (
        payload.map((item, index) => (
          <div key={index} className="suggestion">
            <button
              className={`highlight-button ${likedSuggestions.includes(index) ? 'liked' : ''}`}
              onClick={() => handleLike(index)}
              disabled={likedSuggestions.includes(index)}
            >
              {item.name}
            </button>
            <div className="item-title">{item.title}</div>
            <ul>
              {item.nodes &&
                item.nodes.map((node, idx) => (
                  <li key={idx}>
                    <button className="highlight-button" onClick={() => console.log(node.name, node.id)}>
                      {node.name}
                    </button>{' '}
                    - {node.title} ({node.type})
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
