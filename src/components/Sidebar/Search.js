import React, { useState, useEffect } from 'react';
import { CATEGORIES } from '../../constants/categories';
import './Search.css';

const SearchResultCard = ({ wonder, onSelect }) => (
  <div className="search-result-card" onClick={() => onSelect(wonder)}>
    <div className="result-image">
      {wonder.coverImage?.url ? (
        <img src={wonder.coverImage.url} alt={wonder.name} />
      ) : (
        <div className="placeholder-image">
          <img 
            src={process.env.PUBLIC_URL + '/images/map-standard.svg'}
            alt="Placeholder Wonder" 
            style={{ width: '60%', height: '60%', objectFit: 'contain', filter: 'grayscale(100%) opacity(0.5)' }}
          />
        </div>
      )}
    </div>
    <div className="result-info">
      <h3>{wonder.name}</h3>
      <p>{wonder.description}</p>
      <div className="result-meta">
        <span className="result-category">
          {CATEGORIES[wonder.category]?.icon} {CATEGORIES[wonder.category]?.label}
        </span>
        <span className="result-location">{wonder.country}</span>
      </div>
    </div>
  </div>
);

const Search = ({ onSearch, onCategorySelect, searchResults = [], onWonderSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    const newIsSearching = query.length > 0 || selectedCategory !== null;
    setIsSearching(newIsSearching);
    if (onSearch) {
      onSearch(query, selectedCategory);
    }
  };

  const handleCategoryBtnClick = (categoryKey) => {
    const newCategory = categoryKey === selectedCategory ? null : categoryKey;
    setSelectedCategory(newCategory);
    const newIsSearching = searchQuery.length > 0 || newCategory !== null;
    setIsSearching(newIsSearching);
    if (onCategorySelect) {
      onCategorySelect(newCategory);
    }
  };

  const handleWonderCardSelect = (wonder) => {
    if (onWonderSelect) {
      onWonderSelect(wonder);
    }
  };

  return (
    <div className="search-container">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search wonders..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
        />
        <button className="search-button">
          🔍
        </button>
      </div>

      {isSearching ? (
        <div className="search-results">
          {searchResults.length > 0 ? (
            searchResults.map((wonder) => (
              <SearchResultCard 
                key={wonder.id} 
                wonder={wonder} 
                onSelect={handleWonderCardSelect}
              />
            ))
          ) : (
            <div className="no-results">
              <p>No wonders found {searchQuery ? `for "${searchQuery}"` : ''} {selectedCategory ? `in ${CATEGORIES[selectedCategory]?.label || 'the selected category'}` : ''}</p>
              <p>Try adjusting your search or exploring categories below</p>
              <div className="category-grid">
                {Object.entries(CATEGORIES).map(([key, { icon, label, color }]) => (
                  <button
                    key={key}
                    className={`category-button ${selectedCategory === key ? 'selected' : ''}`}
                    onClick={() => handleCategoryBtnClick(key)}
                    style={{
                      '--category-color': color,
                      '--category-hover-color': `${color}22`
                    }}
                  >
                    <span className="category-icon">{icon}</span>
                    <span className="category-label">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="category-grid">
          {Object.entries(CATEGORIES).map(([key, { icon, label, color }]) => (
            <button
              key={key}
              className={`category-button ${selectedCategory === key ? 'selected' : ''}`}
              onClick={() => handleCategoryBtnClick(key)}
              style={{
                '--category-color': color,
                '--category-hover-color': `${color}22`
              }}
            >
              <span className="category-icon">{icon}</span>
              <span className="category-label">{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search; 