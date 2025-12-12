import { useState, useRef, useEffect } from 'react';
import { createTeam, createPlayer, getTeams, getPlayers } from './api';

export default function SearchableInput({
  type, // 'team' or 'player'
  value,
  onChange,
  teams = [],
  players = [],
  onTeamsPlayersUpdate,
  placeholder = "Type to search or add new...",
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const options = type === 'team' ? teams : players;
  const selectedOption = options.find(opt => String(opt.id) === String(value));

  useEffect(() => {
    if (!searchTerm) {
      setFilteredOptions(options);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = options.filter(opt => {
        const name = opt.name.toLowerCase();
        return name.includes(term);
      });
      setFilteredOptions(filtered);
    }
  }, [options, searchTerm]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        if (selectedOption) {
          setSearchTerm('');
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedOption]);

  function handleSelect(option) {
    onChange(String(option.id));
    setIsOpen(false);
    setSearchTerm('');
  }

  function handleInputChange(e) {
    if (disabled) return;
    setSearchTerm(e.target.value);
    setIsOpen(true);
  }

  function handleInputFocus() {
    if (disabled) return;
    setIsOpen(true);
    if (selectedOption) {
      setSearchTerm('');
    }
  }

  async function handleCreateNew() {
    if (!searchTerm.trim()) return;
    
    setIsCreating(true);
    try {
      if (type === 'team') {
        const newTeam = await createTeam({ name: searchTerm.trim(), abbreviation: null });
        if (onTeamsPlayersUpdate) {
          const [updatedTeams, updatedPlayers] = await Promise.all([getTeams(), getPlayers()]);
          onTeamsPlayersUpdate(updatedTeams, updatedPlayers);
        }
        handleSelect(newTeam);
      } else {
        const newPlayer = await createPlayer({ name: searchTerm.trim(), team_id: null });
        if (onTeamsPlayersUpdate) {
          const [updatedTeams, updatedPlayers] = await Promise.all([getTeams(), getPlayers()]);
          onTeamsPlayersUpdate(updatedTeams, updatedPlayers);
        }
        handleSelect(newPlayer);
      }
    } catch (error) {
      alert('Error creating ' + type + ': ' + error.message);
    } finally {
      setIsCreating(false);
    }
  }

  const showCreateOption = searchTerm.trim() && 
    !filteredOptions.some(opt => opt.name.toLowerCase() === searchTerm.toLowerCase().trim());

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          className="form-input"
          value={isOpen ? searchTerm : (selectedOption ? selectedOption.name : '')}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={selectedOption ? selectedOption.name : placeholder}
          style={{ cursor: disabled ? 'not-allowed' : 'text', paddingRight: selectedOption ? '60px' : '40px' }}
          disabled={isCreating || disabled}
        />
        {selectedOption && !isOpen && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              setSearchTerm('');
              setIsOpen(false);
            }}
            style={{
              position: 'absolute',
              right: '32px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#999',
              fontSize: '18px',
              padding: '0 4px',
            }}
            title="Clear selection"
          >
            ×
          </button>
        )}
        <span
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: '#666',
          }}
        >
          {isOpen ? '▲' : '▼'}
        </span>
      </div>

      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: 'white',
            border: '2px solid #e0e0e0',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            maxHeight: '300px',
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            marginTop: '-2px',
          }}
        >
          {showCreateOption && (
            <div
              onClick={handleCreateNew}
              style={{
                padding: '12px',
                cursor: 'pointer',
                background: '#f0f9ff',
                borderBottom: '1px solid #e0e0e0',
                fontWeight: 600,
                color: '#0369a1',
              }}
              onMouseEnter={(e) => e.target.style.background = '#e0f2fe'}
              onMouseLeave={(e) => e.target.style.background = '#f0f9ff'}
            >
              {isCreating ? 'Creating...' : `Create "${searchTerm.trim()}"`}
            </div>
          )}
          {filteredOptions.length === 0 && !showCreateOption ? (
            <div style={{ padding: '12px', color: '#999', textAlign: 'center' }}>
              No results found
            </div>
          ) : (
            filteredOptions.map((option, idx) => {
              const isSelected = String(option.id) === String(value);
              
              return (
                <div
                  key={option.id}
                  onClick={() => handleSelect(option)}
                  style={{
                    padding: '12px',
                    cursor: 'pointer',
                    background: isSelected ? '#f0f0f0' : 'white',
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.target.style.background = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.target.style.background = 'white';
                  }}
                >
                  {option.name}
                  {type === 'player' && option.team_id && (
                    <span style={{ color: '#666', fontSize: '12px', marginLeft: '8px' }}>
                      ({teams.find(t => t.id === option.team_id)?.name || 'Unknown Team'})
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

