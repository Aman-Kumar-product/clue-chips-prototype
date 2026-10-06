import React, { useState, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Share2, Check } from 'lucide-react';
import photosData from '../data/photos.json';
import './PhotoView.css';

export default function PhotoView({ photo, currentTask, onClose, onFoundIt }) {
  const [toastMsg, setToastMsg] = useState({ text: '', type: '' });
  const [displayPhoto, setDisplayPhoto] = useState(photo);

  useEffect(() => {
    setDisplayPhoto(photo);
  }, [photo]);

  const handleFoundIt = () => {
    // Check against the originally clicked photo or the displayPhoto
    const isCorrect = displayPhoto.id === currentTask?.target_photo_id;
    if (isCorrect) {
      setToastMsg({ text: "🎯 Correct! Great memory.", type: 'success' });
      setTimeout(() => {
        onFoundIt(true);
      }, 1500);
    } else {
      setToastMsg({ text: "❌ Not quite! Here is the actual photo.", type: 'error' });
      
      const targetPhoto = photosData.find(p => p.id === currentTask?.target_photo_id);
      if (targetPhoto) {
        setDisplayPhoto(targetPhoto);
      }
      
      setTimeout(() => {
        onFoundIt(false);
      }, 3500); // Give them 3.5 seconds to look at the correct photo before moving on
    }
  };
  return (
    <div className="photo-view-overlay">
      <div className="photo-view-header">
        <button className="icon-btn light" onClick={onClose}>
          <ArrowLeft size={24} color="white" />
        </button>
        <div className="header-actions">
          <button className="icon-btn light"><Share2 size={24} color="white" /></button>
          <button className="icon-btn light"><MoreVertical size={24} color="white" /></button>
        </div>
      </div>
      
      <div className="photo-view-content">
        <img 
          src={`/photos/${displayPhoto.file}`} 
          alt={displayPhoto.id} 
          onError={(e) => e.target.style.display = 'none'}
        />
      </div>

      <div className="photo-view-footer">
        {toastMsg.text && <div className={`toast-msg ${toastMsg.type}`}>{toastMsg.text}</div>}
        
        {currentTask && !toastMsg.text && (
          <button className="found-it-btn" onClick={handleFoundIt}>
            <Check size={20} /> Found It!
          </button>
        )}
        <div className="photo-date">{displayPhoto.date_taken || "Unknown Date"}</div>
      </div>
    </div>
  );
}
