import React from 'react';
import { useParams } from 'react-router-dom';
import SpaceBox from '../components/SpaceBox';
import ChatBox from '../components/ChatBox';

const ProjectDetailsPage = () => {
  const { projectId } = useParams(); // Get projectId from the URL params

  // Log the projectId for debugging
  console.log('ProjectDetailsPage: projectId =', projectId);

  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <div style={{ flex: 1 }}>
        <SpaceBox projectId={projectId} spaceName='Material' />
      </div>
      <div style={{ flex: 2 }}>
        <ChatBox projectId={projectId} />
      </div>
      <div style={{ flex: 1 }}>
        <SpaceBox projectId={projectId} spaceName='Conceptual'/>
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
