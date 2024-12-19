import React, { useState } from 'react';
import axios from 'axios';
import './AddNodeComponent.css';

const AddNodeComponent = ({ hierarchy, onClose, onAdd, projectId }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false); // Loading state for the button
  const [error, setError] = useState(null); // Error state

  // Determine the type of hierarchy (category, node, or entity)
  const hierarchyType = !hierarchy || !hierarchy.node
    ? 'category'
    : hierarchy.node && !hierarchy.childNode
    ? 'node'
    : 'entity';

  const handleAdd = async () => {
    if (!name || !description) {
      setError('Name and description are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:4000/addCategory', {
        projectId: projectId, // Replace with actual project ID
        space: hierarchy?.space || 'conceptual', // Replace with actual space
        title: name,
        description,
      });

      console.log('Category added:', response.data);
      if (onAdd && typeof onAdd === 'function') {
        onAdd({ name, description, type: hierarchyType });
      }
      onClose(); // Close the overlay on success
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add category.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-node">
      <h3>Add {hierarchyType}</h3>
      {error && <p className="error-message">{error}</p>}
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
        <button className="add-button" onClick={handleAdd} disabled={loading}>
          {loading ? 'Adding...' : 'Add'}
        </button>
        <button className="close-button" onClick={onClose} disabled={loading}>
          Close
        </button>
      </div>
    </div>
  );
};

export default AddNodeComponent;
