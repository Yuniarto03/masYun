import React, { useContext } from 'react';
import { DataContext } from '../../contexts/DataContext';
import { Panel } from '../Panel';
import { ViewKey, IconType } from '../../types';

// Icons
const FolderOpenIcon: IconType = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m-1.5 0h-1.5a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25v-13.5a2.25 2.25 0 00-2.25-2.25H15M12 12.75h.008v.008H12v-.008z" />
    </svg>
);
const FileIcon: IconType = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);
const TrashIcon: IconType = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);


interface FileLibraryViewProps {
    onNavigate: (viewKey: ViewKey) => void;
}

export const FileLibraryView: React.FC<FileLibraryViewProps> = ({ onNavigate }) => {
    const { 
        savedProjects, loadProject, deleteProject, saveCurrentProject,
        savedFiles, loadRawFile, deleteRawFile 
    } = useContext(DataContext);

    const handleLoadProject = (id: string) => {
        if (window.confirm("Loading a project will overwrite your current workspace. Are you sure?")) {
            if (loadProject(id)) {
                onNavigate('dashboard');
            }
        }
    };

    const handleDeleteProject = (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to permanently delete project "${name}"? This action cannot be undone.`)) {
            deleteProject(id);
        }
    };

    const handleLoadFile = (id: string) => {
        if (window.confirm("Loading this file will overwrite your current data table. Are you sure?")) {
            loadRawFile(id);
            onNavigate('dataTable');
        }
    };

    const handleDeleteFile = (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete the file "${name}" from the library?`)) {
            deleteRawFile(id);
        }
    };
    
    const handleSaveCurrent = () => {
        const projectName = prompt("Enter a name for your current project:");
        if (projectName && projectName.trim() !== '') {
            saveCurrentProject(projectName.trim());
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-100">File Library</h1>
                <button 
                    onClick={handleSaveCurrent}
                    className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                    Save Current Project
                </button>
            </div>
            <Panel>
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-200 mb-3 border-b border-gray-600 pb-2">Saved Projects</h2>
                    {savedProjects.length === 0 ? (
                        <div className="text-center py-10">
                            <FolderOpenIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-300">No Projects Saved</h3>
                            <p className="text-gray-400 mt-2">
                                Use "File" {'>'} "Save" or the button above to save your workspace.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {savedProjects.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()).map(project => (
                                <div key={project.id} className="bg-gray-700/50 p-4 rounded-lg flex justify-between items-center hover:bg-gray-700 transition-colors">
                                    <div className="flex items-center gap-4">
                                         <FolderOpenIcon className="w-8 h-8 text-orange-400 flex-shrink-0"/>
                                         <div>
                                            <p className="font-semibold text-orange-300">{project.name}</p>
                                            <p className="text-xs text-gray-400">
                                                Saved on: {new Date(project.savedAt).toLocaleString()}
                                            </p>
                                         </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleLoadProject(project.id)}
                                            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md"
                                        >
                                            Load Project
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteProject(project.id, project.name)}
                                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-full"
                                            title="Delete Project"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-200 mb-3 border-b border-gray-600 pb-2">Saved Data Files</h2>
                    {savedFiles.length === 0 ? (
                        <div className="text-center py-10">
                             <FileIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                             <h3 className="text-lg font-semibold text-gray-300">No Data Files Saved</h3>
                            <p className="text-gray-400 mt-2">You can save uploaded files from the Data Upload view.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {savedFiles.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()).map(file => (
                                <div key={file.id} className="bg-gray-700/50 p-4 rounded-lg flex justify-between items-center hover:bg-gray-700 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <FileIcon className="w-8 h-8 text-green-400 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-green-300">{file.name}</p>
                                            <p className="text-xs text-gray-400">
                                                Type: {file.type} | Saved: {new Date(file.savedAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleLoadFile(file.id)}
                                            className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-500 rounded-md"
                                        >
                                            Load Data
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteFile(file.id, file.name)}
                                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-full"
                                            title="Delete File"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Panel>
        </div>
    );
};