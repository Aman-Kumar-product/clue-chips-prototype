import React from 'react';
import './GalleryGrid.css';

export default function GalleryGrid({ photos, onPhotoClick }) {
  // Flex layout simulating Google Photos masonry
  return (
    <div className="gallery-grid">
      {photos.map(photo => (
        <div 
          key={photo.id} 
          className="gallery-item"
          onClick={() => onPhotoClick(photo)}
        >
          <img 
            src={`/photos/${photo.file}`} 
            alt={photo.id} 
            loading="lazy"
            onError={(e) => e.target.parentElement.style.display = 'none'}
          />
        </div>
      ))}
    </div>
  );
}
