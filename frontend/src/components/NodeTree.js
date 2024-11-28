import React, { useEffect, useState } from 'react';
import { db } from '../firebase/firebase-config';
import { collection, onSnapshot } from 'firebase/firestore';
import './NodeTree.css';

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
    setCollapsedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderNodes = (nodes) => {
    return nodes.map((node) => (
      <div key={node.id} className="node">
        <div className="node-content">
          <span className="caret" onClick={() => toggleCollapse(node.id)}>
            {collapsedItems[node.id] ? '+' : '-'}
          </span>
          <span className="node-title" onClick={() => onNodeClick(node)}>
            {node.title}
          </span>
          <div>{node.description}</div>
        
        {!collapsedItems[node.id] &&
          node.childNodes &&
          node.childNodes.length > 0 && (
            <div className="node-children">
              {renderNodes(node.childNodes)}</div>
          )}
      </div>
      </div>
    ));
  };

  const renderTree = (tree) => {
    return tree.map((category) => (
      <div key={category.id} className="category">
        <div className="category-content">
          <span className="caret" onClick={() => toggleCollapse(category.id)}>
            {collapsedItems[category.id] ? '+' : '-'}
          </span>
          <span className="category-title">{category.title}</span>
        </div>
        {!collapsedItems[category.id] && (
          <div className="category-children">
            <div>{category.description}</div>
            {renderNodes(category.nodes)}</div>
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
