import React, { useState, useRef, useEffect } from 'react';
import OverlayComponent from './Overlay/OverlayComponent';
import './NewNodeComponent.css';

const NewNodeComponent = ({ projectId, spaceName, category, node, childNode }) => {
    const [showNewNodeMenu, setShowNewNodeMenu] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const menuRef = useRef();

    // Determine what to add based on the hierarchy structure
    const toAdd = !category
        ? 'Category'
        : !node
            ? 'Node'
            : !childNode
                ? 'Entity'
                : null; // Default to null if the hierarchy is fully populated


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowNewNodeMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleAddManually = () => {
        setShowOverlay(true); // Open overlay for manual entry
        setShowNewNodeMenu(false);
    };

    const handleGenerateSuggestions = () => {
        console.log('Generate suggestions clicked');
        setShowNewNodeMenu(false);
    };

    return (
        <div className="new-node-wrapper">
            <button
                className="new-node-button"
                onClick={() => setShowNewNodeMenu((prev) => !prev)}
            >
                + New {toAdd}
            </button>
            {showNewNodeMenu && (
                <div ref={menuRef} className="new-node-menu" onClick={(e) => e.stopPropagation()}>
                    <span>Enter {toAdd} details manually:</span>
                    <button className="menu-option" onClick={handleAddManually}>
                        Add manually
                    </button>
                    <span>Let the AI suggest {toAdd} options based on your input:</span>
                    <button className="menu-option" onClick={handleGenerateSuggestions}>
                        Generate suggestions
                    </button>
                </div>
            )}
            {showOverlay && (
                <OverlayComponent
                    action="addnode"
                    projectId={projectId}
                    item={{
                        space: spaceName.toLowerCase(),
                        category: category || null,
                        node: node || null,
                        childNode: childNode || null,
                    }}
                    onClose={() => setShowOverlay(false)} // Close the overlay
                />
            )}
        </div>
    );
};

export default NewNodeComponent;
