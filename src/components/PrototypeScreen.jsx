import React, { useState } from 'react';
import SearchBar from './SearchBar';
import GalleryGrid from './GalleryGrid';
import PhotoView from './PhotoView';
import photosData from '../data/photos.json';
import { getQueryEmbedding, parseIntentWithGroq, rankPhotos, generateClueChips } from '../utils/searchEngine';
import './PrototypeScreen.css';

// Put your Groq API key here or in a .env file as VITE_GROQ_API_KEY
const HARDCODED_GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

export default function PrototypeScreen({ currentTask, onTaskComplete }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [rankedPhotos, setRankedPhotos] = useState(null);
  
  // Analytics Tracking
  const [queryCount, setQueryCount] = useState(0);
  const [chipCount, setChipCount] = useState(0);
  
  // Phase 3: Clue Chips State
  const [clueChips, setClueChips] = useState([]);
  const [activeChips, setActiveChips] = useState([]);
  const [lastQueryContext, setLastQueryContext] = useState(null);
  
  // Custom chip UI state
  const [customChipText, setCustomChipText] = useState('');
  const [isTypingCustom, setIsTypingCustom] = useState(false);
  
  // Track async operations to prevent race conditions
  const searchIdRef = React.useRef(0);
  
  const [groqKey, setGroqKey] = useState(localStorage.getItem('GROQ_API_KEY') || HARDCODED_GROQ_KEY);
  const [showSettings, setShowSettings] = useState(false);

  const saveKey = (e) => {
    setGroqKey(e.target.value);
    localStorage.setItem('GROQ_API_KEY', e.target.value);
  };

  const resetToDefault = () => {
    setSearchQuery('');
    setRankedPhotos(null);
    setClueChips([]);
    setActiveChips([]);
    setLastQueryContext(null);
  };

  // Helper to split photos
  const splitPhotos = (results, active) => {
    if (!results || results.length === 0) return { relevant: [], other: [] };
    
    // Use an absolute threshold for high recall. 
    // This ensures all visually related photos (like train windows or street food) make it into "Most relevant".
    // Since intent boosts add 2.0, anything > 0.28 is a solid semantic match.
    const semanticThreshold = 0.28; 
    
    let relevant = [];
    let other = [];
    
    if (active.length > 0) {
      relevant = results.filter(p => p.passesHardFilter && p.semanticAndIntentScore >= semanticThreshold);
      other = results.filter(p => !(p.passesHardFilter && p.semanticAndIntentScore >= semanticThreshold));
    } else {
      relevant = results.filter(p => p.semanticAndIntentScore >= semanticThreshold);
      other = results.filter(p => p.semanticAndIntentScore < semanticThreshold);
    }
    return { relevant, other };
  };

  const executeSearch = async (query) => {
    if (!query.trim()) {
      setRankedPhotos(null);
      setClueChips([]);
      setActiveChips([]);
      setLastQueryContext(null);
      return;
    }

    setIsSearching(true);
    setQueryCount(prev => prev + 1);
    
    const currentSearchId = ++searchIdRef.current;
    
    try {
      const queryEmb = await getQueryEmbedding(query);
      const intent = await parseIntentWithGroq(query, groqKey);

      const results = await rankPhotos(queryEmb, intent, photosData, []);
      if (searchIdRef.current !== currentSearchId) return; // Discard stale result
      
      const { relevant } = splitPhotos(results, []);
      
      setRankedPhotos(results);
      setClueChips(generateClueChips(relevant));
      setActiveChips([]); 
      setLastQueryContext({ queryEmb, intent });
    } catch (e) {
      console.error("Search failed:", e);
      alert("Search failed. Check console for details.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleChipToggle = async (chip) => {
    const isActive = activeChips.find(c => c.key === chip.key);
    let newActiveChips;
    
    if (isActive) {
      newActiveChips = activeChips.filter(c => c.key !== chip.key);
    } else {
      newActiveChips = [...activeChips, chip];
      setChipCount(prev => prev + 1);
    }
    
    setActiveChips(newActiveChips);
    
    if (lastQueryContext) {
      const currentSearchId = ++searchIdRef.current;
      
      const results = await rankPhotos(lastQueryContext.queryEmb, lastQueryContext.intent, photosData, newActiveChips);
      if (searchIdRef.current !== currentSearchId) return; // Discard stale result
      
      setRankedPhotos(results);
      
      // Generate chips from ALL relevant photos, not just the top 30
      let newClueChips = generateClueChips(relevant);
      newClueChips = newClueChips.filter(c => !newActiveChips.find(ac => ac.key === c.key));
      setClueChips(newClueChips);
    }
  };

  // Split logic using the helper
  const { relevant: relevantPhotos, other: otherPhotos } = splitPhotos(rankedPhotos || [], activeChips);

  // Separate Chips into Categories and Deduplicate them perfectly
  const combinedChips = [...activeChips, ...clueChips];
  const uniqueChipsMap = new Map();
  combinedChips.forEach(c => uniqueChipsMap.set(c.key, c));
  const allChips = Array.from(uniqueChipsMap.values());
  
  const peopleChips = allChips.filter(c => c.type === 'people');
  const otherFilterChips = allChips.filter(c => c.type !== 'people');

  const renderChip = (chip) => {
    const isActive = activeChips.find(ac => ac.key === chip.key);
    return (
      <button key={chip.key} className={`clue-chip ${isActive ? 'active' : ''}`} onClick={() => handleChipToggle(chip)}>
        {chip.value} {isActive ? '✕' : <span className="chip-count">{chip.count}</span>}
      </button>
    );
  };

  return (
    <div className="prototype-container">
      <SearchBar 
        query={searchQuery} 
        setQuery={setSearchQuery} 
        onSearch={executeSearch}
        onSettingsClick={() => setShowSettings(!showSettings)}
      />

      {(rankedPhotos !== null) && (
        <div className="filters-section">
          {peopleChips.length > 0 && (
            <div className="chip-category">
              <div className="chip-category-label">People</div>
              <div className="clue-chips-container">
                {peopleChips.map(renderChip)}
              </div>
            </div>
          )}
          
          <div className="chip-category">
            <div className="chip-category-label">Filters as per search results</div>
            <div className="clue-chips-container">
              {otherFilterChips.map(renderChip)}
              
              {isTypingCustom ? (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (customChipText.trim()) {
                    handleChipToggle({ 
                      type: 'custom', 
                      value: customChipText.trim(), 
                      key: 'custom:' + customChipText.trim().toLowerCase(), 
                      count: '?' 
                    });
                    setCustomChipText('');
                  }
                  setIsTypingCustom(false);
                }}>
                  <input 
                    type="text" 
                    className="custom-chip-input" 
                    autoFocus 
                    value={customChipText} 
                    onChange={e => setCustomChipText(e.target.value)} 
                    onBlur={() => setIsTypingCustom(false)}
                    placeholder="Type keyword..." 
                  />
                </form>
              ) : (
                <button className="clue-chip custom-add-btn" onClick={() => setIsTypingCustom(true)}>
                  + Add memory filter
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {showSettings && (
        <div className="api-settings">
          <input 
            type="password" 
            placeholder="Paste Groq API Key here..." 
            value={groqKey} 
            onChange={saveKey}
          />
          <small>Key is saved to your browser's LocalStorage</small>
        </div>
      )}

      <div className={`gallery-scroll-area ${(clueChips.length > 0 || activeChips.length > 0) ? 'with-chips' : ''}`}>
        {isSearching ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Analyzing intent and searching...</p>
          </div>
        ) : rankedPhotos ? (
          <div className="search-results-wrapper">
            {relevantPhotos.length > 0 ? (
              <>
                <h3 className="section-header">Most relevant</h3>
                <GalleryGrid photos={relevantPhotos} onPhotoClick={setSelectedPhoto} />
              </>
            ) : (
              <div className="empty-relevant-msg">
                <p>No highly relevant photos match all your filters.</p>
              </div>
            )}
            
            {otherPhotos.length > 0 && (
              <>
                <h3 className="section-header" style={{marginTop: 24}}>Other similar photos</h3>
                <GalleryGrid photos={otherPhotos} onPhotoClick={setSelectedPhoto} />
              </>
            )}
          </div>
        ) : (
          <GalleryGrid 
            photos={photosData} 
            onPhotoClick={setSelectedPhoto} 
          />
        )}
      </div>

      {currentTask && (
        <div className="task-banner">
          <div className="task-banner-text"><strong>Task:</strong> {currentTask.hint}</div>
          <button 
            className="give-up-btn" 
            onClick={() => onTaskComplete('GAVE_UP', null, queryCount, chipCount)}
          >
            Give Up
          </button>
        </div>
      )}

      {selectedPhoto && (
        <PhotoView 
          photo={selectedPhoto}
          currentTask={currentTask}
          onClose={() => setSelectedPhoto(null)} 
          onFoundIt={(isCorrect) => {
            setSelectedPhoto(null);
            onTaskComplete('SUCCESS', selectedPhoto.id, queryCount, chipCount, isCorrect);
          }}
        />
      )}
      
      <div className="bottom-nav">
        <div className="nav-item active" onClick={resetToDefault} style={{cursor: 'pointer'}}><span className="icon">🖼️</span>Photos</div>
        <div className="nav-item"><span className="icon">🔍</span>Search</div>
        <div className="nav-item"><span className="icon">👥</span>Sharing</div>
        <div className="nav-item"><span className="icon">📚</span>Library</div>
      </div>
    </div>
  );
}
