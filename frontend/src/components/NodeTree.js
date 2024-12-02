import React, { useEffect, useState } from 'react';
import { db } from '../firebase/firebase-config';
import { collection, onSnapshot } from 'firebase/firestore';
import './NodeTree.css';

import TextNodeComponent from './nodecomponents/TextNodeComponent';
import ImageNodeComponent from './nodecomponents/ImageNodeComponent';
import PaletteNodeComponent from './nodecomponents/PaletteNodeComponent';

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
  const [animations, setAnimations] = useState([]); // Track multiple active animations
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId || !space) {
      setError('No project or space selected.');
      return;
    }

    const fetchTreeData = async () => {
      try {
        const spaceRef = collection(db, 'projects', projectId, space);

        onSnapshot(spaceRef, (snapshot) => {
          const categories = snapshot.docs.map((categoryDoc) => ({
            id: categoryDoc.id,
            ...categoryDoc.data(),
            nodes: [],
          }));

          categories.forEach((category) => {
            const nodesRef = collection(db, 'projects', projectId, space, category.id, 'nodes');

            onSnapshot(nodesRef, (nodesSnapshot) => {
              const nodes = nodesSnapshot.docs.map((nodeDoc) => ({
                id: nodeDoc.id,
                ...nodeDoc.data(),
                childNodes: [],
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

                onSnapshot(childNodesRef, (childNodesSnapshot) => {
                  const childNodes = childNodesSnapshot.docs.map((childNodeDoc) => ({
                    id: childNodeDoc.id,
                    ...childNodeDoc.data(),
                  }));

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

              setTreeData((prevTree) =>
                prevTree.map((prevCategory) =>
                  prevCategory.id === category.id ? { ...prevCategory, nodes } : prevCategory
                )
              );
            });
          });

          setTreeData(categories);
        });
      } catch (err) {
        console.error('Error fetching tree data:', err);
        setError('Failed to fetch tree data.');
      }
    };

    fetchTreeData();
  }, [projectId, space]);

  const handleNodeClick = (node, event) => {
    const rect = event.target.getBoundingClientRect();
    const targetSpace = space === 'material' ? 'saved-right' : 'saved-left'; // Class name for direction
    const animationId = Date.now(); // Unique ID for this animation

    setAnimations((prevAnimations) => [
      ...prevAnimations,
      {
        id: animationId,
        title: node.title || 'Unnamed Node',
        target: targetSpace,
        startX: rect.left + rect.width / 2,
        startY: rect.top + rect.height / 2,
      },
    ]);

    setTimeout(() => {
      setAnimations((prevAnimations) => prevAnimations.filter((anim) => anim.id !== animationId));
    }, 1000); // Match animation duration

    onNodeClick(node); // Invoke the callback for the clicked node
  };

  const handleCategoryClick = (category, event) => {
    const rect = event.target.getBoundingClientRect();
    const targetSpace = space === 'material' ? 'saved-right' : 'saved-left'; // Class name for direction
    const animationId = Date.now(); // Unique ID for this animation

    setAnimations((prevAnimations) => [
      ...prevAnimations,
      {
        id: animationId,
        title: category.title || 'Unnamed Category',
        target: targetSpace,
        startX: rect.left + rect.width / 2,
        startY: rect.top + rect.height / 2,
      },
    ]);

    setTimeout(() => {
      setAnimations((prevAnimations) => prevAnimations.filter((anim) => anim.id !== animationId));
    }, 1000); // Match animation duration

    onNodeClick(category); // Invoke the callback for the clicked category
  };

  const toggleCollapse = (id) => {
    setCollapsedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderNodes = (nodes) => {
    return nodes.map((node) => {
      const icon = nodeTypeIcons[node.type] || textNodeIcon;

      const renderNodeComponent = (node) => {
        switch (node.type) {
          case 'text':
            return <TextNodeComponent node={node} />;
          case 'image':
            return <ImageNodeComponent node={node} />;
          case 'palette':
            return <PaletteNodeComponent node={node} />;
          default:
            return <div>Unsupported node type: {node.type}</div>;
        }
      };

      return (
        <div key={node.id} className="node">
          <div className="node-content">
            <strong>
              <span
                className="node-title"
                onClick={(event) => handleNodeClick(node, event)}
              >
                {node.title}
              </span>
            </strong>
            <img src={icon} alt={`${node.type} Icon`} className="node-icon" />
            <span className="caret" onClick={() => toggleCollapse(node.id)}>
              {collapsedItems[node.id] ? '+' : '-'}</span>
            {renderNodeComponent(node)}
          </div>
          {!collapsedItems[node.id] &&
            node.childNodes &&
            node.childNodes.length > 0 && (
              <div className="node-children">{renderNodes(node.childNodes)}</div>
            )}
        </div>
      );
    });
  };

  const renderTree = (tree) => {
    return tree.map((category) => (
      <div key={category.id} className="category">
        <div className="category-content">
          <span
            className="category-title"
            onClick={(event) => handleCategoryClick(category, event)}
          >
            {category.title}
          </span>
          <img src={categoryIcon} alt="Category Icon" className="node-icon" />
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
      <h4>Node Tree</h4>
      {animations.map((animation) => (
        <div
          key={animation.id}
          className={`phantom-saved phantom-${animation.target}`}
          style={{
            left: animation.startX,
            top: animation.startY,
          }}
        >
          {animation.title}
        </div>
      ))}
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
