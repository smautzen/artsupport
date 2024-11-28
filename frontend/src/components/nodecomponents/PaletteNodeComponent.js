import React from 'react';
import './PaletteNodeComponent.css'; // Import the CSS file for styling

const PaletteNodeComponent = ({ node }) => (
  <div className="palette-node">
    <p>{node.description}</p>
    <div className="palette-container">
      {node.palette && node.palette.map((color, index) => (
        <div
          key={index}
          className="color-circle"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  </div>
);

export default PaletteNodeComponent;
