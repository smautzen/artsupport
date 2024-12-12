import React from 'react';
import ImageNodeComponent from './ImageNodeComponent';

const TextNodeComponent = ({ node }) => (
  <div className="text-node">
    <p>{node.description}</p>
    <ImageNodeComponent node={node} />
  </div>
);

export default TextNodeComponent;
