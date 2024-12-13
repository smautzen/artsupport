import React from 'react';
import './TextNodeComponent.css';
import ImageNodeComponent from './ImageNodeComponent';
import NodeEntitiesComponent from './NodeEntitiesComponent';

const TextNodeComponent = ({ node }) => (
  <div className="text-node">
    <p>{node.description}</p>
    <ImageNodeComponent node={node} />
    <NodeEntitiesComponent entities={node.entities} />
  </div>
);

export default TextNodeComponent;
