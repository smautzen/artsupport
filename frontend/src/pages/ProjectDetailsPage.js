import React from 'react';
import { useParams } from 'react-router-dom';
import MaterialSpace from '../components/MaterialSpace';
import ConceptualSpace from '../components/ConceptualSpace';
import ChatBox from '../components/ChatBox';

const ProjectDetailsPage = () => {
  const { projectId } = useParams(); // Get projectId from the URL params

  // Log the projectId for debugging
  console.log('ProjectDetailsPage: projectId =', projectId);

  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <div style={{ flex: 1 }}>
        <MaterialSpace projectId={projectId} />
      </div>
      <div style={{ flex: 2 }}>
        <ChatBox projectId={projectId} />
      </div>
      <div style={{ flex: 1 }}>
        <ConceptualSpace projectId={projectId} />
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
