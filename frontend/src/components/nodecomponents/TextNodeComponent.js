import React from 'react';

const TextNodeComponent = ({ node }) => (
  <div className="text-node">
    <p>{node.description}</p>
  </div>
);

export default TextNodeComponent;
