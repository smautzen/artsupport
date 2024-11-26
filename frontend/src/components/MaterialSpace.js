import React, { useEffect, useState } from 'react';
import { db } from '../firebase/firebase-config';
import { collection, onSnapshot } from 'firebase/firestore';
import './MaterialSpace.css'; // Import the CSS file

const MaterialSpace = ({ projectId }) => {
  const [materials, setMaterials] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId) {
      console.error('MaterialSpace: Missing projectId.');
      setError('No project selected.');
      return;
    }

    const materialRef = collection(db, 'projects', projectId, 'material');
    const unsubscribe = onSnapshot(
      materialRef,
      (snapshot) => {
        const materialData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMaterials(materialData);
        setError(null); // Clear any previous errors
      },
      (err) => {
        console.error('Error fetching material space:', err);
        setError('Failed to fetch materials.');
      }
    );

    return () => unsubscribe(); // Clean up the listener
  }, [projectId]);

  return (
    <div className="material-space">
      <h2>Material Space</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {materials.length === 0 ? (
        <p>No materials found. Start by adding new material data.</p>
      ) : (
        <ul>
          {materials.map((material) => (
            <li key={material.id}>
              <strong>{material.title}</strong>: {material.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MaterialSpace;
