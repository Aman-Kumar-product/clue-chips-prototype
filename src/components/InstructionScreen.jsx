import React from 'react';
import './InstructionScreen.css';

export default function InstructionScreen({ onBegin }) {
  return (
    <div className="instruction-container">
      <div className="instruction-content">
        <h1>Welcome to the Memory Retrieval Experiment</h1>
        <p className="intro">
          Before testing the prototype, please take a few minutes to view a short visual story about Aanya's college years.
        </p>

        <div className="section">
          <h2>Why are we doing this?</h2>
          <p>
            If you were asked to search a generic stock photo library, you wouldn't know what to look for. By going through this story first, you will build a "fuzzy memory" of the gallery. This allows us to accurately test how well our prototype helps you retrieve photos from a fading memory.
          </p>
        </div>

        <div className="section">
          <h2>What to expect:</h2>
          <ul>
            <li><strong>The Story:</strong> You will click through <strong>42 slides</strong> containing <strong>110 pictures</strong> that tell Aanya's story.</li>
            <li><strong>The Gallery:</strong> Afterwards, you will enter a <strong>350-photo gallery</strong>. This contains the story photos mixed with random screenshots, documents, and lifestyle images (just like a real phone gallery).</li>
            <li><strong>The Goal:</strong> You will be given tasks asking you to retrieve specific photos based purely on what you remember from the story.</li>
          </ul>
        </div>

        <div className="section" style={{ backgroundColor: 'rgba(255, 171, 0, 0.1)', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid #ffab00' }}>
          <h2 style={{ color: '#ffab00', marginTop: 0, fontSize: '16px' }}>⚠️ Prototype Performance Notes:</h2>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#5f6368' }}>
            <li><strong>Initial Search:</strong> The AI model runs entirely in your browser. Your very first search will take a few extra seconds to download the AI engine.</li>
            <li><strong>Scrolling:</strong> We don't compress thumbnails, so the gallery forces your browser to load dozens of megabytes of high-res images at once. Scrolling may be slightly sluggish!</li>
          </ul>
        </div>

        <p className="outro">
          Please take your time to experience the story. When you are ready, click below to begin.
        </p>

        <div className="action-row">
          <button className="google-btn-primary" onClick={onBegin}>
            Begin Story
          </button>
        </div>
      </div>
    </div>
  );
}
