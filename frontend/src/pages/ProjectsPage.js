import React from 'react';
import axios from 'axios';
import useRealtimeProjects from '../components/useRealtimeProjects';
import ProjectList from '../components/ProjectList';
import ProjectForm from '../components/ProjectForm';

function ProjectsPage() {
  // Use Firestore listener for real-time updates
  const projects = useRealtimeProjects();

  // Add project via backend REST API
  const handleAddProject = async (project) => {
    try {
      await axios.post('http://localhost:4000/projects', project);
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  // Delete project via backend REST API
  const handleDeleteProject = async (id) => {
    try {
      await axios.delete(`http://localhost:4000/projects/${id}`);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  return (
    <div>
      <h1>Projects</h1>
      {/* Form to add projects */}
      <ProjectForm onAdd={handleAddProject} />
      {/* List of projects with delete functionality */}
      <ProjectList projects={projects} onDelete={handleDeleteProject} />
    </div>
  );
}

export default ProjectsPage;
