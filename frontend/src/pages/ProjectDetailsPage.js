import React, { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import SpaceBox from '../components/SpaceBox';
import ChatBox from '../components/ChatBox';
import './ProjectDetailsPage.css';

const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  const chatBoxRef = useRef(null); // Reference to the ChatBox
  const [selectedNodes, setSelectedNodes] = useState([]); // Track selected nodes

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

  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '20px', height: '90vh' }}>
      <div style={{ flex: 1 }}>
        <SpaceBox
          projectId={projectId}
          spaceName="Material"
          onNodeClick={handleNodeClick}
          selectedNodes={selectedNodes}
          onNodeDeselect={handleNodeDeselect}
        />
      </div>
      <div style={{ flex: 2 }}>
        <ChatBox ref={chatBoxRef} projectId={projectId} />
      </div>
      <div style={{ flex: 1 }}>
        <SpaceBox
          projectId={projectId}
          spaceName="Conceptual"
          onNodeClick={handleNodeClick}
          selectedNodes={selectedNodes}
          onNodeDeselect={handleNodeDeselect}
        />
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
