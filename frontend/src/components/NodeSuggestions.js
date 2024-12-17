import React, { useEffect, useState } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import './SystemMessage.css';
import './NodeSuggestions.css';

const NodeSuggestions = ({ item, index, handleLike, projectId }) => {
  const [fetchedEntities, setFetchedEntities] = useState({}); // Store fetched entity data
  const db = getFirestore(); // Firestore instance

  // Function to fetch entities for a given list of IDs
  const fetchEntities = async (entityIds) => {
    const entitiesData = {};
    for (const entityId of entityIds) {
      const entityRef = doc(db, `projects/${projectId}/entities/${entityId}`);
      try {
        const entitySnap = await getDoc(entityRef);
        if (entitySnap.exists()) {
          entitiesData[entityId] = entitySnap.data();
        } else {
          console.warn(`Entity ${entityId} not found`);
          entitiesData[entityId] = { title: 'Unknown Entity', description: '' };
        }
      } catch (error) {
        console.error(`Error fetching entity ${entityId}:`, error);
        entitiesData[entityId] = { title: 'Error', description: 'Failed to fetch entity' };
      }
    }
    return entitiesData;
  };

  // Format entities into the desired "title (description)" string
  const formatEntities = (entityIds) => {
    const formatted = entityIds
      .map((id) => {
        const entity = fetchedEntities[id];
        return entity
          ? `${entity.title || 'Unnamed'} (${entity.description || 'No description'})`
          : 'Unknown Entity';
      })
      .join(', ')
      .replace(/, ([^,]*)$/, ' & $1');
    return formatted;
  };

  // Fetch entities whenever item.nodes changes
  useEffect(() => {
    const loadEntities = async () => {
      const allEntityIds = item.nodes?.flatMap((node) => node.entities || []) || [];
      const uniqueEntityIds = [...new Set(allEntityIds)]; // Ensure no duplicates
      const entitiesData = await fetchEntities(uniqueEntityIds);
      setFetchedEntities(entitiesData);
    };

    loadEntities();
  }, [item.nodes, projectId]);

  return (
    <div className="suggestion">
      {/* Suggestion Button */}
      <button
        className={`highlight-button ${item.liked ? 'liked' : ''}`}
        onClick={(event) => handleLike(index, null, event, 'nodes')}
        disabled={item.liked}
      >
        {item.title || 'Unnamed Suggestion'}
      </button>

      {/* Suggestion Description */}
      <div className="item-description">
        {item.description || 'No description available'}
      </div>

      {/* Node List */}
      <ul>
        {item.nodes &&
          item.nodes.map((node) => (
            <li key={`node-${node.id}`} className="node-item">
              {/* Node Title */}
              <div className="node-title">
                <button
                  className={`highlight-button ${node.liked ? 'liked' : ''}`}
                  onClick={(event) => handleLike(index, node.id, event, 'nodes')}
                  disabled={node.liked}
                >
                  {node.title || 'Unnamed Node'}
                </button>
              </div>

              {/* Node Description */}
              <div className="node-section">
                <div className="section-header">Description:</div>
                <div className="section-content">
                  {node.description || 'No description available'}
                </div>
              </div>

              {/* Display Fetched Entities */}
              {node.entities && node.entities.length > 0 && (
                <div className="node-section">
                  <div className="section-header">Examples of entities:</div>
                  <div className="section-content entity-list">
                    {formatEntities(node.entities)}
                  </div>
                </div>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
};

export default NodeSuggestions;
