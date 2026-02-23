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

    // Load from AsyncStorage on mount
    useEffect(() => {
        AsyncStorage.getItem('klovana_shortlist').then(json => {
            if (json) {
                try {
                    setShortlist(JSON.parse(json));
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
        fetchShortlistFromDB(userId).then(dbData => {
            const dbItems = dbData.names || [];
            const dbFolders = dbData.folders || [];

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

                    // Add any local items that aren't in the DB yet
                    const uniqueLocal = prev.filter(i => !dbNames.has(i.name));
                    merged.push(...uniqueLocal);

                    // Optimistically update DB with newly merged lists
                    // (we assume folders might have also needed merging)
                    saveShortlistToDB(userId, merged, folders);

                    // Overwrite local storage so it stays in sync
                    AsyncStorage.setItem('klovana_shortlist', JSON.stringify(merged));
                    return merged;
                });
            } else if (shortlist.length > 0 || folders.length > 1) {
                // No DB data but local data exists — push local up to DB
                saveShortlistToDB(userId, shortlist, folders);
            }
        });
    }, [userId]); // Removed dbLoaded so it runs dependably on login state change

    const saveShortlist = async (items: GeneratedName[]) => {
        setShortlist(items);
        await AsyncStorage.setItem('klovana_shortlist', JSON.stringify(items));

        // Sync to Supabase if logged in
        if (userId) {
            saveShortlistToDB(userId, items, folders);
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
        return shortlist.filter(item => (item.folderId || 'uncategorized') === folderId);
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
