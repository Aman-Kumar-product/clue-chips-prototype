import React from 'react';
import { Search, Sparkles } from 'lucide-react';
import './SearchBar.css';

export default function SearchBar({ query, setQuery, onSearch }) {
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch(query);
    }
  };

  return (
    <div className="search-bar-container">
      <div className="search-bar-pill">
        <button className="icon-btn">
          <Sparkles size={24} color="#1a73e8" />
        </button>
        <input 
          type="text" 
          className="search-input" 
          placeholder="Describe your photo..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="icon-btn" onClick={() => onSearch(query)}>
          <Search size={20} color="#5f6368" />
        </button>
        <div className="avatar">A</div>
      </div>
    </div>
  );
}
