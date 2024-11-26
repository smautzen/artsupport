import React from 'react';
import { useParams } from 'react-router-dom';
import MaterialSpace from '../components/MaterialSpace';
import ChatBox from '../components/ChatBox';
import ConceptualSpace from '../components/ConceptualSpace';
import './ProjectDetailsPage.css';

function ProjectDetailsPage() {
  const { id: projectId } = useParams(); // Get project ID from the URL

  return (
    <div className="project-details-container">
      <div className="material-space">
        <MaterialSpace projectId={projectId} />
      </div>
      <div className="chatbox">
        <ChatBox projectId={projectId} />
      </div>
      <div className="conceptual-space">
        <ConceptualSpace projectId={projectId} />
      </div>
    </div>
  );
}

export default ProjectDetailsPage;
