import React, { useState } from 'react';
import beatsData from '../data/beats.json';
import photosData from '../data/photos.json';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './StorySlideshow.css';

export default function StorySlideshow({ onFinish }) {
  const [currentBeatIndex, setCurrentBeatIndex] = useState(0);

  const beat = beatsData[currentBeatIndex];
  const isFirst = currentBeatIndex === 0;
  const isLast = currentBeatIndex === beatsData.length - 1;

  const handleNext = () => {
    if (!isLast) setCurrentBeatIndex(prev => prev + 1);
    else onFinish();
  };

  const handlePrev = () => {
    if (!isFirst) setCurrentBeatIndex(prev => prev - 1);
  };

  // Get photos for current beat
  const beatPhotos = beat.photo_ids.map(id => {
    return photosData.find(p => p.id === id);
  }).filter(Boolean);

  return (
    <div className="slideshow-container">
      <div className="top-bar">
        <span className="slide-counter">Slide {currentBeatIndex + 1} of {beatsData.length}</span>
        <button className="google-btn-secondary skip-btn" onClick={onFinish}>
          Skip to Prototype
        </button>
      </div>

      <div className="slideshow-content">
        <div className={`photo-grid photos-${Math.min(beatPhotos.length, 4)}`}>
          {beatPhotos.map((photo) => (
            <div key={photo.id} className="photo-wrapper">
              <img 
                src={`/photos/${photo.file}`} 
                alt={photo.id} 
                onError={(e) => e.target.parentElement.style.display = 'none'}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bottom-bar">
        <button className="nav-btn" onClick={handlePrev} disabled={isFirst}>
          <ChevronLeft size={24} />
        </button>
        
        <div className="narration">
          {beat.narration_line}
        </div>

        <button className="nav-btn primary-nav" onClick={handleNext}>
          {isLast ? 'Finish Story' : <><span style={{marginRight: 4}}>Next</span> <ChevronRight size={20} /></>}
        </button>
      </div>
    </div>
  );
}
