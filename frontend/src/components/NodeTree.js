import React, { useEffect, useState } from 'react';
import { db } from '../firebase/firebase-config';
import { collection, onSnapshot } from 'firebase/firestore';
import './NodeTree.css';

const NodeTree = ({ projectId, space, onNodeClick }) => {
  const [categories, setCategories] = useState([]);
  const [nodes, setNodes] = useState({});
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId || !space) {
      console.error('NodeTree: Missing projectId or space.');
      setError('No project or space selected.');
      return;
    }

    const spaceRef = collection(db, 'projects', projectId, space);
    const unsubscribeCategories = onSnapshot(
      spaceRef,
      (snapshot) => {
        const fetchedCategories = snapshot.docs.map((doc) => ({
          id: doc.id,
          space,
          ...doc.data(),
        }));
        setCategories(fetchedCategories);
        setError(null);
      },
      (err) => {
        console.error('Error fetching categories:', err);
        setError('Failed to fetch categories.');
      }
    );

    return () => unsubscribeCategories();
  }, [projectId, space]);

  useEffect(() => {
    if (categories.length > 0) {
      categories.forEach((category) => {
        const nodesRef = collection(db, 'projects', projectId, space, category.id, 'nodes');

        const unsubscribeNodes = onSnapshot(
          nodesRef,
          (snapshot) => {
            const fetchedNodes = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            setNodes((prevNodes) => ({
              ...prevNodes,
              [category.id]: fetchedNodes,
            }));
          },
          (err) => {
            console.error('Error fetching nodes:', err);
          }
        );

        return () => unsubscribeNodes();
      });
    }
  }, [categories, projectId, space]);

  const toggleCollapse = (categoryId) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId], // Toggle collapse state for the specific category
    }));
  };

  return (
    <div className="node-tree">
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {categories.length === 0 ? (
        <p>No categories found. Start by adding new categories.</p>
      ) : (
        <div className="tree">
          {categories.map((category) => (
            <div key={category.id} className="category">
              <div className="category-header">
                <span
                  className="caret"
                  onClick={() => toggleCollapse(category.id)}
                >
                  {collapsedCategories[category.id] ? '+' : '-'}
                </span>
                <span className="category-title">{category.title}</span>
              </div>
              {!collapsedCategories[category.id] && (
                <div className="category-content">
                  {nodes[category.id] &&
                    nodes[category.id].map((node) => (
                      <div
                        key={node.id}
                        className="node"
                        onClick={() => onNodeClick(node, space)} // Trigger onNodeClick with the clicked node
                      >
                        {node.title}
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NodeTree;
