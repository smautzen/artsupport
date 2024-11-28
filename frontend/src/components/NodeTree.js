import React, { useEffect, useState } from 'react';
import { db } from '../firebase/firebase-config';
import { collection, onSnapshot } from 'firebase/firestore';
import './NodeTree.css';

import categoryIcon from '../assets/category.png';
import textNodeIcon from '../assets/textnode.png';
import imageNodeIcon from '../assets/imagenode.png';
import paletteNodeIcon from '../assets/palettenode.png';

const nodeTypeIcons = {
  category: categoryIcon,
  text: textNodeIcon,
  image: imageNodeIcon,
  palette: paletteNodeIcon,
};

const NodeTree = ({ projectId, space, onNodeClick }) => {
  const [treeData, setTreeData] = useState([]); // Hierarchical data for categories and nodes
  const [collapsedItems, setCollapsedItems] = useState({}); // State for collapsed items
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId || !space) {
      setError('No project or space selected.');
      return;
    }

    const fetchTreeData = async () => {
      try {
        const spaceRef = collection(db, 'projects', projectId, space);

        // Listen for changes to categories
        onSnapshot(
          spaceRef,
          (snapshot) => {
            const categories = snapshot.docs.map((categoryDoc) => ({
              id: categoryDoc.id,
              ...categoryDoc.data(),
              nodes: [], // Placeholder for nodes
            }));

            categories.forEach((category) => {
              const nodesRef = collection(db, 'projects', projectId, space, category.id, 'nodes');

              // Listen for changes to nodes in each category
              onSnapshot(nodesRef, (nodesSnapshot) => {
                const nodes = nodesSnapshot.docs.map((nodeDoc) => ({
                  id: nodeDoc.id,
                  ...nodeDoc.data(),
                  childNodes: [], // Placeholder for child nodes
                }));

                nodes.forEach((node) => {
                  const childNodesRef = collection(
                    db,
                    'projects',
                    projectId,
                    space,
                    category.id,
                    'nodes',
                    node.id,
                    'childNodes'
                  );

                  // Listen for changes to child nodes in each node
                  onSnapshot(childNodesRef, (childNodesSnapshot) => {
                    const childNodes = childNodesSnapshot.docs.map((childNodeDoc) => ({
                      id: childNodeDoc.id,
                      ...childNodeDoc.data(),
                    }));

                    // Update state with child nodes
                    setTreeData((prevTree) =>
                      prevTree.map((prevCategory) =>
                        prevCategory.id === category.id
                          ? {
                              ...prevCategory,
                              nodes: prevCategory.nodes.map((prevNode) =>
                                prevNode.id === node.id ? { ...prevNode, childNodes } : prevNode
                              ),
                            }
                          : prevCategory
                      )
                    );
                  });
                });

                // Update state with nodes
                setTreeData((prevTree) =>
                  prevTree.map((prevCategory) =>
                    prevCategory.id === category.id ? { ...prevCategory, nodes } : prevCategory
                  )
                );
              });
            });

            // Set initial categories
            setTreeData(categories);
          },
          (err) => {
            console.error('Error fetching categories:', err);
            setError('Failed to fetch categories.');
          }
        );
      } catch (err) {
        console.error('Error fetching tree data:', err);
        setError('Failed to fetch tree data.');
      }
    };

    fetchTreeData();
  }, [projectId, space]);

  const toggleCollapse = (id) => {
    console.log('Toggling collapse for ID:', id);
    setCollapsedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderNodes = (nodes) => {
    return nodes.map((node) => {
      const icon = nodeTypeIcons[node.type] || textNodeIcon; // Default to textNodeIcon if type is missing
      return (
        <div key={node.id} className="node">
          <div className="node-content">
            <strong>
              <span className="node-title" onClick={() => onNodeClick(node)}>
                {node.title}
              </span>
            </strong>
            <img
              src={icon}
              alt={`${node.type} Icon`}
              className="node-icon"
            />
            <span className="caret" onClick={() => toggleCollapse(node.id)}>
              {collapsedItems[node.id] ? '+' : '-'}
            </span>
            <div>{node.description}</div>
          </div>
          {!collapsedItems[node.id] &&
            node.childNodes &&
            node.childNodes.length > 0 && (
              <div className="node-children">
                {renderNodes(node.childNodes)} {/* Recursively render child nodes */}
              </div>
            )}
        </div>
      );
    });
  };
  

  const renderTree = (tree) => {
    return tree.map((category) => (
      <div key={category.id} className="category">
        <div className="category-content">
          <span className="category-title">{category.title}</span>
          <img 
            src={categoryIcon} 
            alt="Category Icon" 
            className="node-icon" 
          />
          <span className="caret" onClick={() => toggleCollapse(category.id)}>
            {collapsedItems[category.id] ? '+' : '-'}
        </span>
        </div>
        {!collapsedItems[category.id] && (
          <div className="category-children">
            <div>{category.description}</div>
            {renderNodes(category.nodes)}
          </div>
        )}
      </div>
    ));
  };
  

  return (
    <div className="node-tree">
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {treeData.length === 0 ? (
        <p>No categories found. Start by adding new categories.</p>
      ) : (
        <div className="tree">{renderTree(treeData)}</div>
      )}
    </div>
  );
};

export default NodeTree;
