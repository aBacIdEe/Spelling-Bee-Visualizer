import { useEffect, useState } from "react";
import "./App.css";

import SearchableDropdown from "./components/SearchableDropdown";
// import useStoreData from './hooks/useStoreData';
// import useQueryData from './hooks/useQueryData';

function App() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null); // State to hold selected item
  const [subSelectedItem, setSubSelectedItem] = useState(null); // State to hold selected sub-item
  const [selectedCharacters, setSelectedCharacters] = useState([]);
  const [selectedQueries, setSelectedQueries] = useState([]); // State to hold selected queries
  const [selectedWords, setSelectedWords] = useState([]); // State to hold selected word

  // const url = '/Spelling-Bee-Visualizer/words.json'; // Change to your JSON file path
  // // Hook to store data in IndexedDB
  // useStoreData(url);

  // Hook to query data

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

  const handleItemSelect = async (item) => {
    setSelectedItem(item);
    setSubSelectedItem(item);
    setSelectedCharacters([]); // Clear the selected characters

    // Make the fetch call asynchronously, using the updated 'item' directly
    try {
      const res = await fetch(
        `chunkedTrees/${item.slice(0, 4)}.json`
      );

      if (!res.ok) {
        console.error("Failed to fetch data:", res.statusText);
        return;
      }

      const data = await res.json(); // Parse the JSON response
      setSelectedQueries(data[item]);

      setSelectedWords([]); // Clear the selected words

      // Collect words in an array
      const wordsArray = [];

      for (let i = 0; i < data[item].length; i++) {
        const res2 = await fetch(
          `chunkedWords/${data[item][i].slice(0, 4)}.json`
        );

        if (!res2.ok) {
          console.error("Failed to fetch data:", res2.statusText);
          return;
        }

        const words = await res2.json();
        wordsArray.push(...words[data[item][i]]);
      }

      // Sort words alphabetically (case-insensitive)
      wordsArray.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

      setSelectedWords(wordsArray); // Update the state with sorted words
      // console.log(wordsArray); // Log the selected words
    } catch (error) {
      console.error("Error during fetch:", error);
    }
  };

  // Helper function to check if word contains all characters in selectedItem
  const containsAllChars = (word, selectedItem) => {
    // Create a map of character counts for selectedItem
    const charCount = {};
    for (let char of selectedItem) {
      charCount[char] = (charCount[char] || 0) + 1;
    }

    // Check if word contains all the characters with the required counts
    for (let char of selectedItem) {
      if (!word.includes(char)) {
        return false; // If any character is missing, return false
      }
    }
    return true;
  };

  // Helper function to make a word into its character format
  const removeDuplicateAndSortCharacters = (word) => {
    return [...new Set(word)].sort().join("");
  };

  // Function to handle the toggle of selected characters
  const handleCharacterToggle = (character) => {
    setSelectedCharacters(
      (prevState) =>
        prevState.includes(character)
          ? prevState.filter((char) => char !== character) // Remove character if already selected
          : [...prevState, character] // Add character if not selected
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

  return (
    <div className="page-outer-container">
      <div className="page-container">
        <div className="left-side">
          <h1>Search & Dropdown</h1>
          <p>Selected Item: {selectedItem}</p>
          {items.length > 0 ? (
            <SearchableDropdown
              items={items}
              onItemSelect={handleItemSelect}
              style={App.SearchableDropdown}
            />
          ) : (
            <p>Loading items...</p>
          )}
        </div>
        <div className="right-side">
          <h1>Words List</h1>
          {selectedItem && (
            <>
              <p>Filter by Character:</p>
              <div
                className="segmented-control"
                style={{ width: `${selectedItem.length * 50}px` }} // Dynamic width calculation based on button count
              >
                {selectedItem.split("").map((char, index) => (
                  <button
                    key={index}
                    className={`segmented-button ${
                      selectedCharacters.includes(char) ? "selected" : ""
                    }`}
                    onClick={() => handleCharacterToggle(char)}
                  >
                    <p className="character-button-text">{char}</p>
                  </button>
                ))}
              </div>
            </>
          )}
          {selectedItem == null && <p>Select an item to view words</p>}
          {/* {selectedQueries.length > 0 && (
            <p>Sub-words: {selectedQueries.join(" ")}</p>
          )} */}
          {selectedWords.length > 0 && (
            <p
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)', // 5 columns
              gap: '10px',
            }}
          >
            {Array.from({ length: 5 }).map((_, colIndex) => {
              // Calculate base number of words per column
              const baseCount = Math.floor(selectedWords.length / 5);
              
              // Calculate the number of columns that should have one extra word
              const extraCount = selectedWords.length % 5;
              
              // Determine the start and end index for the current column
              const startIdx = colIndex * baseCount + Math.min(colIndex, extraCount);
              const endIdx = startIdx + baseCount + (colIndex < extraCount ? 1 : 0);
              
              // Slice the selectedWords array to get the words for the current column
              const columnWords = selectedWords.slice(startIdx, endIdx);
              
              return (
                <div key={colIndex} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {columnWords.map((word, wordIndex) => (
                    <span
                      key={wordIndex}
                      onClick={() => {
                        // Call setSubSelectedItem on click
                        setSubSelectedItem(removeDuplicateAndSortCharacters(word));
                      }}
                      style={{
                        color: decideColor(word),
                        cursor: 'pointer', // Make the word look clickable
                      }}
                    >
                      {passesFilter(word) ? word : "---"}
                    </span>
                  ))}
                </div>
              );
            })}
          </p>
          
          )}
          {selectedItem != null && selectedWords.length === 0 && (
            <p>Loading words...</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
