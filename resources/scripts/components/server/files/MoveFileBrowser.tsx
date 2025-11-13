import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faChevronRight, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { ServerContext } from '@/state/server';
import { FileObject } from '@/api/server/files/loadDirectory';
import loadDirectory from '@/api/server/files/loadDirectory';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import Spinner from '@/components/elements/Spinner';

const BrowserContainer = styled.div`
    ${tw`border rounded-lg overflow-hidden`};
    border-color: rgba(211, 47, 66, 0.2);
    background: rgba(33, 33, 33, 0.5);
    max-height: 20rem;
    display: flex;
    flex-direction: column;
`;

const BrowserHeader = styled.div`
    ${tw`flex items-center gap-2 px-3 py-2 border-b`};
    border-color: rgba(211, 47, 66, 0.2);
    background: rgba(24, 24, 24, 0.8);
`;

const BreadcrumbButton = styled.button.attrs({ type: 'button' })`
    ${tw`flex items-center gap-1 px-2 py-1 text-sm text-neutral-400 hover:text-white transition-colors rounded`};
    background: transparent;
    border: none;
    cursor: pointer;

    &:hover {
        background: rgba(211, 47, 66, 0.1);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const BrowserContent = styled.div`
    ${tw`flex-1 overflow-y-auto`};
    min-height: 0;
`;

const FolderItem = styled.button.attrs({ type: 'button' })`
    ${tw`w-full flex items-center gap-3 px-4 py-2 text-left text-neutral-300 hover:text-white transition-all`};
    background: transparent;
    border: none;
    cursor: pointer;
    border-bottom: 1px solid rgba(211, 47, 66, 0.1);

    &:hover {
        background: rgba(211, 47, 66, 0.08);
    }

    svg {
        ${tw`flex-shrink-0 text-neutral-400`};
        width: 1rem;
    }
`;

const EmptyState = styled.div`
    ${tw`text-center py-8 text-neutral-400 text-sm`};
`;

interface MoveFileBrowserProps {
    currentPath: string;
    onPathNavigate: (path: string) => void;
}

const MoveFileBrowser: React.FC<MoveFileBrowserProps> = ({ currentPath, onPathNavigate }) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [files, setFiles] = useState<FileObject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [browserPath, setBrowserPath] = useState(currentPath);
    const [pathHistory, setPathHistory] = useState<string[]>(['/']);
    const [historyIndex, setHistoryIndex] = useState(0);

    useEffect(() => {
        setBrowserPath(currentPath);
    }, [currentPath]);

    const loadCurrentDirectory = async (path: string) => {
        setLoading(true);
        setError(null);
        try {
            const directoryFiles = await loadDirectory(uuid, path);
            // Only show directories
            const directories = directoryFiles.filter((f) => !f.isFile);
            setFiles(directories.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (err: any) {
            setError(err.message || 'Failed to load directory');
            setFiles([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCurrentDirectory(browserPath);
    }, [browserPath, uuid]);

    const navigateToPath = (path: string, addToHistory = true) => {
        if (addToHistory) {
            const newHistory = pathHistory.slice(0, historyIndex + 1);
            newHistory.push(path);
            setPathHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
        setBrowserPath(path);
        onPathNavigate(path);
    };

    const navigateToFolder = (folderName: string) => {
        const newPath = browserPath === '/' ? `/${folderName}` : `${browserPath}/${folderName}`;
        navigateToPath(newPath);
    };

    const navigateBack = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            navigateToPath(pathHistory[newIndex], false);
        }
    };

    const navigateForward = () => {
        if (historyIndex < pathHistory.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            navigateToPath(pathHistory[newIndex], false);
        }
    };

    const breadcrumbs = browserPath.split('/').filter((p) => p);

    return (
        <BrowserContainer>
            <BrowserHeader>
                <BreadcrumbButton onClick={navigateBack} disabled={historyIndex === 0} title={'Go back'}>
                    <FontAwesomeIcon icon={faChevronLeft} />
                </BreadcrumbButton>
                <BreadcrumbButton
                    onClick={navigateForward}
                    disabled={historyIndex >= pathHistory.length - 1}
                    title={'Go forward'}
                >
                    <FontAwesomeIcon icon={faChevronRight} />
                </BreadcrumbButton>
                <div css={tw`flex-1 flex items-center gap-1 text-sm text-neutral-400 px-2 overflow-x-auto`}>
                    <BreadcrumbButton onClick={() => navigateToPath('/')} css={tw`text-neutral-300`}>
                        home/container
                    </BreadcrumbButton>
                    {breadcrumbs.map((crumb, index) => {
                        const crumbPath = '/' + breadcrumbs.slice(0, index + 1).join('/');
                        return (
                            <React.Fragment key={index}>
                                <span css={tw`text-neutral-500`}>/</span>
                                <BreadcrumbButton onClick={() => navigateToPath(crumbPath)} css={tw`text-neutral-300`}>
                                    {crumb}
                                </BreadcrumbButton>
                            </React.Fragment>
                        );
                    })}
                </div>
            </BrowserHeader>
            <BrowserContent>
                {loading ? (
                    <div css={tw`flex items-center justify-center py-8`}>
                        <Spinner size={'small'} />
                    </div>
                ) : error ? (
                    <EmptyState>{error}</EmptyState>
                ) : files.length === 0 ? (
                    <EmptyState>No folders in this directory</EmptyState>
                ) : (
                    files.map((file) => (
                        <FolderItem key={file.key} onClick={() => navigateToFolder(file.name)}>
                            <FontAwesomeIcon icon={faFolder} />
                            <span css={tw`flex-1 truncate`}>{file.name}</span>
                        </FolderItem>
                    ))
                )}
            </BrowserContent>
        </BrowserContainer>
    );
};

export default MoveFileBrowser;
