import React from 'react';

function ProjectList({ projects, onDelete }) {
  return (
    <ul>
      {projects.map((project) => (
        <li key={project.id}>
          <h3>{project.name}</h3>
          <p>{project.description}</p>
          <button onClick={() => onDelete(project.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}

export default ProjectList;
