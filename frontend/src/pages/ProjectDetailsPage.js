import React, { useRef } from 'react';
import { useParams } from 'react-router-dom';
import SpaceBox from '../components/SpaceBox';
import ChatBox from '../components/ChatBox';
import './ProjectDetailsPage.css';

const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  const chatBoxRef = useRef(null); // Reference to the ChatBox

  const handleNodeClick = (node, space) => {
    console.log('Node clicked in NodeTree:', node + space); // Debug
    if (chatBoxRef.current) {
      chatBoxRef.current.addNode(node, space); // Call the addNode method in ChatBox
    }
  };

  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '20px', height: '90vh' }}>
      <div style={{ flex: 1 }}>
        <SpaceBox projectId={projectId} spaceName="Material" onNodeClick={handleNodeClick} />
      </div>
      <div style={{ flex: 2 }}>
        <ChatBox ref={chatBoxRef} projectId={projectId} />
      </div>
      <div style={{ flex: 1 }}>
        <SpaceBox projectId={projectId} spaceName="Conceptual" onNodeClick={handleNodeClick} />
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
