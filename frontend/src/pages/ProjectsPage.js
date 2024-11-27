import React from 'react';
import axios from 'axios';
import useRealtimeProjects from '../components/useRealtimeProjects';
import ProjectList from '../components/ProjectList';
import ProjectForm from '../components/ProjectForm';
import './ProjectsPage.css';

function ProjectsPage() {
  const projects = useRealtimeProjects();

  const handleAddProject = async (project, includeSampleData = true) => {
    try {
      console.log('Sending request to add project:', { ...project, includeSampleData }); // Debug log
      await axios.post('http://localhost:4000/projects', {
        ...project,
        includeSampleData,
      });
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      await axios.delete(`http://localhost:4000/projects/${id}`);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  return (
    <div className="projects-page-container">
      <div className="sidebar">
        <header className="add-project-container">
          <h2>Add a New Project</h2>
          <ProjectForm
            onAdd={(project) => handleAddProject(project, true)}
            onAddEmpty={(project) => handleAddProject(project, false)}
          />
        </header>
        <main className="project-list-container">
          <ProjectList projects={projects} onDelete={handleDeleteProject} />
        </main>
      </div>
    </div>
  );
}

export default ProjectsPage;
