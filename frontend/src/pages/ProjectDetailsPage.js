import React from 'react';
import MaterialSpace from '../components/MaterialSpace';
import ConceptualSpace from '../components/ConceptualSpace';
import ChatBox from '../components/ChatBox';

const ProjectDetailsPage = ({ projectId }) => {

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
