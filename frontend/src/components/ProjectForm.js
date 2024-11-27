import React, { useState } from 'react';

function ProjectForm({ onAdd, onAddEmpty }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleAddWithSampleData = () => {
    const project = { name, description };
    console.log('Adding project with sample data:', project); // Debug log
    onAdd(project);
    setName('');
    setDescription('');
  };

  const handleAddEmpty = () => {
    const project = { name, description };
    console.log('Adding empty project:', project); // Debug log
    onAddEmpty(project);
    setName('');
    setDescription('');
  };

  return (
    <div className="project-form">
      <input
        type="text"
        placeholder="Project Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <textarea
        placeholder="Project Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="buttons-container">
        <button onClick={handleAddWithSampleData}>Add with Sample Data</button>
        <button onClick={handleAddEmpty}>Add Empty</button>
      </div>
    </div>
  );
}

export default ProjectForm;
