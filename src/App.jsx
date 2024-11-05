import React, { useEffect, useState } from "react";
import "./App.css";

import SearchableDropdown from "./components/SearchableDropdown";
// import useStoreData from './hooks/useStoreData';
// import useQueryData from './hooks/useQueryData';

function App() {
  const [items, setItems] = useState([]);
  const [data, setData] = useState([]); // State to hold the JSON data
  const [selectedItem, setSelectedItem] = useState(null); // State to hold selected item
  const [selectedQueries, setSelectedQueries] = useState([]); // State to hold selected queries

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
        // Handle error response
        console.error("Failed to fetch data:", res.statusText);
        return;
      }

      const data = await res.json(); // Parse the JSON response
      setSelectedQueries(data[item]); // Set the queries based on the 'item' key
      // console.log(data); // Log the full data for debugging
      // console.log(data[item]); // Log the specific query set for the selected item
    } catch (error) {
      console.error("Error during fetch:", error);
    }
    // const results = useQueryData(selectedItem); // Replace with actual field and value
  };

  return (
    <>
      <div>
        <h1>Search & Dropdown</h1>
        <p>Selected Item: {selectedItem}</p>
        {items.length > 0 ? (
          <SearchableDropdown items={items} onItemSelect={handleItemSelect} />
        ) : (
          <p>Loading items...</p>
        )}
      </div>
      <div>
        <h1>Words List</h1>
        {selectedItem && <p>Selected Word: {selectedItem}</p>}
        {selectedQueries.length > 0 && <p>Sub-words: {selectedQueries.join(" ")}</p>}
        {/* {Object.keys(data).length > 0 ? (
        <div>
          {Object.keys(data).map(category => (
            <div key={category}>
              <h2>{category}</h2>
              <SearchableDropdown 
                items={data[category]} 
                onItemSelect={handleItemSelect} 
              />
            </div>
          ))}
        </div>
      ) : (
        <p>Loading data...</p>
      )} */}
      </div>
    </>
  );
}

export default App;
