import React, { useEffect, useState } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import './SystemMessage.css';
import './NodeSuggestions.css';

import SuggestionHeader from './SuggestionHeader';

const NodeSuggestions = ({ item, index, handleLike, projectId }) => {
  const [fetchedEntities, setFetchedEntities] = useState({});
  const db = getFirestore();

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

  useEffect(() => {
    const loadEntities = async () => {
      const allEntityIds = item.nodes?.flatMap((node) => node.entities || []) || [];
      const uniqueEntityIds = [...new Set(allEntityIds)];
      const entitiesData = await fetchEntities(uniqueEntityIds);
      setFetchedEntities(entitiesData);
    };

    loadEntities();
  }, [item.nodes, projectId]);

  return (
    <div className="suggestion">
      {/* Use SuggestionHeader for the category data */}
      <SuggestionHeader
        handleLike={handleLike}
        title={item.title}
        type="category"
        liked={item.liked}
        index={index}
        space={item.space}
        categoryId={item.id}
      />

      <div className="item-description">
        <strong><span>Category description:</span></strong>
        {item.description || 'No description available'}
      </div>

      <ul>
        {item.nodes &&
          item.nodes.map((node) => (
            <li key={`node-${node.id}`} className="node-item">
              <SuggestionHeader
                handleLike={handleLike}
                title={node.title}
                type="textNode"
                liked={node.liked}
                index={index}
                space={item.space}
                nodeId={node.id}
                categoryId={item.id}
              />

              <div className="node-suggestion-content">
                <div className="node-section">
                  <div className="section-header">Node description:</div>
                  <div className="section-content">
                    {node.description || 'No description available'}
                  </div>
                </div>

                {node.entities && node.entities.length > 0 && (
                  <div className="node-section">
                    <div className="section-header">Examples of entities:</div>
                    <div className="section-content entity-list">
                      {formatEntities(node.entities)}
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default NodeSuggestions;
