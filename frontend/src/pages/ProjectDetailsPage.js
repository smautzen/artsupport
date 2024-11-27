import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import SpaceBox from '../components/SpaceBox';
import ChatBox from '../components/ChatBox';
import './ProjectDetailsPage.css'; // Import the CSS file

const ProjectDetailsPage = () => {
  const { projectId } = useParams(); // Get projectId from the URL params
  const [selectedNode, setSelectedNode] = useState(null); // Track the clicked node

  const handleNodeClick = (node) => {
    console.log('Node clicked:', node); // For debugging
    setSelectedNode(node);
  };

  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '20px', height: '90vh' }}>
      <div style={{ flex: 1 }}>
        <SpaceBox
          projectId={projectId}
          spaceName="Material"
          onNodeClick={handleNodeClick}
        />
      </div>
      <div style={{ flex: 2 }}>
        <ChatBox projectId={projectId} selectedNode={selectedNode} />
      </div>
      <div style={{ flex: 1 }}>
        <SpaceBox
          projectId={projectId}
          spaceName="Conceptual"
          onNodeClick={handleNodeClick}
        />
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
