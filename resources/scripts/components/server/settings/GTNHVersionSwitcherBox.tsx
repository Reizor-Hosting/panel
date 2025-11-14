import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { ServerContext } from '@/state/server';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { Actions, useStoreActions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { Button } from '@/components/elements/button/index';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { fetchVersionsByType, GTNHVersion } from '@/api/server/gtnh/getGTNHVersions';
import { bytesToString } from '@/lib/formatters';

const TabContainer = styled.div`
    ${tw`flex flex-row border-b border-neutral-700 mb-4`};
`;

const Tab = styled.button<{ $active: boolean }>`
    ${tw`px-4 py-2 font-medium text-sm transition-colors relative`};
    color: ${(props) => (props.$active ? 'rgba(211, 47, 66, 1)' : 'rgba(255, 255, 255, 0.6)')};
    border-bottom: 2px solid ${(props) => (props.$active ? 'rgba(211, 47, 66, 1)' : 'transparent')};

    &:hover {
        color: ${(props) => (props.$active ? 'rgba(211, 47, 66, 1)' : 'rgba(255, 255, 255, 0.8)')};
    }
`;

const VersionList = styled.div`
    ${tw`max-h-64 overflow-y-auto space-y-2`};
`;

const VersionItem = styled.div<{ $selected: boolean }>`
    ${tw`p-3 rounded cursor-pointer relative overflow-hidden`};
    background: ${(props) =>
        props.$selected
            ? 'linear-gradient(135deg, rgba(211, 47, 66, 0.2), rgba(211, 47, 66, 0.1))'
            : 'linear-gradient(135deg, rgba(48, 48, 48, 0.6), rgba(33, 33, 33, 0.6))'};
    border: 1px solid ${(props) => (props.$selected ? 'rgba(211, 47, 66, 0.4)' : 'rgba(211, 47, 66, 0.2)')};
    color: rgba(255, 255, 255, 0.85);
    transition: color 150ms ease;

    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 0;
        height: 100%;
        background: rgba(211, 47, 66, 0.1);
        transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
        z-index: 0;
    }

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(211, 47, 66, 0.25), transparent);
        transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
        z-index: 1;
    }

    & > * {
        position: relative;
        z-index: 2;
    }

    &:hover {
        border-color: rgba(211, 47, 66, 0.4);
        color: rgba(255, 255, 255, 0.95);

        &::before {
            left: 100%;
        }

        &::after {
            width: 100%;
        }
    }
`;

type VersionType = 'stable' | 'beta' | 'experimental' | 'daily';

export default () => {
    const history = useHistory();
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [activeTab, setActiveTab] = useState<VersionType>('stable');
    const [versions, setVersions] = useState<GTNHVersion[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<GTNHVersion | null>(null);
    const [loading, setLoading] = useState(false);
    const { addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    useEffect(() => {
        setLoading(true);
        fetchVersionsByType(uuid, activeTab)
            .then((fetchedVersions) => {
                setVersions(fetchedVersions);
                setSelectedVersion(null);
            })
            .catch((error) => {
                console.error('Failed to fetch versions:', error);
                addFlash({
                    key: 'settings',
                    type: 'error',
                    message: 'Failed to fetch versions. Please try again.',
                });
            })
            .finally(() => setLoading(false));
    }, [activeTab, uuid]);

    const handleVersionSelect = (version: GTNHVersion) => {
        setSelectedVersion(version);
    };

    const handleProceedToFileSelection = () => {
        if (!selectedVersion) return;

        // Navigate to the file selection page with the selected version
        history.push(`/server/${uuid}/settings/gtnh-files`, {
            selectedVersion,
        });
    };

    return (
        <TitledGreyBox title={'GTNH Version Switcher'} css={tw`relative`}>
            <SpinnerOverlay visible={loading} />

            <p css={tw`text-sm mb-4 text-neutral-300`}>
                Switch your GregTech: New Horizons server to a different version. Select a version type, choose a
                version, and then select which files to keep during the reinstall.
            </p>

            <TabContainer>
                <Tab $active={activeTab === 'stable'} onClick={() => setActiveTab('stable')}>
                    Stable
                </Tab>
                <Tab $active={activeTab === 'beta'} onClick={() => setActiveTab('beta')}>
                    Beta
                </Tab>
                <Tab $active={activeTab === 'experimental'} onClick={() => setActiveTab('experimental')}>
                    Experimental
                </Tab>
                <Tab $active={activeTab === 'daily'} onClick={() => setActiveTab('daily')}>
                    Daily
                </Tab>
            </TabContainer>

            <VersionList>
                {versions.length === 0 && !loading && (
                    <p css={tw`text-sm text-neutral-400 text-center py-4`}>No versions available for this type.</p>
                )}
                {versions.map((version) => (
                    <VersionItem
                        key={version.url}
                        $selected={selectedVersion?.url === version.url}
                        onClick={() => handleVersionSelect(version)}
                    >
                        <div css={tw`flex justify-between items-center`}>
                            <div>
                                <p css={tw`font-medium text-sm`}>{version.name}</p>
                                {version.date && (
                                    <p css={tw`text-xs text-neutral-400`}>{version.date.toLocaleString()}</p>
                                )}
                            </div>
                            {version.size && (
                                <span css={tw`text-xs text-neutral-400`}>{bytesToString(version.size)}</span>
                            )}
                        </div>
                    </VersionItem>
                ))}
            </VersionList>

            {selectedVersion && (
                <div css={tw`mt-4 p-3 bg-neutral-900 rounded border border-cyan-700`}>
                    <p css={tw`text-sm mb-2`}>
                        <strong>Selected:</strong> {selectedVersion.name}
                    </p>
                    <p css={tw`text-xs text-neutral-400 mb-3`}>
                        This will update your PACK_LINK variable and reinstall your server.
                    </p>
                    <div css={tw`text-right`}>
                        <Button onClick={handleProceedToFileSelection} disabled={loading}>
                            Continue
                        </Button>
                    </div>
                </div>
            )}
        </TitledGreyBox>
    );
};
