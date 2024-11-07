import React, { useEffect, useState } from "react";
import "./App.css";

import SearchableDropdown from "./components/SearchableDropdown";
// import useStoreData from './hooks/useStoreData';
// import useQueryData from './hooks/useQueryData';

function App() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null); // State to hold selected item
  const [selectedQueries, setSelectedQueries] = useState([]); // State to hold selected queries
  const [selectedWords, setSelectedWords] = useState([]); // State to hold selected word

  // const url = '/projects/words.json'; // Change to your JSON file path
  // // Hook to store data in IndexedDB
  // useStoreData(url);

  // Hook to query data

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("/projects/validCombos.txt");
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

    // Make the fetch call asynchronously, using the updated 'item' directly
    try {
      const res = await fetch(
        `/projects/chunkedTrees/${item.slice(0, 4)}.json`
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
          `/projects/chunkedWords/${data[item][i].slice(0, 4)}.json`
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

  return (
    <>
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
          {selectedItem && <p>Selected Word: {selectedItem}</p>}
          {selectedItem == null && <p>Select an item to view words</p>}
          {/* {selectedQueries.length > 0 && (
            <p>Sub-words: {selectedQueries.join(" ")}</p>
          )} */}
          {selectedWords.length > 0 && (
            <p>
              Words:{" "}
              {selectedWords.map((word, index) => (
                <span
                  key={index}
                  onClick={() => { // Call setSelectedItem on click
                    setSelectedItem(removeDuplicateAndSortCharacters(word))
                  }} 
                  style={{
                    color: containsAllChars(word, selectedItem)
                      ? "red"
                      : "inherit",
                    cursor: "pointer", // Make the word look clickable
                    padding: "0 5px", // Add some space between the words
                    borderRadius: "4px", // Optional: for a rounded appearance
                  }}
                >
                  {word}
                  {index < selectedWords.length - 1 && " "}
                </span>
              ))}
            </p>
          )}
          {selectedItem != null && selectedWords.length === 0 && <p>Loading words...</p>}
        </div>
      </div>
    </>
  );
}

export default App;
