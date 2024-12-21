import React from 'react';
import './TextNodeComponent.css';
import ImageNodeComponent from './ImageNodeComponent';
import NodeEntitiesComponent from './NodeEntitiesComponent';

const TextNodeComponent = ({ node, projectId, space, categoryId }) => (
  <div className="text-node">
    <p>{node.description}</p>
    <ImageNodeComponent node={node} projectId={projectId} space={space} />
    <NodeEntitiesComponent 
      entityIds={node.entities} 
      projectId={projectId} 
      space={space}
    />
  </div>
);

export default TextNodeComponent;
