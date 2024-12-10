import React, { useEffect, useState } from 'react';
import { db } from '../firebase/firebase-config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import axios from 'axios'; // Add Axios for API requests
import './DefaultCategorySuggestions.css';

const DefaultCategorySuggestions = ({ projectId, spaceName }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [animations, setAnimations] = useState([]);

  useEffect(() => {
    if (!projectId || !spaceName) {
      console.warn('Missing projectId or spaceName:', { projectId, spaceName });
      return;
    }

    const suggestionsRef = collection(db, 'projects', projectId, 'defaultSuggestions', spaceName, 'items');
    console.log('Suggestions Firestore Reference:', suggestionsRef);

    const suggestionsQuery = query(suggestionsRef, where('show', '==', true));
    console.log('Firestore Query Created:', suggestionsQuery);

    const unsubscribe = onSnapshot(
      suggestionsQuery,
      (snapshot) => {
        console.log('Snapshot received:', snapshot.size, 'documents.');
        snapshot.docs.forEach((doc) =>
          console.log('Document fetched:', { id: doc.id, data: doc.data() })
        );

        const fetchedSuggestions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log('Fetched Suggestions:', fetchedSuggestions);
        setSuggestions(fetchedSuggestions);
      },
      (error) => {
        console.error('Error fetching snapshot:', error);
      }
    );

    return () => {
      console.log('Cleaning up Firestore listener');
      unsubscribe();
    };
  }, [projectId, spaceName]);

  const handleSuggestionClick = async (suggestion, event) => {
    const rect = event.target.getBoundingClientRect();
    const animationId = Date.now();

    // Add the animation
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

    // Hit the likeDefaultSuggestion endpoint
    try {
      const response = await axios.post('http://localhost:4000/likeDefaultSuggestion', {
        projectId,
        spaceName,
        suggestionId: suggestion.id,
        title: suggestion.title,
        description: suggestion.description,
      });

      console.log('Response from liking suggestion:', response.data);
    } catch (error) {
      console.error('Error liking suggestion:', error);
    }
  };

  return suggestions.length > 0 ? (
    <div className="default-category-suggestions">
      <h3>Suggestions: (Click to add)</h3>
      <ul>
        {suggestions.map((suggestion) => (
          <li
            key={suggestion.id}
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
  ) : null;
  
};

export default DefaultCategorySuggestions;
