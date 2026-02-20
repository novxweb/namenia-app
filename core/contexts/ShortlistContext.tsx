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
        if (!userId || dbLoaded) return;

        fetchShortlistFromDB(userId).then(dbItems => {
            setDbLoaded(true);
            if (dbItems && dbItems.length > 0) {
                setShortlist(prev => {
                    // Merge: DB items + local items not already in DB
                    const dbNames = new Set(dbItems.map(i => i.name));
                    const uniqueLocal = prev.filter(i => !dbNames.has(i.name));
                    const merged = [...dbItems, ...uniqueLocal];
                    // Save merged list
                    AsyncStorage.setItem('klovana_shortlist', JSON.stringify(merged));
                    saveShortlistToDB(userId, merged);
                    return merged;
                });
            } else if (shortlist.length > 0) {
                // No DB data but local data exists — push local to DB
                saveShortlistToDB(userId, shortlist);
            }
        });
    }, [userId]);

    const saveShortlist = async (items: GeneratedName[]) => {
        setShortlist(items);
        await AsyncStorage.setItem('klovana_shortlist', JSON.stringify(items));

        // Sync to Supabase if logged in
        if (userId) {
            saveShortlistToDB(userId, items);
        }
    };

    const saveFolders = async (folderList: Folder[]) => {
        setFolders(folderList);
        await AsyncStorage.setItem('klovana_folders', JSON.stringify(folderList));
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
