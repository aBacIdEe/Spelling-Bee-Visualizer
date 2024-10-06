import Dexie from 'dexie';

const db = new Dexie('myDatabase');

db.version(1).stores({
    jsonData: 'id,fieldName', // Define your schema
});

export default db;