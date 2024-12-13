import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SpaceBox from '../components/SpaceBox';
import ChatBox from '../components/ChatBox';
import './ProjectDetailsPage.css';

const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  const chatBoxRef = useRef(null); // Reference to the ChatBox
  const [selectedHierarchy, setSelectedHierarchy] = useState(null); // Track the selected hierarchy
  const [selectedNodeForImageGeneration, setSelectedNodeForImageGeneration] = useState(null); // Track node for image generation

  const handleHierarchyChange = (hierarchy) => {
    setSelectedHierarchy(hierarchy);

    if (chatBoxRef.current && hierarchy) {
      chatBoxRef.current.addHierarchy(hierarchy); // Update the hierarchy in ChatBox
    }
  };

  const handleNodeDeselect = () => {
    setSelectedHierarchy(null);

    if (chatBoxRef.current) {
      chatBoxRef.current.removeHierarchy(); // Clear the hierarchy in ChatBox
    }
  };

  const handleGenerateImages = (node) => {
    console.log('Node: ', node)
    setSelectedHierarchy(node);
    setSelectedNodeForImageGeneration(node); // Set the node for image generation
  };

  useEffect(() => {
    if (selectedNodeForImageGeneration && chatBoxRef.current) {
      chatBoxRef.current.addHierarchy(selectedNodeForImageGeneration);
      chatBoxRef.current.toggleImageGeneration(); // Open the image generation UI
    }
  }, [selectedNodeForImageGeneration]);

  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '20px', height: '90vh' }}>
      <div style={{ flex: 1 }}>
        <SpaceBox
          projectId={projectId}
          spaceName="Material"
          onHierarchyChange={handleHierarchyChange}
          selectedHierarchy={selectedHierarchy}
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
          onHierarchyChange={handleHierarchyChange}
          selectedHierarchy={selectedHierarchy}
          onGenerateImages={handleGenerateImages} // Pass the callback
        />
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
