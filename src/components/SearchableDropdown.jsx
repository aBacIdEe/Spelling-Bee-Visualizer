import React, { useState } from 'react';
import { FixedSizeList as List } from 'react-window';

const SearchableDropdown = ({ items, onItemSelect }) => {
  const [rawInput, setRawInput] = useState(''); // Store raw input
  const [sortedInput, setSortedInput] = useState(''); // Store sorted input
  const [isOpen, setIsOpen] = useState(true); // Show list by default

  const handleSearch = (event) => {
    const term = event.target.value;
    setRawInput(term);

    // Sort the characters of the input term alphabetically
    const sortedTerm = term.split('').sort().join('');
    setSortedInput(sortedTerm);
  };

  const filteredItems = sortedInput
    ? items.filter(item => item.toLowerCase().includes(sortedInput.toLowerCase()))
    : items;

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

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
    <div>
      <input
        type="text"
        placeholder="Search..."
        value={rawInput}
        onChange={handleSearch}
      />
      <button onClick={toggleDropdown}>
        {isOpen ? 'Hide List' : 'Show List'}
      </button>
      {isOpen && (
        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc' }}>
          <List
            height={200}
            itemCount={filteredItems.length}
            itemSize={35}
            width="100%"
          >
            {Row}
          </List>
          {filteredItems.length === 0 && <p>No results found</p>}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
