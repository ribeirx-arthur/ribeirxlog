import { openDB } from 'idb';

const DB_NAME = 'RibeirxLogDB';
const STORE_NAME = 'images';

const dbPromise = openDB(DB_NAME, 1, {
    upgrade(db) {
        db.createObjectStore(STORE_NAME);
    },
});

export const saveImage = async (key: string, file: File): Promise<string> => {
    const db = await dbPromise;

    // Convert File to Base64 to ensure portability if needed, 
    // but IDB can store Blobs directly. Storing Blob is more efficient.
    await db.put(STORE_NAME, file, key);

    // Return a URL that the app can use *temporarily* for this session
    // AND logic to reload it later.
    // Actually, for React to render, we need to read it back as ObjectURL
    return URL.createObjectURL(file);
};

export const getImage = async (key: string): Promise<string | null> => {
    const db = await dbPromise;
    const blob = await db.get(STORE_NAME, key);

    if (!blob) return null;
    return URL.createObjectURL(blob);
};

export const deleteImage = async (key: string) => {
    const db = await dbPromise;
    await db.delete(STORE_NAME, key);
};

export const getAllImageKeys = async () => {
    const db = await dbPromise;
    return db.getAllKeys(STORE_NAME);
};

// Helper to load all images into a cache map on startup if needed
// or just load on demand.
