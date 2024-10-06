import { useState, useEffect } from 'react';
import db from '../db';

const useQueryData = (fieldName, value) => {
    const [results, setResults] = useState([]);

    useEffect(() => {
        const queryData = async () => {
            try {
                const data = await db.jsonData.where(fieldName).equals(value).toArray();
                setResults(data);
            } catch (error) {
                console.error('Error querying data:', error);
            }
        };

        queryData();
    }, [fieldName, value]);

    return results;
};

export default useQueryData;