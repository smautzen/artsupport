import React, { useState } from "react";
import axios from 'axios';

import "./ImageGeneration.css";

const ImageGeneration = ({ projectId, attachedHierarchy }) => {
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
    console.log("Attached Nodes:", attachedHierarchy);

    // Call the generateImages function passed down from the ChatBox
    generateImages({
      prompt,
      n: imageCount,
      attachedHierarchy,
    });
  };

  const generateImages = async ({ prompt, n }) => {
    try {
      const payload = {
        projectId,
        prompt,
        n,
        attachedHierarchy: attachedHierarchy || null, // Pass the full hierarchy
      };

      console.log('Final payload being sent to server:', payload);

      const response = await axios.post('http://localhost:4000/generate-image', payload);
      console.log('Response from server:', response);
    } catch (error) {
      console.error('Error generating images:', error);
    }
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
