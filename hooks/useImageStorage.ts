import { useState, useEffect } from 'react';
import { saveImage, getImage } from '../services/storage';

export const useImageStorage = (initialUrl?: string, storageKey?: string) => {
    const [imageUrl, setImageUrl] = useState<string | undefined>(initialUrl);

    useEffect(() => {
        // If we have a storage Key but no URL (pageload), try to load from IDB
        if (storageKey && !imageUrl) {
            const load = async () => {
                const url = await getImage(storageKey);
                if (url) setImageUrl(url);
            };
            load();
        }
    }, [storageKey]);

    const save = async (file: File) => {
        if (!storageKey) return;
        const url = await saveImage(storageKey, file);
        setImageUrl(url);
    };

    return { imageUrl, save };
};
