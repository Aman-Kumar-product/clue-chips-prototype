import React, { useState, useEffect } from 'react';
import PrototypeScreen from './PrototypeScreen';
import tasksData from '../data/tasks.json';
import photosData from '../data/photos.json';
import { logTelemetry } from '../utils/analytics';
import './TaskFlow.css';

// Filter out the instruction entry at the bottom of the JSON
const validTasks = tasksData.filter(t => t.task_id && !t.task_id.startsWith('Assignment'));

export default function TaskFlow({ onFinish, onSkipToExplore }) {
  const [taskIndex, setTaskIndex] = useState(0);
  const [phase, setPhase] = useState('PRE_TASK'); // PRE_TASK, FLASHING, IN_TASK, END
  const [memoryRating, setMemoryRating] = useState(null);
  const [startTime, setStartTime] = useState(null);

  // We will run 3 tasks for the prototype testing
  const currentTask = validTasks[taskIndex];
  const targetPhoto = currentTask ? photosData.find(p => p.id === currentTask.target_photo_id) : null;

  const handleStartTask = (rating) => {
    setMemoryRating(rating);
    setPhase('FLASHING');
  };

  useEffect(() => {
    if (phase === 'FLASHING') {
      const timer = setTimeout(() => {
        setStartTime(Date.now());
        logTelemetry({
          event: "TASK_STARTED",
          taskId: currentTask.task_id,
          memoryRating: memoryRating
        });
        setPhase('IN_TASK');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [phase, currentTask, memoryRating]);

  const handleTaskComplete = (status, selectedPhotoId = null, queryCount = 0, activeChipCount = 0, isCorrect = false) => {
    const timeTaken = (Date.now() - startTime) / 1000; // in seconds
    
    logTelemetry({
      event: "TASK_COMPLETED",
      taskId: currentTask.task_id,
      status: status, // "SUCCESS" or "GAVE_UP"
      timeTakenSec: timeTaken,
      queriesMade: queryCount,
      chipsUsed: activeChipCount,
      selectedPhotoId: selectedPhotoId,
      isCorrect: isCorrect
    });

    const maxTasks = Math.min(validTasks.length, 10);
    if (taskIndex + 1 < maxTasks) {
      setTaskIndex(taskIndex + 1);
      setPhase('PRE_TASK');
    } else {
      setPhase('END');
    }
  };

  if (phase === 'END') {
    return (
      <div className="task-flow-container center">
        <h1>All Tasks Complete!</h1>
        <p>Thank you for participating in the testing phase.</p>
        <button className="google-btn-primary" onClick={onFinish} style={{marginTop: 24}}>
          Enter Free Explore Mode
        </button>
      </div>
    );
  }

  if (phase === 'FLASHING') {
    return (
      <div className="task-flow-container center flash-screen" style={{ backgroundColor: '#111', color: '#fff' }}>
        <h2 style={{ marginBottom: 16 }}>Find this exact photo</h2>
        {targetPhoto && (
          <img 
            src={`/photos/${targetPhoto.file}`} 
            alt="Target to memorize" 
            style={{ 
              maxWidth: '90%', 
              maxHeight: '70vh', 
              borderRadius: '8px', 
              boxShadow: '0 8px 32px rgba(0,0,0,0.8)' 
            }} 
          />
        )}
        <div className="progress-bar-container" style={{ width: '80%', maxWidth: '600px', height: '6px', background: '#333', marginTop: '32px', borderRadius: '3px', overflow: 'hidden' }}>
          <div className="progress-bar-fill shrink-anim" style={{ height: '100%', background: '#4285F4' }}></div>
        </div>
      </div>
    );
  }

  if (phase === 'PRE_TASK') {
    const maxTasks = Math.min(validTasks.length, 10);
    return (
      <div className="task-flow-container center">
        <div className="task-card">
          <h2>Task {taskIndex + 1} of {maxTasks}</h2>
          <p className="task-hint">"{currentTask.hint}"</p>
          
          <div className="rating-section">
            <p>How clearly do you remember this photo from the story?</p>
            <div className="rating-buttons">
              {[1, 2, 3, 4, 5].map(num => (
                <button 
                  key={num} 
                  className="rating-btn"
                  onClick={() => handleStartTask(num)}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="rating-labels">
              <span>1 - Very fuzzy</span>
              <span>5 - Very clear</span>
            </div>
          </div>
          
          <button className="skip-test-btn" onClick={onSkipToExplore}>
            Skip test, I would like to explore freely
          </button>
        </div>
      </div>
    );
  }

  return (
    <PrototypeScreen 
      currentTask={currentTask} 
      onTaskComplete={handleTaskComplete} 
    />
  );
}
