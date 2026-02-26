import { openDB } from 'idb';

const DB_NAME = 'ribeirxlog-offline-db';
const STORE_NAME = 'driver-events-queue';

export const getOfflineDb = async () => {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        },
    });
};

export const saveOfflineEvent = async (type: string, data: any) => {
    const db = await getOfflineDb();
    return db.add(STORE_NAME, {
        type,
        data,
        timestamp: Date.now(),
        synced: false
    });
};

export const getPendingEvents = async () => {
    const db = await getOfflineDb();
    return db.getAll(STORE_NAME);
};

export const deleteEvent = async (id: number) => {
    const db = await getOfflineDb();
    return db.delete(STORE_NAME, id);
};

export const syncPendingEvents = async (supabaseActionCallback: (event: any) => Promise<boolean>) => {
    if (!navigator.onLine) return; // Se continuar sem net, ele morre aqui caladinho

    const events = await getPendingEvents();
    for (const event of events) {
        if (!event.synced) {
            try {
                // Tenta engatar com a função real lá do Supabase
                const success = await supabaseActionCallback(event);
                // Se o Supabase retorou sucesso, apagamos o registro do celular
                if (success) await deleteEvent(event.id);
            } catch (err) {
                console.error('Falha ao sincronizar evento offline:', event.type);
            }
        }
    }
};
