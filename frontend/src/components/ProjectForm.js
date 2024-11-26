import React, { useState } from 'react';
import './ProjectForm.css';

function ProjectForm({ onAdd }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && description.trim()) {
      onAdd({ name, description });
      setName('');
      setDescription('');
    }
  };

  return (
    <form className="project-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Project Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <textarea
        placeholder="Project Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <button type="submit">Add Project</button>
    </form>
  );
}

export default ProjectForm;
