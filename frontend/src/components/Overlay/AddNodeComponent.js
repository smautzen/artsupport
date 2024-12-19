import React, { useState } from 'react';
import './AddNodeComponent.css';

const AddNodeComponent = ({ hierarchy, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Determine the type of hierarchy (category, node, or entity)
  const hierarchyType = !hierarchy || !hierarchy.node
    ? 'category'
    : hierarchy.node && !hierarchy.childNode
    ? 'node'
    : 'entity';

  const handleAdd = () => {
    if (onAdd && typeof onAdd === 'function') {
      onAdd({ hierarchy, name, description, type: hierarchyType });
    }
    setName('');
    setDescription('');
  };

  return (
    <div className="add-node">
      <h3>Add {hierarchyType}</h3>
      <div className="input-group">
        <label htmlFor="name">Name:</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter name"
        />
      </div>
      <div className="input-group">
        <label htmlFor="description">Description:</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description"
        ></textarea>
      </div>
      <div className="button-group">
        <button className="add-button" onClick={handleAdd}>
          Add
        </button>
        <button className="close-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default AddNodeComponent;
