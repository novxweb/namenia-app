import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeneratedName } from '@/core/services/generator';
import { Folder, DEFAULT_FOLDERS, createFolder, updateFolder, canDeleteFolder } from '@/core/utils/folder-manager';
import { useAuth } from '@/core/hooks/useAuth';
import { fetchShortlistFromDB, saveShortlistToDB } from '@/core/services/supabase-shortlist';
import { markNameShortlisted } from '@/core/services/generation-log';

interface ShortlistContextType {
    shortlist: GeneratedName[];
    folders: Folder[];
    selectedFolderId: string;
    addToShortlist: (item: GeneratedName, folderId?: string) => void;
    removeFromShortlist: (name: string) => void;
    isInShortlist: (name: string) => boolean;
    moveToFolder: (name: string, folderId: string) => void;
    getNamesByFolder: (folderId: string) => GeneratedName[];
    createNewFolder: (name: string, color: string) => Folder;
    updateFolderDetails: (folderId: string, name: string, color: string) => void;
    deleteFolder: (folderId: string) => void;
    setSelectedFolderId: (folderId: string) => void;
    updateShortlistItem: (item: GeneratedName) => void;
}

const ShortlistContext = createContext<ShortlistContextType | undefined>(undefined);

export function ShortlistProvider({ children }: { children: ReactNode }) {
    const [shortlist, setShortlist] = useState<GeneratedName[]>([]);
    const [folders, setFolders] = useState<Folder[]>(DEFAULT_FOLDERS);
    const [selectedFolderId, setSelectedFolderId] = useState<string>('uncategorized');
    const [dbLoaded, setDbLoaded] = useState(false);

    let user: any = null;
    try {
        const auth = useAuth();
        user = auth.user;
    } catch {
        // AuthProvider not available — proceed without DB sync
    }

    const userId = user?.id;

    // Helper to ensure lists are valid and deeply deduplicated
    const cleanShortlist = (arr: any[]): GeneratedName[] => {
        if (!Array.isArray(arr)) return [];
        const valid = arr.filter(i => i && typeof i.name === 'string' && i.name.trim().length > 0);
        const seen = new Set();
        const result: GeneratedName[] = [];
        for (const item of valid) {
            const normalized = item.name.trim().toLowerCase();
            if (!seen.has(normalized)) {
                seen.add(normalized);
                result.push({ ...item, name: item.name.trim() });
            }
        }
        return result;
    };

    // Load from AsyncStorage on mount
    useEffect(() => {
        AsyncStorage.getItem('klovana_shortlist').then(json => {
            if (json) {
                try {
                    const parsed = JSON.parse(json);
                    const cleaned = cleanShortlist(parsed);
                    setShortlist(cleaned);
                    // Just in case we cleaned up corruption, resave locally immediately:
                    if (cleaned.length !== parsed.length) {
                        AsyncStorage.setItem('klovana_shortlist', JSON.stringify(cleaned));
                    }
                } catch (e) {
                    console.error('Failed to parse shortlist', e);
                }
            }
        });

        AsyncStorage.getItem('klovana_folders').then(json => {
            if (json) {
                try {
                    setFolders(JSON.parse(json));
                } catch (e) {
                    console.error('Failed to parse folders', e);
                }
            } else {
                saveFolders(DEFAULT_FOLDERS);
            }
        });
    }, []);

    // When user logs in, merge DB shortlist with local
    useEffect(() => {
        if (!userId) return;

        // Fetch DB data immediately upon having a valid user
        Promise.all([
            fetchShortlistFromDB(userId),
            AsyncStorage.getItem('klovana_synced_names')
        ]).then(([dbData, syncedStr]) => {
            const dbItems = dbData.names || [];
            const dbFolders = dbData.folders || [];

            let syncedNames = new Set<string>();
            try {
                if (syncedStr) syncedNames = new Set(JSON.parse(syncedStr));
            } catch (e) { }

            // Merge Folders
            if (dbFolders.length > 0) {
                setFolders(prev => {
                    const mergedFolders = [...dbFolders];
                    const dbFolderIds = new Set(dbFolders.map(f => f.id));
                    const uniqueLocalFolders = prev.filter(f => !dbFolderIds.has(f.id));
                    mergedFolders.push(...uniqueLocalFolders);
                    AsyncStorage.setItem('klovana_folders', JSON.stringify(mergedFolders));
                    return mergedFolders;
                });
            }

            // Merge Names
            if (dbItems.length > 0) {
                setShortlist(prev => {
                    // Start merged array with DB items
                    const merged = [...dbItems];
                    const dbNames = new Set(dbItems.map(i => i.name));

                    // Add local items that aren't in the DB properly...
                    // Check if they were already synced. If they were synced previously but are NOT in the DB now,
                    // it means they were deleted remotely on another device. We should drop them.
                    let uniqueLocal = prev.filter(i => !dbNames.has(i.name) && !syncedNames.has(i.name));

                    // CACHE MIGRATION FIX: If the user has items in the DB, but their local device
                    // has absolutely no sync tracking yet (`syncedStr` is null), their local cache is "legacy".
                    // We must NOT upload legacy local items back to the DB, otherwise we will resurrect
                    // items they previously deleted on another device!
                    if (dbItems.length > 0 && !syncedStr) {
                        uniqueLocal = [];
                    }

                    merged.push(...uniqueLocal);

                    // Clean the merged list to eliminate duplicates or empty entries
                    const cleanedMerged = cleanShortlist(merged);

                    // Optimistically update DB with newly merged lists
                    saveShortlistToDB(userId, cleanedMerged, folders);

                    // Overwrite local storage so it stays in sync
                    AsyncStorage.setItem('klovana_shortlist', JSON.stringify(cleanedMerged));
                    AsyncStorage.setItem('klovana_synced_names', JSON.stringify(cleanedMerged.map(i => i.name)));
                    return cleanedMerged;
                });
            } else if (shortlist.length > 0 || folders.length > 1) {
                // No DB data but local data exists — push local up to DB
                saveShortlistToDB(userId, shortlist, folders);
                AsyncStorage.setItem('klovana_synced_names', JSON.stringify(shortlist.map(i => i.name)));
            }
        });
    }, [userId]);

    const saveShortlist = async (items: GeneratedName[]) => {
        setShortlist(items);
        await AsyncStorage.setItem('klovana_shortlist', JSON.stringify(items));

        // Sync to Supabase if logged in
        if (userId) {
            saveShortlistToDB(userId, items, folders);
            AsyncStorage.setItem('klovana_synced_names', JSON.stringify(items.map(i => i.name)));
        }
    };

    const saveFolders = async (folderList: Folder[]) => {
        setFolders(folderList);
        await AsyncStorage.setItem('klovana_folders', JSON.stringify(folderList));

        if (userId) {
            saveShortlistToDB(userId, shortlist, folderList);
        }
    };

    const addToShortlist = (item: GeneratedName, folderId?: string) => {
        if (!isInShortlist(item.name)) {
            const itemWithFolder = {
                ...item,
                folderId: folderId || selectedFolderId || 'uncategorized'
            };
            saveShortlist([...shortlist, itemWithFolder]);
            markNameShortlisted(item.name); // Track quality signal
        }
    };

    const removeFromShortlist = (name: string) => {
        saveShortlist(shortlist.filter(i => i.name !== name));
    };

    const isInShortlist = (name: string) => {
        return shortlist.some(i => i.name === name);
    };

    const moveToFolder = (name: string, folderId: string) => {
        const updated = shortlist.map(item =>
            item.name === name ? { ...item, folderId } : item
        );
        saveShortlist(updated);
    };

    const getNamesByFolder = (folderId: string) => {
        const validFolderIds = new Set(folders.map(f => f.id));
        return shortlist.filter(item => {
            let itemFolderId = item.folderId || 'uncategorized';
            if (!validFolderIds.has(itemFolderId)) {
                itemFolderId = 'uncategorized';
            }
            return itemFolderId === folderId;
        });
    };

    const updateShortlistItem = (item: GeneratedName) => {
        saveShortlist(shortlist.map(i => i.name === item.name ? item : i));
    };

    const createNewFolder = (name: string, color: string) => {
        const newFolder = createFolder(name, color);
        saveFolders([...folders, newFolder]);
        return newFolder;
    };

    const updateFolderDetails = (folderId: string, name: string, color: string) => {
        const updated = folders.map(folder =>
            folder.id === folderId ? updateFolder(folder, { name, color }) : folder
        );
        saveFolders(updated);
    };

    const deleteFolder = (folderId: string) => {
        const folder = folders.find(f => f.id === folderId);
        if (!folder || !canDeleteFolder(folder)) {
            console.warn('Cannot delete default folder');
            return;
        }

        const updated = shortlist.map(item =>
            item.folderId === folderId ? { ...item, folderId: 'uncategorized' } : item
        );
        saveShortlist(updated);
        saveFolders(folders.filter(f => f.id !== folderId));

        if (selectedFolderId === folderId) {
            setSelectedFolderId('uncategorized');
        }
    };

    return (
        <ShortlistContext.Provider value={{
            shortlist,
            folders,
            selectedFolderId,
            addToShortlist,
            removeFromShortlist,
            isInShortlist,
            moveToFolder,
            getNamesByFolder,
            createNewFolder,
            updateFolderDetails,
            deleteFolder,
            setSelectedFolderId,
            updateShortlistItem
        }}>
            {children}
        </ShortlistContext.Provider>
    );
}

export function useShortlist() {
    const context = useContext(ShortlistContext);
    if (context === undefined) {
        throw new Error('useShortlist must be used within a ShortlistProvider');
    }
    return context;
}
