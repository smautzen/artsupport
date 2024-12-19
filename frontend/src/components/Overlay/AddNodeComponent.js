import React, { useState } from 'react';
import axios from 'axios';
import './AddNodeComponent.css';

const AddNodeComponent = ({ hierarchy, onClose, onAdd, projectId }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false); // Loading state for the button
  const [error, setError] = useState(null); // Error state

  // Determine the type of hierarchy (category, node, or entity)
  const hierarchyType = !hierarchy || !hierarchy.category
    ? 'category'
    : hierarchy.category && !hierarchy.node
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
      let response;

      console.log('Adding: ', hierarchyType);

      if (hierarchyType === 'category') {
        // Call the addCategory endpoint
        response = await axios.post('http://localhost:4000/addCategory', {
          projectId: projectId,
          space: hierarchy?.space || 'conceptual', // Replace with actual space
          title: name,
          description,
        });
      } else if (hierarchyType === 'node') {
        // Call the addNode endpoint
        response = await axios.post('http://localhost:4000/addNode', {
          projectId: projectId,
          space: hierarchy?.space || 'conceptual',
          categoryId: hierarchy.category.id, // Use the parent category ID
          title: name,
          description,
        });
      } else if (hierarchyType === 'entity') {
        // Call the addNode endpoint
        response = await axios.post('http://localhost:4000/addEntity', {
          projectId: projectId,
          space: hierarchy?.space || 'conceptual',
          categoryId: hierarchy.category.id, // Use the parent category ID
          nodeId: hierarchy.node.id, // Use the parent category ID
          title: name,
          description,
        });
      }
       else {
        setError('Unsupported hierarchy type.');
        return;
      }

      console.log(`${hierarchyType.charAt(0).toUpperCase() + hierarchyType.slice(1)} added:`, response.data);
      if (onAdd && typeof onAdd === 'function') {
        onAdd({ name, description, type: hierarchyType });
      }
      onClose(); // Close the overlay on success
    } catch (err) {
      setError(err.response?.data?.error || `Failed to add ${hierarchyType}.`);
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
