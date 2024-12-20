import React, { useState, useMemo } from "react";
import axios from "axios";

import "./ImageGeneration.css";

const ImageGeneration = ({ projectId, attachedHierarchy, onClose }) => {
  const [prompt, setPrompt] = useState("");
  const [enhancePrompt, setEnhancePrompt] = useState(false); // Toggle between own prompt and enhanced prompt
  const [imageCount, setImageCount] = useState(1);

  // Determine the type and title dynamically based on attachedHierarchy
  const { type, title } = useMemo(() => {
    if (!attachedHierarchy) {
      return { type: null, title: null };
    }
    if (!attachedHierarchy.node) {
      return { type: "category", title: attachedHierarchy.category?.title || "Unknown Category" };
    }
    return { type: "node", title: attachedHierarchy.node?.title || "Unknown Node" };
  }, [attachedHierarchy]);

  const handleGenerateImages = async () => {
    const payload = {
      projectId,
      prompt,
      n: imageCount,
      attachedHierarchy: attachedHierarchy || null,
      enhancePrompt, // Use the updated parameter
    };

    onClose();

    try {
      console.log("Final payload being sent to server:", payload);

      const response = await axios.post(
        "http://localhost:4000/generate-image",
        payload
      );
      console.log("Response from server:", response);

    } catch (error) {
      console.error("Error generating images:", error);
    }
  };

  return (
    <div className="image-generation-container">
      <div className="header-section">
        <h2>Generate images</h2>
        <span>
          {type && title
            ? `Please choose options for generating images for the ${type} ${title}`
            : "Please choose options for generating images"}
        </span>
        <strong>
          <span>Select how you want to generate the image generation prompt:</span>
        </strong>
      </div>

      {/* Prompt Selection Options */}
      <div className="prompt-choice-div">
        {/* Manual Prompt Option */}
        <div className="manual-prompt-div">
          <div>
            <label>
              <input
                type="radio"
                checked={!enhancePrompt}
                onChange={() => setEnhancePrompt(false)}
              />
              <strong>Only use my own prompt</strong>
            </label>
          </div>
          <div className="description">
            The system will generate images strictly based on your own prompt.
          </div>
        </div>

        {/* Enhanced Prompt Option */}
        <div className="enhanced-prompt-div">
          <div>
            <label>
              <input
                type="radio"
                checked={enhancePrompt}
                onChange={() => setEnhancePrompt(true)}
              />
              <strong>AI created prompt</strong>
            </label>
          </div>
          <div className="description">
            The AI will generate a prompt based on the {type ? "context of the selected node and the " : ""}
            information you have supplied about the project in general. You can attach additional directions in
            your own prompt, which the AI will take into account.
          </div>
        </div>
      </div>

      {/* Number of Images */}
      <div>
        <label htmlFor="imageCount">Number of Images:</label>
        <input
          type="number"
          id="imageCount"
          value={imageCount}
          onChange={(e) => setImageCount(Math.max(1, Math.min(4, Number(e.target.value))))}
          min="1"
          max="4"
        />
      </div>

      {/* Text Input */}
      <div>
        <label htmlFor="prompt">Enter Prompt:</label>
        <input
          className="input-box"
          type="text"
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            enhancePrompt
              ? "Add additional directions for the AI to enhance..."
              : "Type your custom prompt here..."
          }
        />
      </div>

      <button onClick={handleGenerateImages}>Generate Images</button>
    </div>
  );
};

export default ImageGeneration;
