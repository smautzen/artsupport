import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';

function MaterialSpace({ projectId }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchMaterialSpace = async () => {
      try {
        const q = query(
          collection(db, 'categories'),
          where('type', '==', 'material space'),
          where('projectId', '==', projectId)
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(data);
      } catch (error) {
        console.error('Error fetching material space:', error);
      }
    };

    fetchMaterialSpace();
  }, [projectId]);

  return (
    <div>
      <h2>Material Space</h2>
      <ul>
        {categories.map(category => (
          <li key={category.id}>
            <strong>{category.name}</strong>
            <ul>
              {category.subnodes?.map((subnode, index) => (
                <li key={index}>{subnode}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MaterialSpace;
