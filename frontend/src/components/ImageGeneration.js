import React, { useState } from "react";
import "./ImageGeneration.css";

const ImageGeneration = ({ attachedNodes, generateImages }) => {
  const [prompt, setPrompt] = useState("");
  const [imageCount, setImageCount] = useState(1);

  const handleGenerateImages = () => {
    if (!prompt.trim()) {
      console.error("Prompt is required to generate images.");
      return;
    }

    console.log("Generating images with the following data:");
    console.log("Prompt:", prompt);
    console.log("Image Count:", imageCount);
    console.log("Attached Nodes:", attachedNodes);

    // Call the generateImages function passed down from the ChatBox
    generateImages({
      prompt,
      n: imageCount,
      attachedNodes,
    });
  };

  return (
    <div className="image-generation-container">
      <h3>Generate AI Images</h3>
      <div>
        <label htmlFor="prompt">Enter Prompt:</label>
        <input
          type="text"
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type your custom prompt here..."
        />
      </div>
      <div>
        <label htmlFor="imageCount">Number of Images:</label>
        <input
          type="number"
          id="imageCount"
          value={imageCount}
          onChange={(e) => setImageCount(Math.max(1, Number(e.target.value)))}
          min="1"
        />
      </div>
      <button onClick={handleGenerateImages}>Generate Images</button>
    </div>
  );
};

export default ImageGeneration;
