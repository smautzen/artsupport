import React, { useEffect, useState } from 'react';
import { db } from '../firebase/firebase-config';
import { collection, onSnapshot } from 'firebase/firestore';
import './NodeTree.css'; // Add your CSS for styling

const NodeTree = ({ projectId, space }) => {
  const [categories, setCategories] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId || !space) {
      console.error('NodeTree: Missing projectId or space.');
      setError('No project or space selected.');
      return;
    }

    // Fetch categories from the specified space ('material' or 'conceptual')
    const spaceRef = collection(db, 'projects', projectId, space);
    const unsubscribeCategories = onSnapshot(
      spaceRef,
      (snapshot) => {
        const categoriesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('Categories data fetched:', categoriesData);
        setCategories(categoriesData);
        setError(null); // Clear any previous errors
      },
      (err) => {
        console.error('Error fetching categories:', err);
        setError('Failed to fetch categories.');
      }
    );

    return () => unsubscribeCategories(); // Clean up the listener
  }, [projectId, space]);

  useEffect(() => {
    if (categories.length > 0) {
      categories.forEach((category) => {
        const nodesRef = collection(db, 'projects', projectId, space, category.id, 'nodes');
        
        // Use onSnapshot to listen for real-time changes to nodes
        const unsubscribeNodes = onSnapshot(
          nodesRef,
          (snapshot) => {
            const nodesData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            setNodes((prevNodes) => [
              ...prevNodes.filter((nodeGroup) => nodeGroup.categoryId !== category.id), // Remove previous nodes for this category
              { categoryId: category.id, nodes: nodesData },
            ]);
          },
          (err) => {
            console.error('Error fetching nodes:', err);
          }
        );

        return () => unsubscribeNodes(); // Clean up the listener for each category
      });
    }
  }, [categories, projectId, space]);

  return (
    <div className="node-tree">
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {categories.length === 0 ? (
        <p>No categories found. Start by adding new categories.</p>
      ) : (
        <ul className="tree">
          {categories.map((category) => (
            <li key={category.id}>
              {/* Each category is inside a <details> tag */}
              <details open>
                <summary className="caret">
                  {category.title}
                </summary>
                <ul>
                  {/* Loop through the nodes under this category */}
                  {nodes
                    .filter((nodeGroup) => nodeGroup.categoryId === category.id)
                    .flatMap((nodeGroup) =>
                      nodeGroup.nodes.map((node) => (
                        <li key={`${category.id}-${node.id}`}>
                          {node.title}
                        </li>
                      ))
                    )}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
  
  
  
};

export default NodeTree;
