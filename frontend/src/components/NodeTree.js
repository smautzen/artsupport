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

const NodeTree = ({ projectId, space, onNodeClick, selectedNodes, onNodeDeselect, onGenerateImages }) => {
  const [treeData, setTreeData] = useState([]);
  const [collapsedItems, setCollapsedItems] = useState({});
  const [animations, setAnimations] = useState([]);
  const [error, setError] = useState(null);
  const [activePopup, setActivePopup] = useState(null);

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

  const handleExploreClick = (element) => {
    setActivePopup((prev) => (prev === element.id ? null : element.id));
  };

  const handleGlobalClick = (event) => {
    if (!event.target.closest('.explore-options-popup') && !event.target.closest('.explore-button')) {
      setActivePopup(null);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const handleNodeClick = (node, parent, grandparent, event) => {
    let updatedSelection = {
      space,
      category: null,
      node: null,
      childNode: null,
    };

    if (!parent && !grandparent) {
      // Category clicked
      updatedSelection.category = node;
    } else if (!grandparent) {
      // Node clicked
      updatedSelection.category = parent;
      updatedSelection.node = node;
    } else {
      // Child node clicked
      updatedSelection.category = grandparent;
      updatedSelection.node = parent;
      updatedSelection.childNode = node;
    }

    console.log('Node Clicked:', {
      node,
      parent,
      grandparent,
      updatedSelection,
    });

    if (event) {
      const rect = event.target.getBoundingClientRect();
      const targetSpace = space === 'material' ? 'saved-right' : 'saved-left';
      const animationId = Date.now();

      setAnimations((prevAnimations) => [
        ...prevAnimations,
        {
          id: animationId,
          title: node?.title || parent?.title || grandparent?.title || 'Unnamed Node',
          target: targetSpace,
          startX: rect.left + rect.width / 2,
          startY: rect.top + rect.height / 2,
        },
      ]);

      setTimeout(() => {
        setAnimations((prevAnimations) => prevAnimations.filter((anim) => anim.id !== animationId));
      }, 1000);
    }

    onNodeClick(updatedSelection);
  };

  const toggleCollapse = (id) => {
    setCollapsedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderNodes = (nodes, parent, grandparent) =>
    nodes.map((node) => {
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
              <span className="node-title" onClick={(event) => handleNodeClick(node, parent, grandparent, event)}>
                {node.title}
              </span>
            </strong>
            <img src={icon} alt={`${node.type} Icon`} className="node-icon" />
            {renderNodeComponent(node)}
            <button className="explore-button" onClick={() => handleExploreClick(node)}>Explore</button>
            {activePopup === node.id && (
              <div className="explore-options-popup">
                <button className="explore-button" onClick={() => onGenerateImages(node)}>
                  Generate Images
                </button>
                <button className="explore-button">Get Suggestions</button>
              </div>
            )}
          </div>
          {!collapsedItems[node.id] && node.childNodes && node.childNodes.length > 0 && (
            <div className="node-children">{renderNodes(node.childNodes, node, parent)}</div>
          )}
        </div>
      );
    });

  const renderTree = (tree) =>
    tree.map((category) => (
      <div key={category.id} className="category">
        <div className="category-content">
          <span className="category-title" onClick={(event) => handleNodeClick(category, null, null, event)}>
            {category.title}
          </span>
          <img src={categoryIcon} alt="Category Icon" className="node-icon" />
          <button className="explore-button" onClick={() => handleExploreClick(category)}>Explore</button>
          {activePopup === category.id && (
            <div className="explore-options-popup">
              <button className="explore-button" onClick={() => onGenerateImages(category)}>
                Generate Images
              </button>
              <button className="explore-button">Get Suggestions</button>
            </div>
          )}
        </div>
        {!collapsedItems[category.id] && (
          <div className="category-children">
            <div>{category.description}</div>
            {renderNodes(category.nodes, category, null)}
          </div>
        )}
      </div>
    ));

  return (
    <div className="node-tree">
      {treeData.length === 0 ? <p>Select categories to add to space!</p> : renderTree(treeData)}
      {animations.map((animation) => (
        <div
          key={animation.id}
          className={`phantom-saved phantom-${animation.target}`}
          style={{ left: animation.startX, top: animation.startY }}
        >
          {animation.title}
        </div>
      ))}
    </div>
  );
};

export default NodeTree;
