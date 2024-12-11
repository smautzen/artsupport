import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SpaceBox from '../components/SpaceBox';
import ChatBox from '../components/ChatBox';
import './ProjectDetailsPage.css';

const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  const chatBoxRef = useRef(null); // Reference to the ChatBox
  const [selectedNodes, setSelectedNodes] = useState([]); // Track selected nodes
  const [selectedNodeForImageGeneration, setSelectedNodeForImageGeneration] = useState(null); // Track node for image generation

  const handleNodeClick = (node) => {
    // Add node to the selected list if not already selected
    if (!selectedNodes.some((selected) => selected.id === node.id)) {
      setSelectedNodes((prevSelected) => [...prevSelected, node]);

      if (chatBoxRef.current) {
        chatBoxRef.current.addNode(node); // Call the addNode method in ChatBox
      }
    }
  };

  const handleNodeDeselect = (nodeId) => {
    // Remove node from the selected list
    setSelectedNodes((prevSelected) => prevSelected.filter((node) => node.id !== nodeId));
  };

  const handleGenerateImages = (node) => {
    setSelectedNodeForImageGeneration(node); // Set the node for image generation
  };

  useEffect(() => {
    if (selectedNodeForImageGeneration && chatBoxRef.current) {
      chatBoxRef.current.addNode(selectedNodeForImageGeneration);
      chatBoxRef.current.toggleImageGeneration(); // Open the image generation UI
    }
  }, [selectedNodeForImageGeneration]);

  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '20px', height: '90vh' }}>
      <div style={{ flex: 1 }}>
        <SpaceBox
          projectId={projectId}
          spaceName="Material"
          onNodeClick={handleNodeClick}
          selectedNodes={selectedNodes}
          onNodeDeselect={handleNodeDeselect}
          onGenerateImages={handleGenerateImages} // Pass the callback
        />
      </div>
      <div style={{ flex: 2 }}>
        <ChatBox
          ref={chatBoxRef}
          projectId={projectId}
          selectedNodeForImageGeneration={selectedNodeForImageGeneration} // Pass the node
        />
      </div>
      <div style={{ flex: 1 }}>
        <SpaceBox
          projectId={projectId}
          spaceName="Conceptual"
          onNodeClick={handleNodeClick}
          selectedNodes={selectedNodes}
          onNodeDeselect={handleNodeDeselect}
          onGenerateImages={handleGenerateImages} // Pass the callback
        />
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
