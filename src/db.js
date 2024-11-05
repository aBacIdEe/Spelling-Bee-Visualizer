import Dexie from 'dexie';

const db = new Dexie('wordList');

db.version(1).stores({
    jsonData: '++id, word, words', // Define your schema
});

export default db;