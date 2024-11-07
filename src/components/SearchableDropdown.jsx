import React, { useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import './SearchableDropdown.css'; // Import the CSS file

const SearchableDropdown = ({ items, onItemSelect }) => {
  const [rawInput, setRawInput] = useState(''); // Store raw input
  const [sortedInput, setSortedInput] = useState(''); // Store sorted input

  const handleSearch = (event) => {
    const term = event.target.value;
    setRawInput(term);

    // Sort the characters of the input term alphabetically
    const sortedTerm = term.split('').sort().join('');
    setSortedInput(sortedTerm);
  };

  // Function to check if input is a subset of the item
  const isSubset = (item, term) => {
    const itemChars = item.toLowerCase().split('');
    const termChars = term.split('');

    return termChars.every(char => itemChars.includes(char));
  };

  const filteredItems = sortedInput
    ? items.filter(item => isSubset(item, sortedInput))
    : items;

  const Row = ({ index, style }) => (
    <button
      style={{
        ...style,
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: 'none',
        border: 'none',
        padding: '10px',
        cursor: 'pointer',
      }}
      onClick={() => onItemSelect(filteredItems[index])} // Call the function to set selected item
    >
      {filteredItems[index]}
    </button>
  );

  return (
    <div className="searchable-dropdown">
      <input
        type="text"
        placeholder="Search..."
        value={rawInput}
        onChange={handleSearch}
      />
      <div className="list-container">
        <List
          height={800} // The height of the dropdown
          itemCount={filteredItems.length}
          itemSize={35} // The height of each item
          width={600} // The width of the dropdown
        >
          {Row}
        </List>
        
        {filteredItems.length === 0 && (
          <p className="no-results">No results found</p>
        )}
      </div>
    </div>
  );
};

export default SearchableDropdown;
