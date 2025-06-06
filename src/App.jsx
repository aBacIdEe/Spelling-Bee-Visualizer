import { useEffect, useState, useRef } from "react";

function App() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [subSelectedItem, setSubSelectedItem] = useState(null);
  const [selectedCharacters, setSelectedCharacters] = useState([]);
  const [selectedQueries, setSelectedQueries] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [parentKeys, setParentKeys] = useState([]);
  const [childKeys, setChildKeys] = useState([]);
  
  // Add ref for the dropdown container
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("validCombos.txt");
        const text = await response.text();
        const itemsArray = text
          .split("\n")
          .map((item) => item.trim())
          .filter((item) => item);
        setItems(itemsArray);
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };

    fetchItems();
  }, []);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    // Add event listener when dropdown is shown
    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  // Process input string: remove non-alphabetic, deduplicate, sort
  const processQuery = (query) => {
    return [...new Set(query.toLowerCase().replace(/[^a-z]/g, ''))].sort().join('');
  };

  // Calculate edit distance between two strings
  const editDistance = (str1, str2) => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[j][i] = matrix[j - 1][i - 1];
        } else {
          matrix[j][i] = Math.min(
            matrix[j - 1][i] + 1,     // deletion
            matrix[j][i - 1] + 1,     // insertion
            matrix[j - 1][i - 1] + 1  // substitution
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  // Heuristic scoring function
  const calculateScore = (item, processedQuery) => {
    if (processedQuery === "") return 1000; // High score for empty query
    if (item === processedQuery) return 0; // Perfect match gets lowest score
    
    let score = 0;
    
    // Weight 1: Initial character matching (heavily weighted)
    let matchingPrefixLength = 0;
    const minLength = Math.min(item.length, processedQuery.length);
    for (let i = 0; i < minLength; i++) {
      if (item[i] === processedQuery[i]) {
        matchingPrefixLength++;
      } else {
        break;
      }
    }
    score += (minLength - matchingPrefixLength) * 10; // Heavy penalty for non-matching prefix
    
    // Weight 2: Edit distance (medium weight)
    const editDist = editDistance(item, processedQuery);
    score += editDist * 3;
    
    // Weight 3: Length difference (light weight)
    score += Math.abs(item.length - processedQuery.length);
    
    return score;
  };

  // Filter items based on processed input
  useEffect(() => {
    const processedQuery = processQuery(inputValue);
    
    if (processedQuery === "") {
      setFilteredItems([]);
    } else {
      // Filter items that contain all characters from the processed query
      const candidateItems = items.filter(item => {
        const processedItem = processQuery(item);
        // Check if all characters in processedQuery are present in the item
        return [...processedQuery].every(char => processedItem.includes(char));
      });
      
      // Sort by heuristic score and take top 10
      const sortedItems = candidateItems
        .map(item => ({ item, score: calculateScore(item, processedQuery) }))
        .sort((a, b) => a.score - b.score)
        .map(obj => obj.item)
        .slice(0, 10);
      
      setFilteredItems(sortedItems);
    }
  }, [inputValue, items]);

  // Calculate parent and child keys when selectedItem changes
  useEffect(() => {
    if (selectedItem && items.length > 0) {
      const parents = findParentKeys(selectedItem, items);
      const children = findChildKeys(selectedItem, items);
      setParentKeys(parents);
      setChildKeys(children);
    } else {
      setParentKeys([]);
      setChildKeys([]);
    }
  }, [selectedItem, items]);

  // Helper function to check if a string contains all characters of another string
  const containsAllCharacters = (longer, shorter) => {
    const shorterChars = shorter.split('').sort();
    const longerChars = longer.split('').sort();
    
    let i = 0, j = 0;
    while (i < shorterChars.length && j < longerChars.length) {
      if (shorterChars[i] === longerChars[j]) {
        i++;
      }
      j++;
    }
    return i === shorterChars.length;
  };

  // Find parent keys (one character longer and contains all letters of current key)
  const findParentKeys = (currentKey, allItems) => {
    return allItems.filter(item => 
      item.length === currentKey.length + 1 && 
      containsAllCharacters(item, currentKey)
    ).sort();
  };

  // Find child keys (one character shorter and all letters contained in current key)
  const findChildKeys = (currentKey, allItems) => {
    return allItems.filter(item => 
      item.length === currentKey.length - 1 && 
      containsAllCharacters(currentKey, item)
    ).sort();
  };

  const handleItemSelect = async (item) => {
    setSelectedItem(item);
    setSubSelectedItem(item);
    setSelectedCharacters([]);
    setInputValue(item);
    setShowSuggestions(false);

    try {
      const res = await fetch(`chunkedTrees/${item.slice(0, 4)}.json`);

      if (!res.ok) {
        console.error("Failed to fetch data:", res.statusText);
        return;
      }

      const data = await res.json();
      setSelectedQueries(data[item]);
      setSelectedWords([]);

      const wordsArray = [];

      for (let i = 0; i < data[item].length; i++) {
        const res2 = await fetch(`chunkedWords/${data[item][i].slice(0, 4)}.json`);

        if (!res2.ok) {
          console.error("Failed to fetch data:", res2.statusText);
          return;
        }

        const words = await res2.json();
        wordsArray.push(...words[data[item][i]]);
      }

      wordsArray.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
      setSelectedWords(wordsArray);
    } catch (error) {
      console.error("Error during fetch:", error);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(true);
    
    if (items.includes(value)) {
      handleItemSelect(value);
    }
  };

  const handleSuggestionClick = (item) => {
    handleItemSelect(item);
  };

  const handleKeyClick = (key) => {
    handleItemSelect(key);
  };

  const containsAllChars = (word, selectedItem) => {
    const charCount = {};
    for (let char of selectedItem) {
      charCount[char] = (charCount[char] || 0) + 1;
    }

    for (let char of selectedItem) {
      if (!word.includes(char)) {
        return false;
      }
    }
    return true;
  };

  const removeDuplicateAndSortCharacters = (word) => {
    return [...new Set(word)].sort().join("");
  };

  const handleCharacterToggle = (character) => {
    setSelectedCharacters(
      (prevState) =>
        prevState.includes(character)
          ? prevState.filter((char) => char !== character)
          : [...prevState, character]
    );
  };

  const passesFilter = (word) => {
    return selectedCharacters.every((char) => word.includes(char));
  };

  const decideColor = (word) => {
    if (containsAllChars(word, subSelectedItem)) {
      return "red";
    } else {
      return "inherit";
    }
  };

  const KeyList = ({ keys, title, emptyMessage }) => (
    <div style={{ 
      height: '100%',
      padding: '15px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#333', textAlign: 'center' }}>{title}</h3>
      {keys.length > 0 ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexWrap: 'wrap',
          alignContent: 'flex-start',
          justifyContent: 'center',
          gap: '8px',
          overflow: 'auto'
        }}>
          {keys.map((key, index) => (
            <button
              key={index}
              onClick={() => handleKeyClick(key)}
              style={{
                padding: '8px 12px',
                backgroundColor: '#e9ecef',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'monospace',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                height: 'fit-content'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#007bff';
                e.target.style.color = 'white';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#e9ecef';
                e.target.style.color = 'black';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              {key}
            </button>
          ))}
        </div>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <p style={{ color: '#666', fontStyle: 'italic' }}>{emptyMessage}</p>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      width: '100vw',
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Top Row - Parent Keys */}
      <div style={{ 
        height: '20vh',
        borderBottom: '2px solid #ccc',
        backgroundColor: '#f8f9fa',
        overflow: 'hidden'
      }}>
        <KeyList 
          keys={parentKeys} 
          title="Parent Keys" 
          emptyMessage="No parent keys available"
        />
      </div>

      {/* Middle Row - Key Selection and Words Display */}
      <div style={{ 
        height: '60vh',
        display: 'flex',
        borderBottom: '2px solid #ccc',
        overflow: 'hidden'
      }}>
        {/* Left side - Key Selection */}
        <div style={{ 
          width: '25vw',
          padding: '20px',
          borderRight: '2px solid #ccc',
          backgroundColor: '#fff',
          overflow: 'auto'
        }}>
          <h2 style={{ marginBottom: '15px', textAlign: 'center' }}>Key Selection</h2>
          <p style={{ textAlign: 'center', marginBottom: '15px', color: '#666' }}>
            Current: {selectedItem || 'None'}
          </p>
          
          <div ref={dropdownRef} style={{ position: 'relative', marginBottom: '20px' }}>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Type any word to find matching keys..."
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '2px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
            
            {showSuggestions && filteredItems.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                right: '0',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderTop: 'none',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {filteredItems.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionClick(item)}
                    style={{
                      padding: '10px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee',
                      backgroundColor: 'white'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedItem && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '10px' }}>Filter by Character:</p>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '4px',
                border: '2px solid #ddd',
                borderRadius: '4px',
                padding: '8px'
              }}>
                {selectedItem.split("").map((char, index) => (
                  <button
                    key={index}
                    onClick={() => handleCharacterToggle(char)}
                    style={{
                      padding: '6px 10px',
                      border: 'none',
                      backgroundColor: selectedCharacters.includes(char) ? '#007bff' : 'white',
                      color: selectedCharacters.includes(char) ? 'white' : '#333',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      borderRadius: '2px',
                      border: '1px solid #ccc'
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedCharacters.includes(char)) {
                        e.target.style.backgroundColor = '#f0f0f0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedCharacters.includes(char)) {
                        e.target.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right side - Words Display */}
        <div style={{ 
          width: '75vw',
          padding: '20px',
          backgroundColor: '#fff',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <h2 style={{ margin: '0 0 20px 0', textAlign: 'center' }}>Words List</h2>
          
          {selectedItem === null && (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <p style={{ color: '#666', fontSize: '18px' }}>Select a key to view words</p>
            </div>
          )}

          {selectedWords.length > 0 && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexWrap: 'wrap',
              alignContent: 'flex-start',
              gap: '8px',
              overflow: 'auto',
              padding: '10px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              backgroundColor: '#fafafa'
            }}>
              {selectedWords.map((word, wordIndex) => (
                <span
                  key={wordIndex}
                  onClick={() => {
                    setSubSelectedItem(removeDuplicateAndSortCharacters(word));
                  }}
                  style={{
                    display: passesFilter(word) ? 'inline-block' : 'none',
                    color: decideColor(word),
                    cursor: 'pointer',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#007bff';
                    e.target.style.color = 'white';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = decideColor(word);
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  {word}
                </span>
              ))}
            </div>
          )}

          {selectedItem !== null && selectedWords.length === 0 && (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <p style={{ color: '#666', fontSize: '18px' }}>Loading words...</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row - Child Keys */}
      <div style={{ 
        height: '20vh',
        backgroundColor: '#f8f9fa',
        overflow: 'hidden'
      }}>
        <KeyList 
          keys={childKeys} 
          title="Child Keys" 
          emptyMessage="No child keys available"
        />
      </div>
    </div>
  );
}

export default App;