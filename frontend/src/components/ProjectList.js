import React from 'react';
import { Link } from 'react-router-dom';
import './ProjectList.css'; // Add styles for the list

function ProjectList({ projects, onDelete }) {
  return (
    <div className="project-list">
      {projects.map((project) => (
        <div key={project.id} className="project-card">
          <Link to={`/projects/${project.id}`} className="project-name">
            <h3>{project.name}</h3>
          </Link>
          <p>{project.description}</p>
          <button onClick={() => onDelete(project.id)} className="delete-button">
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default ProjectList;
