import React, { useEffect, useState } from 'react';
import { db } from '../firebase/firebase-config';
import { collection, onSnapshot } from 'firebase/firestore';
import './ConceptualSpace.css'; // Import the CSS file

const ConceptualSpace = ({ projectId }) => {
  const [concepts, setConcepts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId) {
      console.error('ConceptualSpace: Missing projectId.');
      setError('No project selected.');
      return;
    }

    const conceptualRef = collection(db, 'projects', projectId, 'conceptual');
    const unsubscribe = onSnapshot(
      conceptualRef,
      (snapshot) => {
        const conceptualData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('Conceptual data fetched:', conceptualData);
        setConcepts(conceptualData);
        setError(null); // Clear previous errors
      },
      (err) => {
        console.error('Error fetching conceptual space:', err);
        setError('Failed to fetch conceptual data.');
      }
    );

    return () => unsubscribe(); // Clean up the listener
  }, [projectId]);

  return (
    <div className="conceptual-space">
      <h2>Conceptual Space</h2>
      {error && <p className="error">{error}</p>}
      {concepts.length === 0 ? (
        <p className="empty-state">No concepts added yet. Start building your conceptual space!</p>
      ) : (
        <ul className="conceptual-list">
          {concepts.map((concept) => (
            <li key={concept.id} className="concept-item">
              <strong>{concept.title}</strong>: {concept.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ConceptualSpace;
