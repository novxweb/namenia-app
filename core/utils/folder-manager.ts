export interface Folder {
    id: string;
    name: string;
    color: string;
    createdAt: number;
    isDefault?: boolean;
}

export const DEFAULT_FOLDERS: Folder[] = [
    {
        id: 'uncategorized',
        name: 'Uncategorized',
        color: '#64748b', // slate-500
        createdAt: Date.now(),
        isDefault: true
    }
];

export const FOLDER_COLORS = [
    { name: 'Purple', hex: '#9333ea' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Green', hex: '#10b981' },
    { name: 'Yellow', hex: '#f59e0b' },
    { name: 'Red', hex: '#ef4444' },
    { name: 'Pink', hex: '#ec4899' },
    { name: 'Indigo', hex: '#6366f1' },
    { name: 'Teal', hex: '#14b8a6' },
    { name: 'Orange', hex: '#f97316' },
    { name: 'Slate', hex: '#64748b' },
];

export function createFolder(name: string, color: string = FOLDER_COLORS[0].hex): Folder {
    return {
        id: `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        color,
        createdAt: Date.now()
    };
}

export function updateFolder(folder: Folder, updates: Partial<Pick<Folder, 'name' | 'color'>>): Folder {
    return {
        ...folder,
        ...updates
    };
}

export function canDeleteFolder(folder: Folder): boolean {
    return !folder.isDefault;
}
