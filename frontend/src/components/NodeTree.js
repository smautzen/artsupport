import React, { useEffect, useState, useRef } from 'react';
import { db } from '../firebase/firebase-config';
import { collection, onSnapshot } from 'firebase/firestore';
import './NodeTree.css';
import NewNodeComponent from './NewNodeComponent';
import TextNodeComponent from './nodecomponents/TextNodeComponent';
import ImageNodeComponent from './nodecomponents/ImageNodeComponent';
import PaletteNodeComponent from './nodecomponents/PaletteNodeComponent';
import NodeEntitiesComponent from './nodecomponents/NodeEntitiesComponent';
import SpaceNodeHeader from './SpaceNodeHeader';

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

  const treeContainerRef = useRef();

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

  const constructHierarchy = (node, parent, grandparent) => ({
    space,
    category: grandparent || parent || node,
    node: parent && !grandparent ? node : null,
    childNode: grandparent ? node : null,
  });

  const handleNodeClick = (node, parent, grandparent, event) => {
    const hierarchy = constructHierarchy(node, parent, grandparent);

    console.log('NodeTree: handleNodeClick constructed hierarchy:', hierarchy);

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

    if (onNodeClick) {
      onNodeClick(hierarchy); // Notify the parent about the node click
    }
  };

  const handleGenerateImagesClick = (node, parent, grandparent) => {
    const hierarchy = constructHierarchy(node, parent, grandparent);
    if (onGenerateImages) {
      onGenerateImages(hierarchy); // Pass specific hierarchy for image generation
    }
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
            return (
              <TextNodeComponent
                node={node}
                projectId={projectId}
                space={space}
                categoryId={parent?.id || grandparent?.id}
              />
            );
          case 'image':
            return <ImageNodeComponent node={node} projectId={projectId} space={space} />;
          case 'palette':
            return <PaletteNodeComponent node={node} />;
          default:
            return <div>Unsupported node type: {node.type}</div>;
        }
      };

      return (
        <div key={node.id} className="node">
          <div className="node-content">
            <SpaceNodeHeader
              title={node.title}
              type="textNode"
              space={space}
              onClick={(event) => handleNodeClick(node, parent, grandparent, event)}
            />
            <NewNodeComponent
              projectId={projectId}
              spaceName={space}
              category={parent}
              node={node}
              childNode={null}
            />
            <button
              className="explore-button"
              onClick={() => handleGenerateImagesClick(node, parent, grandparent)}
            >
              Generate Images
            </button>
            {renderNodeComponent(node)}
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
          <SpaceNodeHeader
            title={category.title}
            type="category"
            space={space}
            onClick={(event) => handleNodeClick(category, null, null, event)}
          />
        </div>
        {!collapsedItems[category.id] && (
          <div className="category-children">
            <button className="explore-button" onClick={() => handleGenerateImagesClick(category, null, null)}>
              Generate Images
            </button>
            <NewNodeComponent projectId={projectId} spaceName={space} category={category} node={null} childNode={null} />
            <div>{category.description}</div>
            <ImageNodeComponent node={category} projectId={projectId} space={space} />
            {renderNodes(category.nodes, category, null)}
          </div>
        )}
      </div>
    ));

  return (
    <div className="node-tree" ref={treeContainerRef}>
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
