import React, { useState, useRef, useEffect} from 'react';
import { FixedSizeList } from 'react-window';
import './SearchableDropdown.css'; // Import the CSS file

const SearchableDropdown = ({ items, onItemSelect }) => {
  const [rawInput, setRawInput] = useState(''); // Store raw input
  const [sortedInput, setSortedInput] = useState(''); // Store sorted input

  const containerRef = useRef(null);  // Reference to the parent container
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Update size when the component is mounted or resized
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateSize(); // Initial size
    window.addEventListener('resize', updateSize); // Update size on window resize

    return () => {
      window.removeEventListener('resize', updateSize); // Cleanup
    };
  }, []);

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
      }}
      onClick={() => onItemSelect(filteredItems[index])} // Call the function to set selected item
    >
      {filteredItems[index]}
    </button>
  );
  
  return (
    <div className="searchable-dropdown" ref={containerRef}>
      <input
        type="text"
        placeholder="Search..."
        value={rawInput}
        onChange={handleSearch}
      />
      <div className="list-container">
        <FixedSizeList
          height={size.height} // The height of the dropdown
          itemCount={filteredItems.length}
          itemSize={35} // The height of each item
          width={size.width} // The width of the dropdown
        >
          {Row}
        </FixedSizeList>
        
        {filteredItems.length === 0 && (
          <p className="no-results">No results found</p>
        )}
      </div>
    </div>
  );
};

export default SearchableDropdown;
