import React, { useState } from 'react';
import InstructionScreen from './components/InstructionScreen';
import StorySlideshow from './components/StorySlideshow';
import TaskFlow from './components/TaskFlow';
import PrototypeScreen from './components/PrototypeScreen';
import './index.css';

function App() {
  const [currentPhase, setCurrentPhase] = useState('INSTRUCTIONS');

  return (
    <>
      {currentPhase === 'INSTRUCTIONS' && (
        <InstructionScreen onBegin={() => setCurrentPhase('STORY')} />
      )}
      
      {currentPhase === 'STORY' && (
        <StorySlideshow onFinish={() => setCurrentPhase('TASKS')} />
      )}

      {currentPhase === 'TASKS' && (
        <TaskFlow 
          onFinish={() => setCurrentPhase('EXPLORE')} 
          onSkipToExplore={() => setCurrentPhase('EXPLORE')}
        />
      )}

      {currentPhase === 'EXPLORE' && (
        <PrototypeScreen />
      )}
    </>
  );
}

export default App;
