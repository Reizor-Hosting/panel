import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { ServerContext } from '@/state/server';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { Actions, useStoreActions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { httpErrorToHuman } from '@/api/http';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { Button } from '@/components/elements/button/index';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import updateServerVariable from '@/api/server/gtnh/updateServerVariable';
import reinstallServer from '@/api/server/reinstallServer';
import getServerProperties from '@/api/server/gtnh/getServerProperties';
import GTNHFileBrowser from '@/components/server/settings/GTNHFileBrowser';
import { Alert } from '@/components/elements/alert';
import { CosmicFrontiersVersion } from '@/api/server/cosmicfrontiers/getCosmicFrontiersVersions';
import getServerFiles from '@/api/server/gtnh/getServerFiles';
import deleteServerFiles from '@/api/server/gtnh/deleteServerFiles';
import compressFiles from '@/api/server/files/compressFiles';
import decompressFiles from '@/api/server/files/decompressFiles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCircleNotch } from '@fortawesome/free-solid-svg-icons';
import getServer from '@/api/server/getServer';
import getServerResourceUsage from '@/api/server/getServerResourceUsage';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { SocketEvent } from '@/components/server/events';

const SummaryBox = styled.div`
    ${tw`mt-4 p-3 rounded border`};
    border-color: rgba(211, 47, 66, 0.3);
    background: rgba(33, 33, 33, 0.5);
    max-height: 12rem;
    overflow-y: auto;
`;

const ProgressContainer = styled.div`
    ${tw`flex flex-col gap-6 py-8`};
`;

const ProgressStep = styled.div<{ $status: 'pending' | 'active' | 'complete' }>`
    ${tw`flex items-center gap-4 px-6 py-4 rounded-lg transition-all duration-300`};
    background: ${(props) =>
        props.$status === 'active'
            ? 'linear-gradient(135deg, rgba(211, 47, 66, 0.15), rgba(211, 47, 66, 0.05))'
            : props.$status === 'complete'
            ? 'rgba(34, 197, 94, 0.1)'
            : 'rgba(33, 33, 33, 0.5)'};
    border: 1px solid
        ${(props) =>
            props.$status === 'active'
                ? 'rgba(211, 47, 66, 0.4)'
                : props.$status === 'complete'
                ? 'rgba(34, 197, 94, 0.4)'
                : 'rgba(211, 47, 66, 0.1)'};
`;

const StepIcon = styled.div<{ $status: 'pending' | 'active' | 'complete' }>`
    ${tw`flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0`};
    background: ${(props) =>
        props.$status === 'active'
            ? 'rgba(211, 47, 66, 0.2)'
            : props.$status === 'complete'
            ? 'rgba(34, 197, 94, 0.2)'
            : 'rgba(128, 128, 128, 0.1)'};
    border: 2px solid
        ${(props) =>
            props.$status === 'active'
                ? 'rgba(211, 47, 66, 0.6)'
                : props.$status === 'complete'
                ? 'rgba(34, 197, 94, 0.6)'
                : 'rgba(128, 128, 128, 0.3)'};
    color: ${(props) =>
        props.$status === 'active'
            ? 'rgba(211, 47, 66, 1)'
            : props.$status === 'complete'
            ? 'rgba(34, 197, 94, 1)'
            : 'rgba(128, 128, 128, 0.6)'};

    svg {
        font-size: 1.5rem;
    }

    .fa-circle-notch {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
`;

const StepContent = styled.div`
    ${tw`flex-1`};
`;

const StepTitle = styled.h3<{ $status: 'pending' | 'active' | 'complete' }>`
    ${tw`text-lg font-semibold mb-1`};
    color: ${(props) =>
        props.$status === 'active'
            ? 'rgba(255, 255, 255, 1)'
            : props.$status === 'complete'
            ? 'rgba(34, 197, 94, 1)'
            : 'rgba(255, 255, 255, 0.5)'};
`;

const StepDescription = styled.p<{ $status: 'pending' | 'active' | 'complete' }>`
    ${tw`text-sm`};
    color: ${(props) =>
        props.$status === 'active' || props.$status === 'complete'
            ? 'rgba(255, 255, 255, 0.7)'
            : 'rgba(255, 255, 255, 0.4)'};
`;

const InstallOutputContainer = styled.div`
    ${tw`mt-6 rounded-lg overflow-hidden`};
    border: 1px solid rgba(211, 47, 66, 0.3);
    background: rgba(15, 15, 15, 0.8);
`;

const InstallOutputHeader = styled.div`
    ${tw`px-4 py-2 border-b`};
    border-color: rgba(211, 47, 66, 0.3);
    background: rgba(24, 24, 24, 0.9);
`;

const InstallOutputContent = styled.div`
    ${tw`p-4 font-mono text-xs overflow-y-auto`};
    max-height: 400px;
    background: rgba(10, 10, 10, 0.95);
    color: rgba(255, 255, 255, 0.85);

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(211, 47, 66, 0.4);
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: rgba(211, 47, 66, 0.6);
    }
`;

const OutputLine = styled.div`
    ${tw`mb-1`};
    white-space: pre-wrap;
    word-break: break-all;
`;

// Memoized output line component to prevent unnecessary re-renders
const MemoizedOutputLine = React.memo(({ children }: { children: string }) => <OutputLine>{children}</OutputLine>);

interface LocationState {
    selectedVersion?: CosmicFrontiersVersion;
}

export default () => {
    const history = useHistory();
    const location = useLocation<LocationState>();
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);
    const [selectedFilePaths, setSelectedFilePaths] = useState<Set<string>>(new Set());
    const [worldFolderName, setWorldFolderName] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
    const [installOutput, setInstallOutput] = useState<string[]>([]);
    const outputRef = React.useRef<HTMLDivElement>(null);
    const outputBufferRef = React.useRef<string[]>([]);
    const flushTimerRef = React.useRef<NodeJS.Timeout | null>(null);
    const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const steps = [
        { title: 'Stopping server', description: 'Safely stopping the server before making changes...' },
        { title: 'Retrieving files to save', description: 'Analyzing your server files...' },
        { title: 'Deleting files', description: 'Removing files not selected for preservation...' },
        { title: 'Creating backup archive', description: 'Compressing selected files into archive...' },
        { title: 'Changing pack link variable', description: 'Updating PACK_LINK environment variable...' },
        { title: 'Reinstalling', description: 'Installing new version and starting server...' },
        { title: 'Restoring files', description: 'Extracting backed up files from archive...' },
    ];

    const selectedVersion = location.state?.selectedVersion;

    // Flush the output buffer to state
    const flushOutputBuffer = React.useCallback(() => {
        if (outputBufferRef.current.length > 0) {
            setInstallOutput((prev) => {
                const combined = [...prev, ...outputBufferRef.current];
                // Keep only the last 1000 lines to prevent memory issues
                return combined.slice(-1000);
            });
            outputBufferRef.current = [];
        }
    }, []);

    // Listen for install output messages from the websocket
    // Buffer the output and flush periodically to prevent lag
    useWebsocketEvent(SocketEvent.INSTALL_OUTPUT, (output: string) => {
        outputBufferRef.current.push(output);

        // Clear existing timer
        if (flushTimerRef.current) {
            clearTimeout(flushTimerRef.current);
        }

        // Flush after 100ms of no new output, or immediately if buffer is large
        if (outputBufferRef.current.length > 50) {
            flushOutputBuffer();
        } else {
            flushTimerRef.current = setTimeout(() => {
                flushOutputBuffer();
            }, 100);
        }
    });

    // Auto-scroll to bottom when new output arrives
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [installOutput]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (flushTimerRef.current) {
                clearTimeout(flushTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!selectedVersion) {
            history.push(`/server/${uuid}/settings`);
            return;
        }

        // Load server properties and auto-select world folder
        getServerProperties(uuid)
            .then((levelName) => {
                setWorldFolderName(levelName);
                const initialSelection = new Set<string>();
                if (levelName) {
                    initialSelection.add(`/${levelName}`);
                }
                setSelectedFilePaths(initialSelection);
            })
            .catch((error) => {
                console.error('Failed to read server properties:', error);
            })
            .finally(() => setIsLoading(false));
    }, [selectedVersion, uuid, history]);

    // Check if a path or any of its children are selected
    const isPathOrChildSelected = (path: string, selectedPaths: Set<string>): boolean => {
        if (selectedPaths.has(path)) return true;

        // Check if any selected path is a child of this path
        for (const selected of selectedPaths) {
            if (selected.startsWith(path + '/')) {
                return true;
            }
        }
        return false;
    };

    // Smart deletion: only recurse into directories with partial selections
    const getFilesToDelete = async (directory = '/'): Promise<string[]> => {
        const files = await getServerFiles(uuid, directory);
        const toDelete: string[] = [];

        for (const file of files) {
            const filePath = directory === '/' ? `/${file.name}` : `${directory}/${file.name}`;

            // Check if this path or any children are selected
            const isSelected = isPathOrChildSelected(filePath, selectedFilePaths);

            if (!isSelected) {
                // Nothing selected here - delete the entire thing (file or directory)
                toDelete.push(filePath);
            } else if (!file.isFile && !selectedFilePaths.has(filePath)) {
                // It's a directory with partial selections - recurse to find what to delete
                try {
                    const childDeletions = await getFilesToDelete(filePath);
                    toDelete.push(...childDeletions);
                } catch (err) {
                    console.error(`Failed to process directory ${filePath}:`, err);
                }
            }
            // else: file/directory is fully selected, keep it
        }

        return toDelete;
    };

    const markStepComplete = (step: number) => {
        setCompletedSteps((prev) => new Set(prev).add(step));
    };

    const waitForServerOffline = async () => {
        return new Promise<void>((resolve) => {
            const checkInterval = setInterval(async () => {
                try {
                    const stats = await getServerResourceUsage(uuid);
                    // Server is offline when power state is 'offline'
                    if (stats.status === 'offline') {
                        clearInterval(checkInterval);
                        resolve();
                    }
                } catch (error) {
                    // If we can't get server status, continue polling
                    console.error('Failed to check server power state while waiting for offline:', error);
                }
            }, 1000);
        });
    };

    const pollInstallationStatus = async () => {
        return new Promise<void>((resolve) => {
            const checkStatus = async () => {
                try {
                    const [server] = await getServer(uuid);

                    // Installation is complete when status is null (not 'installing')
                    if (server.status !== 'installing') {
                        resolve();
                        return;
                    }

                    // Continue polling
                    setTimeout(checkStatus, 2000);
                } catch (error) {
                    console.error('Failed to check server status:', error);
                    // Continue polling even on error
                    setTimeout(checkStatus, 2000);
                }
            };

            checkStatus();
        });
    };

    const handleConfirmVersionChange = async () => {
        if (!selectedVersion) return;

        setIsProcessing(true);
        clearFlashes('settings');

        try {
            // Step 0: Stopping server
            setCurrentStep(0);
            if (instance && status !== 'offline') {
                console.log('[Cosmic Frontiers Version Switch] Stopping server before making changes...');
                instance.send('set state', 'stop');
                // Wait for the server to be completely offline
                await waitForServerOffline();
                console.log('[Cosmic Frontiers Version Switch] Server stopped successfully');
            } else {
                console.log('[Cosmic Frontiers Version Switch] Server already offline');
            }
            markStepComplete(0);

            // Step 1: Retrieving files to save
            setCurrentStep(1);
            const filesToDelete = await getFilesToDelete('/');
            markStepComplete(1);

            // Step 2: Deleting files not selected for preservation
            setCurrentStep(2);
            if (filesToDelete.length > 0) {
                // Delete in batches to avoid overwhelming the API
                const batchSize = 50;
                for (let i = 0; i < filesToDelete.length; i += batchSize) {
                    const batch = filesToDelete.slice(i, i + batchSize);
                    await deleteServerFiles(uuid, batch);
                }
            }
            markStepComplete(2);

            // Step 3: Creating backup archive of files to keep
            setCurrentStep(3);
            let archiveName: string | null = null;
            if (selectedFilePaths.size > 0) {
                console.log('[Cosmic Frontiers Backup] Creating backup archive of selected files');
                // Create a compressed archive of the files we want to preserve
                // Use a unique name with timestamp to avoid conflicts with the installation
                const filesToBackup = Array.from(selectedFilePaths).map((path) => path.substring(1)); // Remove leading slash
                const archive = await compressFiles(uuid, '/', filesToBackup);
                archiveName = archive.name;
                console.log('[Cosmic Frontiers Backup] Archive created:', archiveName);
            }
            markStepComplete(3);

            // Step 4: Changing pack link variable
            setCurrentStep(4);
            await updateServerVariable(uuid, 'PACK_LINK', selectedVersion.url);
            markStepComplete(4);

            // Step 5: Reinstalling - start the reinstall and monitor status
            setCurrentStep(5);
            await reinstallServer(uuid);

            // Poll until installation is complete
            await pollInstallationStatus();

            // Installation complete
            markStepComplete(5);

            // Step 6: Restoring files from backup archive
            setCurrentStep(6);
            if (archiveName) {
                console.log('[Cosmic Frontiers Restore] Extracting backup archive:', archiveName);
                try {
                    // Extract the archive to restore our saved files
                    await decompressFiles(uuid, '/', archiveName);
                    console.log('[Cosmic Frontiers Restore] Files restored successfully');

                    // Clean up the archive file
                    await deleteServerFiles(uuid, [archiveName]);
                    console.log('[Cosmic Frontiers Restore] Archive cleanup complete');
                } catch (error) {
                    console.error('[Cosmic Frontiers Restore] Failed to restore from archive:', error);
                    // If restore fails, just log it and continue - the server will still work with new files
                    addFlash({
                        key: 'settings',
                        type: 'warning',
                        message:
                            'Version upgrade completed but some files could not be restored from backup. Your server may have reverted to default configurations.',
                    });
                }
            }
            markStepComplete(6);

            addFlash({
                key: 'settings',
                type: 'success',
                message: 'Version change completed successfully! Your server has been reinstalled.',
            });
        } catch (error: any) {
            console.error('Failed to change version:', error);
            addFlash({
                key: 'settings',
                type: 'error',
                message: httpErrorToHuman(error),
            });
            setIsProcessing(false);
        }
    };

    if (!selectedVersion) {
        return null;
    }

    const getStepStatus = (stepIndex: number): 'pending' | 'active' | 'complete' => {
        if (completedSteps.has(stepIndex)) return 'complete';
        if (currentStep === stepIndex) return 'active';
        return 'pending';
    };

    return (
        <ServerContentBlock title={isProcessing ? 'Changing Version' : 'Select Files to Keep'}>
            <SpinnerOverlay visible={isLoading} />

            {isProcessing ? (
                <ProgressContainer>
                    {steps.map((step, index) => {
                        const status = getStepStatus(index);
                        return (
                            <ProgressStep key={index} $status={status}>
                                <StepIcon $status={status}>
                                    {status === 'complete' ? (
                                        <FontAwesomeIcon icon={faCheck} />
                                    ) : status === 'active' ? (
                                        <FontAwesomeIcon icon={faCircleNotch} className={'fa-circle-notch'} />
                                    ) : (
                                        <span css={tw`text-2xl font-bold text-neutral-500`}>{index + 1}</span>
                                    )}
                                </StepIcon>
                                <StepContent>
                                    <StepTitle $status={status}>{step.title}</StepTitle>
                                    <StepDescription $status={status}>{step.description}</StepDescription>
                                </StepContent>
                            </ProgressStep>
                        );
                    })}

                    <div css={tw`text-center mt-4`}>
                        <p css={tw`text-sm text-neutral-400`}>
                            Please wait while we prepare your server for the new version...
                        </p>
                    </div>

                    {installOutput.length > 0 && currentStep === 5 && (
                        <InstallOutputContainer>
                            <InstallOutputHeader>
                                <h4 css={tw`text-sm font-semibold text-neutral-200`}>
                                    Installer Output {installOutput.length >= 1000 && '(showing last 1000 lines)'}
                                </h4>
                            </InstallOutputHeader>
                            <InstallOutputContent ref={outputRef}>
                                {installOutput.map((line, index) => (
                                    <MemoizedOutputLine key={index}>{line}</MemoizedOutputLine>
                                ))}
                            </InstallOutputContent>
                        </InstallOutputContainer>
                    )}
                </ProgressContainer>
            ) : (
                <>
                    {worldFolderName && (
                        <Alert type={'warning'} css={tw`mb-4`}>
                            <span>
                                We have auto-selected your world folder{' '}
                                <strong css={tw`inline`}>({worldFolderName})</strong>. Deselecting this will cause your
                                world data to be lost while updating!
                            </span>
                        </Alert>
                    )}

                    <p css={tw`text-sm text-neutral-300 mb-3`}>
                        Select the files and folders you want to <strong>keep</strong>. All other files will be deleted
                        before installing <strong>{selectedVersion.name}</strong>. You can navigate into folders to
                        select individual files.
                    </p>

                    <p css={tw`text-xs text-neutral-400 mb-4`}>
                        <strong>Note:</strong> The <code css={tw`bg-neutral-800 px-1 py-0.5 rounded`}>mods</code> folder
                        cannot be selected directly, but you can navigate inside and select individual mods you want to
                        keep.
                    </p>

                    <GTNHFileBrowser
                        selectedPaths={selectedFilePaths}
                        onSelectionChange={setSelectedFilePaths}
                        worldFolderName={worldFolderName}
                        modsFolder={'/mods'}
                    />

                    {selectedFilePaths.size > 0 && (
                        <SummaryBox>
                            <p css={tw`text-sm font-medium text-neutral-200 mb-2`}>
                                Files to Keep ({selectedFilePaths.size}):
                            </p>
                            <div css={tw`space-y-1`}>
                                {Array.from(selectedFilePaths)
                                    .sort()
                                    .map((path) => (
                                        <div key={path} css={tw`text-xs text-neutral-400 font-mono`}>
                                            {path}
                                        </div>
                                    ))}
                            </div>
                        </SummaryBox>
                    )}

                    <div css={tw`flex gap-3 mt-6 justify-end`}>
                        <Button.Text disabled={isProcessing} onClick={() => history.push(`/server/${uuid}/settings`)}>
                            Cancel
                        </Button.Text>
                        <Button.Danger disabled={isProcessing} onClick={handleConfirmVersionChange}>
                            Change Version & Reinstall
                        </Button.Danger>
                    </div>
                </>
            )}
        </ServerContentBlock>
    );
};

