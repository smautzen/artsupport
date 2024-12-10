import React, { useState } from 'react';
import './DefaultCategorySuggestions.css';

const DefaultCategorySuggestions = ({ spaceName }) => {
  const [animations, setAnimations] = useState([]);

  // Hardcoded lists of default suggestions with descriptions
  const suggestions = {
    material: [
      { title: 'Material category suggestion 1', description: 'Description for Material suggestion 1.' },
      { title: 'Material category suggestion 2', description: 'Description for Material suggestion 2.' },
      { title: 'Material category suggestion 3', description: 'Description for Material suggestion 3.' },
    ],
    conceptual: [
      { title: 'Conceptual category suggestion 1', description: 'Description for Conceptual suggestion 1.' },
      { title: 'Conceptual category suggestion 2', description: 'Description for Conceptual suggestion 2.' },
      { title: 'Conceptual category suggestion 3', description: 'Description for Conceptual suggestion 3.' },
    ],
  };

  const selectedSuggestions = suggestions[spaceName.toLowerCase()] || [];

  const handleSuggestionClick = (suggestion, event) => {
    const rect = event.target.getBoundingClientRect();
    const animationId = Date.now();

    setAnimations((prevAnimations) => [
      ...prevAnimations,
      {
        id: animationId,
        title: suggestion.title,
        startX: rect.left + rect.width / 6,
        startY: rect.top + rect.height / 2,
      },
    ]);

    setTimeout(() => {
      setAnimations((prevAnimations) => prevAnimations.filter((anim) => anim.id !== animationId));
    }, 1000);

    console.log('Clicked suggestion:', suggestion);
  };

  return (
    <div className="default-category-suggestions">
      <h3>Suggestions: (Click to add)</h3>
      <ul>
        {selectedSuggestions.map((suggestion, index) => (
          <li
            key={index}
            className="clickable-suggestion"
            onClick={(event) => handleSuggestionClick(suggestion, event)}
          >
            <strong>{suggestion.title}</strong>
            <p>{suggestion.description}</p>
          </li>
        ))}
      </ul>
      {animations.map((animation) => (
        <div
          key={animation.id}
          className="phantom-up"
          style={{ left: animation.startX, top: animation.startY }}
        >
          {animation.title}
        </div>
      ))}
    </div>
  );
};

export default DefaultCategorySuggestions;
