import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFolder,
    faFile,
    faChevronRight,
    faChevronLeft,
    faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
import { ServerContext } from '@/state/server';
import loadDirectory from '@/api/server/files/loadDirectory';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import Spinner from '@/components/elements/Spinner';
import { ServerFile } from '@/api/server/gtnh/getServerFiles';

const BrowserContainer = styled.div`
    ${tw`border rounded-lg overflow-hidden`};
    border-color: rgba(211, 47, 66, 0.2);
    background: rgba(33, 33, 33, 0.5);
    max-height: 28rem;
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

const FileItemContainer = styled.div<{ $selected: boolean; $disabled?: boolean; $indent: number }>`
    ${tw`w-full flex items-center gap-3 px-4 py-2 text-left text-neutral-300 transition-all`};
    background: transparent;
    border-bottom: 1px solid rgba(211, 47, 66, 0.1);
    padding-left: ${(props) => `${1 + props.$indent * 1.5}rem`};
    opacity: ${(props) => (props.$disabled ? 0.5 : 1)};
    cursor: ${(props) => (props.$disabled ? 'not-allowed' : 'pointer')};

    &:hover {
        background: ${(props) => (props.$disabled ? 'transparent' : 'rgba(211, 47, 66, 0.08)')};
        color: ${(props) => (props.$disabled ? 'rgba(255, 255, 255, 0.5)' : 'white')};
    }

    svg {
        ${tw`flex-shrink-0 text-neutral-400`};
        width: 1rem;
    }
`;

const Checkbox = styled.div<{ $checked: boolean; $indeterminate?: boolean }>`
    ${tw`w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0`};
    border-color: ${(props) => (props.$checked || props.$indeterminate ? 'rgba(211, 47, 66, 1)' : 'rgba(128, 128, 128, 0.5)')};
    background: ${(props) =>
        props.$checked || props.$indeterminate ? 'rgba(211, 47, 66, 0.3)' : 'transparent'};
    transition: all 150ms ease;

    &::after {
        content: ${(props) => (props.$indeterminate ? '""' : props.$checked ? '"✓"' : '""')};
        ${tw`text-xs text-white`};
        ${(props) =>
            props.$indeterminate &&
            `
            width: 8px;
            height: 2px;
            background: white;
        `}
    }
`;

const EmptyState = styled.div`
    ${tw`text-center py-8 text-neutral-400 text-sm`};
`;

const ExpandButton = styled.button.attrs({ type: 'button' })`
    ${tw`p-1 flex items-center justify-center`};
    background: transparent;
    border: none;
    cursor: pointer;
    width: 1.5rem;
    height: 1.5rem;
    transition: transform 0.2s ease;

    &:hover {
        background: rgba(211, 47, 66, 0.1);
        border-radius: 0.25rem;
    }

    svg {
        transition: transform 0.2s ease;
    }
