import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SpaceBox from '../components/SpaceBox';
import ChatBox from '../components/ChatBox';
import OverlayComponent from '../components/Overlay/OverlayComponent';
import './ProjectDetailsPage.css';

const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  const chatBoxRef = useRef(null);
  const [selectedHierarchy, setSelectedHierarchy] = useState(null); // Track general hierarchy for ChatBox
  const [overlayData, setOverlayData] = useState(null); // For overlay content
  const [showOverlay, setShowOverlay] = useState(false); // Overlay visibility

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

  const handleGenerateImages = (hierarchy) => {
    setOverlayData({ action: 'image', item: hierarchy, projectId });
    setShowOverlay(true);
  };

  const closeOverlay = () => {
    console.log("Close overlay invoked...")
    setOverlayData(null);
    setShowOverlay(false);
  };

  useEffect(() => {
    if (!selectedHierarchy && chatBoxRef.current) {
      chatBoxRef.current.removeHierarchy(); // Ensure consistency if no hierarchy is selected
    }
  }, [selectedHierarchy]);

  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '20px', height: '90vh' }}>
      <div style={{ flex: 1 }}>
        <SpaceBox
          projectId={projectId}
          spaceName="Material"
          onHierarchyChange={handleHierarchyChange}
          selectedHierarchy={selectedHierarchy}
          onGenerateImages={handleGenerateImages}
        />
      </div>
      <div style={{ flex: 2 }}>
        <ChatBox
          ref={chatBoxRef}
          projectId={projectId}
          selectedHierarchy={selectedHierarchy} // Pass general hierarchy to ChatBox
          onGenerateImages={() => handleGenerateImages(null)} // Open with null hierarchy from ChatBox
        />
      </div>
      <div style={{ flex: 1 }}>
        <SpaceBox
          projectId={projectId}
          spaceName="Conceptual"
          onHierarchyChange={handleHierarchyChange}
          selectedHierarchy={selectedHierarchy}
          onGenerateImages={handleGenerateImages}
        />
      </div>

      {showOverlay && (
        <OverlayComponent
          action={overlayData.action}
          item={overlayData.item}
          projectId={overlayData.projectId}
          onClose={closeOverlay}
        />
      )}
    </div>
  );
};

export default ProjectDetailsPage;
