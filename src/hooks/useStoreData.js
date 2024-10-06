import { useEffect } from "react";
import db from "../db";

const useStoreData = (url) => {
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        const data = await response.json();

        await db.jsonData.bulkPut(data); // Store all data at once
        console.log("Data stored successfully");
      } catch (error) {
        console.error("Error fetching or storing data:", error);
      }
    };

    fetchData();
  }, [url]);
};

export default useStoreData;