`;

export interface FileTreeNode {
    name: string;
    path: string;
    isFile: boolean;
    children?: FileTreeNode[];
    expanded?: boolean;
}

interface GTNHFileBrowserProps {
    selectedPaths: Set<string>;
    onSelectionChange: (paths: Set<string>) => void;
    worldFolderName: string | null;
    modsFolder: string;
}

const GTNHFileBrowser: React.FC<GTNHFileBrowserProps> = ({
    selectedPaths,
    onSelectionChange,
    worldFolderName,
    modsFolder,
}) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [tree, setTree] = useState<FileTreeNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));
    const [browserPath, setBrowserPath] = useState('/');
    const [pathHistory, setPathHistory] = useState<string[]>(['/']);
    const [historyIndex, setHistoryIndex] = useState(0);

    const loadFilesAtPath = async (path: string): Promise<FileTreeNode[]> => {
        try {
            const files = await loadDirectory(uuid, path);
            const mapped = files.map((file) => ({
                name: file.name,
                path: path === '/' ? `/${file.name}` : `${path}/${file.name}`,
                isFile: file.isFile,
                children: file.isFile ? undefined : [],
                expanded: false,
            }));
            
            // Sort: folders first (alphabetically), then files (alphabetically)
            return mapped.sort((a, b) => {
                if (!a.isFile && b.isFile) return -1; // folders come first
                if (a.isFile && !b.isFile) return 1;  // files come after
                return a.name.localeCompare(b.name);   // alphabetical within type
            });
        } catch (err: any) {
            throw new Error(err.message || 'Failed to load directory');
        }
    };

    useEffect(() => {
        loadFilesAtPath('/').then((rootFiles) => {
            setTree(rootFiles);
            setLoading(false);
        }).catch((err) => {
            setError(err.message);
            setLoading(false);
        });
    }, [uuid]);

    const toggleFolder = async (node: FileTreeNode) => {
        if (node.isFile) return;

        const newExpanded = new Set(expandedFolders);
        if (expandedFolders.has(node.path)) {
            newExpanded.delete(node.path);
        } else {
            newExpanded.add(node.path);
            // Load children if not loaded
            if (!node.children || node.children.length === 0) {
                try {
                    const children = await loadFilesAtPath(node.path);
                    updateNodeChildren(node.path, children);
                } catch (err: any) {
                    console.error('Failed to load folder:', err);
                }
            }
        }
        setExpandedFolders(newExpanded);
    };

    const updateNodeChildren = (path: string, children: FileTreeNode[]) => {
        const updateTree = (nodes: FileTreeNode[]): FileTreeNode[] => {
            return nodes.map((node) => {
                if (node.path === path) {
                    return { ...node, children };
                }
                if (node.children) {
                    return { ...node, children: updateTree(node.children) };
                }
                return node;
            });
        };
        setTree(updateTree(tree));
    };

    const isPathSelected = (path: string): boolean => {
        return selectedPaths.has(path);
    };

    const isPathPartiallySelected = (node: FileTreeNode): boolean => {
        if (node.isFile) return false;
        if (!node.children || node.children.length === 0) return false;

        const childrenSelected = node.children.filter((child) =>
            isPathSelected(child.path) || isPathPartiallySelected(child)
        );
        return childrenSelected.length > 0 && childrenSelected.length < node.children.length;
    };

    const areAllChildrenSelected = (node: FileTreeNode): boolean => {
        if (node.isFile) return isPathSelected(node.path);
        if (!node.children || node.children.length === 0) return isPathSelected(node.path);

        return node.children.every((child) =>
            isPathSelected(child.path) || areAllChildrenSelected(child)
        );
    };

    const toggleSelection = (node: FileTreeNode) => {
        // Don't allow selecting the mods folder itself
        if (node.path === modsFolder && !node.isFile) {
            return;
        }

        const newSelection = new Set(selectedPaths);
        const isCurrentlySelected = areAllChildrenSelected(node);

        const toggleNodeAndChildren = (n: FileTreeNode, select: boolean) => {
            if (select) {
                newSelection.add(n.path);
            } else {
                newSelection.delete(n.path);
            }

            if (!n.isFile && n.children) {
                n.children.forEach((child) => toggleNodeAndChildren(child, select));
            }
        };

        toggleNodeAndChildren(node, !isCurrentlySelected);
        onSelectionChange(newSelection);
    };

    const navigateToPath = (path: string, addToHistory = true) => {
        if (addToHistory) {
            const newHistory = pathHistory.slice(0, historyIndex + 1);
            newHistory.push(path);
            setPathHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
        setBrowserPath(path);
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

    const renderNode = (node: FileTreeNode, indent: number = 0): React.ReactNode => {
        const isExpanded = expandedFolders.has(node.path);
        const isSelected = areAllChildrenSelected(node);
        const isPartial = isPathPartiallySelected(node);
        const isModsFolder = node.path === modsFolder && !node.isFile;
        const isDisabled = isModsFolder;

        return (
            <React.Fragment key={node.path}>
                <FileItemContainer
                    $selected={isSelected}
                    $disabled={isDisabled}
                    $indent={indent}
                    onClick={() => !isDisabled && toggleSelection(node)}
                >
                    {!node.isFile && (
                        <ExpandButton
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleFolder(node);
                            }}
                        >
                            <FontAwesomeIcon
                                icon={faChevronRight}
                                style={{
                                    transform: isExpanded ? 'rotate(90deg)' : 'none',
                                }}
                            />
                        </ExpandButton>
                    )}
                    {node.isFile && <div css={tw`w-6`} />}
                    <Checkbox $checked={isSelected} $indeterminate={isPartial} />
                    <FontAwesomeIcon icon={node.isFile ? faFile : faFolder} />
                    <span css={tw`flex-1 truncate`}>
                        {node.name}
                        {isModsFolder && <span css={tw`text-xs text-neutral-500 ml-2`}>(navigate inside to select)</span>}
                    </span>
                </FileItemContainer>
                {!node.isFile && isExpanded && node.children && (
                    <>
                        {node.children.map((child) => renderNode(child, indent + 1))}
                    </>
                )}
            </React.Fragment>
        );
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
                ) : tree.length === 0 ? (
                    <EmptyState>No files in this directory</EmptyState>
                ) : (
                    tree.map((node) => renderNode(node))
                )}
            </BrowserContent>
        </BrowserContainer>
    );
};

export default GTNHFileBrowser;

