import React, { useState } from 'react';
import { View, Text, Pressable, Modal, TextInput, ScrollView } from 'react-native';
import { X, Plus, Check, Folder as FolderIcon } from 'lucide-react-native';
import { useShortlist } from '@/core/contexts/ShortlistContext';
import { FOLDER_COLORS } from '@/core/utils/folder-manager';

interface FolderSelectorProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (folderId: string) => void;
}

export function FolderSelector({ visible, onClose, onSelect }: FolderSelectorProps) {
    const { folders, createNewFolder } = useShortlist();
    const [isCreating, setIsCreating] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0].hex);

    const handleCreate = () => {
        if (newFolderName.trim()) {
            const newFolder = createNewFolder(newFolderName.trim(), selectedColor);
            setNewFolderName('');
            setIsCreating(false);
            onSelect(newFolder.id);
            onClose();
        }
    };

    const handleSelectFolder = (folderId: string) => {
        onSelect(folderId);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable
                className="flex-1 bg-black/50 justify-center items-center p-4"
                onPress={onClose}
            >
                <Pressable
                    className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md"
                    onPress={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <View className="flex-row items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                        <Text className="text-xl font-bold text-slate-900 dark:text-white">
                            {isCreating ? 'Create New Folder' : 'Save to Folder'}
                        </Text>
                        <Pressable onPress={onClose} className="p-2">
                            <X size={24} color="#64748b" />
                        </Pressable>
                    </View>

                    {isCreating ? (
                        /* Create New Folder Form */
                        <View className="p-4">
                            <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Folder Name
                            </Text>
                            <TextInput
                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white mb-4"
                                placeholder="e.g., Tech Startup"
                                placeholderTextColor="#94a3b8"
                                value={newFolderName}
                                onChangeText={setNewFolderName}
                                autoFocus
                            />

                            <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Color
                            </Text>
                            <View className="flex-row flex-wrap gap-2 mb-4">
                                {FOLDER_COLORS.map((color) => (
                                    <Pressable
                                        key={color.hex}
                                        onPress={() => setSelectedColor(color.hex)}
                                        className="w-10 h-10 rounded-lg items-center justify-center"
                                        style={{ backgroundColor: color.hex }}
                                    >
                                        {selectedColor === color.hex && (
                                            <Check size={20} color="white" strokeWidth={3} />
                                        )}
                                    </Pressable>
                                ))}
                            </View>

                            <View className="flex-row gap-2">
                                <Pressable
                                    onPress={() => {
                                        setIsCreating(false);
                                        setNewFolderName('');
                                    }}
                                    className="flex-1 bg-slate-100 dark:bg-slate-700 py-3 rounded-lg"
                                >
                                    <Text className="text-center font-bold text-slate-700 dark:text-slate-300">
                                        Cancel
                                    </Text>
                                </Pressable>
                                <Pressable
                                    onPress={handleCreate}
                                    disabled={!newFolderName.trim()}
                                    className={`flex-1 py-3 rounded-lg ${newFolderName.trim()
                                            ? 'bg-purple-600'
                                            : 'bg-slate-200 dark:bg-slate-700'
                                        }`}
                                >
                                    <Text
                                        className={`text-center font-bold ${newFolderName.trim()
                                                ? 'text-white'
                                                : 'text-slate-400'
                                            }`}
                                    >
                                        Create
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    ) : (
                        /* Folder List */
                        <ScrollView className="max-h-96">
                            <View className="p-2">
                                {folders.map((folder) => (
                                    <Pressable
                                        key={folder.id}
                                        onPress={() => handleSelectFolder(folder.id)}
                                        className="flex-row items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                                    >
                                        <View
                                            className="w-10 h-10 rounded-lg items-center justify-center"
                                            style={{ backgroundColor: folder.color }}
                                        >
                                            <FolderIcon size={20} color="white" />
                                        </View>
                                        <Text className="flex-1 text-slate-900 dark:text-white font-medium">
                                            {folder.name}
                                        </Text>
                                    </Pressable>
                                ))}

                                {/* Create New Folder Button */}
                                <Pressable
                                    onPress={() => setIsCreating(true)}
                                    className="flex-row items-center gap-3 p-3 mt-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg"
                                >
                                    <View className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg items-center justify-center">
                                        <Plus size={20} color="#64748b" />
                                    </View>
                                    <Text className="text-slate-600 dark:text-slate-400 font-medium">
                                        Create New Folder
                                    </Text>
                                </Pressable>
                            </View>
                        </ScrollView>
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    );
}
