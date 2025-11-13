import * as React from 'react';
import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCogs, faSignOutAlt, faBars, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import SearchContainer from '@/components/dashboard/search/SearchContainer';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import http from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import Avatar from '@/components/Avatar';

const NavContainer = styled.div<{ $sidebarCollapsed?: boolean; $hasSidebar?: boolean }>`
    ${tw`fixed top-0 right-0 left-0 z-50`};
    backdrop-filter: blur(20px) saturate(180%);
    background: linear-gradient(180deg, rgba(28, 28, 28, 0.95) 0%, rgba(24, 24, 24, 0.95) 100%);
    border-bottom: 1px solid rgba(211, 47, 66, 0.15);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3), 0 0 1px rgba(255, 255, 255, 0.05);
    height: 3.5rem;
    left: 0;

    @media (min-width: 769px) {
        height: 4rem;
    }
`;

const NavContent = styled.div`
    ${tw`h-full flex items-center justify-between gap-2`};
    padding: 0 1rem;
    max-width: 100%;

    @media (min-width: 769px) {
        padding: 0 1.5rem;
    }

    .navigation-link {
        ${tw`flex items-center justify-center h-9 w-9 rounded-lg text-neutral-400 cursor-pointer transition-all duration-200 relative`};
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);

        &::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 0.5rem;
            background: linear-gradient(135deg, rgba(211, 47, 66, 0.15) 0%, rgba(211, 47, 66, 0.08) 100%);
            opacity: 0;
            transition: opacity 0.2s ease;
        }

        &:hover {
            ${tw`text-neutral-100`};
            transform: translateY(-1px);
            border-color: rgba(211, 47, 66, 0.3);
            box-shadow: 0 2px 8px rgba(211, 47, 66, 0.15), 0 0 0 1px rgba(211, 47, 66, 0.1);

            &::before {
                opacity: 1;
            }
        }

        &:active {
            transform: translateY(0) scale(0.96);
        }

        svg {
            font-size: 1.125rem;
            position: relative;
            z-index: 1;
        }
    }
`;

const ButtonGroup = styled.div`
    ${tw`flex items-center gap-1.5`};
    position: relative;
    padding-right: 0.75rem;
    margin-right: 0.75rem;

    &::after {
        content: '';
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 1px;
        height: 1.5rem;
        background: rgba(255, 255, 255, 0.08);
    }

    &:last-child {
        padding-right: 0;
        margin-right: 0;

        &::after {
            display: none;
        }
    }

    @media (max-width: 768px) {
        padding-right: 0.5rem;
        margin-right: 0.5rem;
        gap: 0.75rem;

        &::after {
            display: none;
        }

        &.desktop-only {
            display: none;
        }
    }
`;

const NavButton = styled.button`
    ${tw`flex items-center justify-center rounded-lg text-neutral-400 cursor-pointer transition-all duration-200 relative`};
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    position: relative;
    backdrop-filter: blur(10px);
    height: 2.25rem;
    width: 2.25rem;
    flex-shrink: 0;
    text-decoration: none;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 0.5rem;
        background: linear-gradient(135deg, rgba(211, 47, 66, 0.15) 0%, rgba(211, 47, 66, 0.08) 100%);
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    @media (min-width: 769px) {
        height: 2.25rem;
        width: 2.25rem;
    }

    &:hover {
        ${tw`text-neutral-100`};
        transform: translateY(-1px);
        border-color: rgba(211, 47, 66, 0.3);
        box-shadow: 0 2px 8px rgba(211, 47, 66, 0.15), 0 0 0 1px rgba(211, 47, 66, 0.1);

        &::before {
            opacity: 1;
        }
    }

    &:active {
        transform: translateY(0) scale(0.96);
    }

    svg {
        font-size: 1rem;
        position: relative;
        z-index: 1;

        @media (min-width: 769px) {
            font-size: 1.125rem;
        }
    }
`;

const NavLinkStyled = styled(NavLink)`
    ${tw`flex items-center justify-center no-underline transition-all duration-200 relative`};
    position: relative;
    background: transparent;
    border: none;
    height: 2.25rem;
    width: 2.25rem;
    flex-shrink: 0;

    @media (min-width: 769px) {
        height: 2.25rem;
        width: 2.25rem;
    }

    &:hover {
        transform: translateY(-1px);
    }

    &:active {
        transform: translateY(0) scale(0.98);
    }
`;

const MobileMenuButton = styled.button`
    ${tw`flex items-center justify-center rounded-lg text-neutral-400 cursor-pointer transition-all duration-200`};
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    position: relative;
    backdrop-filter: blur(10px);
    height: 2.25rem;
    width: 2.25rem;
    flex-shrink: 0;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 0.5rem;
        background: linear-gradient(135deg, rgba(211, 47, 66, 0.15) 0%, rgba(211, 47, 66, 0.08) 100%);
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    @media (min-width: 769px) {
        display: none;
    }

    &:hover {
        ${tw`text-neutral-100`};
        transform: translateY(-1px);
        border-color: rgba(211, 47, 66, 0.3);
        box-shadow: 0 2px 8px rgba(211, 47, 66, 0.15), 0 0 0 1px rgba(211, 47, 66, 0.1);

        &::before {
            opacity: 1;
        }
    }

    &:active {
        transform: translateY(0) scale(0.96);
    }

    svg {
        font-size: 1.125rem;
        position: relative;
        z-index: 1;
    }
`;

const LeftSection = styled.div`
    ${tw`flex items-center flex-1`};
    min-width: 0;
    gap: 0.75rem;

    @media (min-width: 769px) {
        gap: 0.75rem;
    }
`;

const CompanyName = styled(Link)`
    ${tw`font-header no-underline transition-all duration-200`};
    color: rgba(255, 255, 255, 0.95);
    font-weight: 700;
    letter-spacing: -0.025em;
    white-space: nowrap;
    padding: 0.375rem 0.5rem;
    border-radius: 0.5rem;
    position: relative;
    font-size: 0.875rem;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 0.5rem;
        background: rgba(211, 47, 66, 0.08);
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    &:hover {
        color: rgba(255, 255, 255, 1);
        transform: translateY(-1px);

        &::before {
            opacity: 1;
        }
    }

    @media (min-width: 640px) {
        font-size: 1rem;
        max-width: 200px;
    }

    @media (min-width: 769px) {
        font-size: 1.125rem;
        max-width: none;
        padding: 0.5rem;
    }
`;

const BackButton = styled(Link)`
    ${tw`flex items-center justify-center rounded-lg text-neutral-400 cursor-pointer transition-all duration-200 relative`};
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    text-decoration: none;
    height: 2.25rem;
    width: 2.25rem;
    flex-shrink: 0;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 0.5rem;
        background: linear-gradient(135deg, rgba(211, 47, 66, 0.15) 0%, rgba(211, 47, 66, 0.08) 100%);
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    &:hover {
        ${tw`text-neutral-100`};
        transform: translateY(-1px);
        border-color: rgba(211, 47, 66, 0.3);
        box-shadow: 0 2px 8px rgba(211, 47, 66, 0.15), 0 0 0 1px rgba(211, 47, 66, 0.1);

        &::before {
            opacity: 1;
        }
    }

    &:active {
        transform: translateY(0) scale(0.96);
    }

    svg {
        font-size: 1rem;
        position: relative;
        z-index: 1;

        @media (min-width: 769px) {
            font-size: 1.125rem;
        }
    }

    &.desktop-only {
        @media (max-width: 768px) {
            display: none;
        }
    }
`;

const RightSection = styled.div`
    ${tw`flex items-center`};
    gap: 0.5rem;
    flex-shrink: 0;

    @media (min-width: 769px) {
        gap: 0.5rem;
    }
`;

export const TopNavigation = ({
    onMenuToggle,
    sidebarCollapsed,
    hasSidebar,
}: {
    onMenuToggle?: () => void;
    sidebarCollapsed?: boolean;
    hasSidebar?: boolean;
}) => {
    const location = useLocation();
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);
    const appName = useStoreState((state: ApplicationStore) => state.settings.data?.name || 'Reizor Hosting');
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const isServerPage = location.pathname.startsWith('/server/');
    const isServerList = location.pathname === '/';

    const onTriggerLogout = () => {
        setIsLoggingOut(true);
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    return (
        <>
            <NavContainer $sidebarCollapsed={sidebarCollapsed} $hasSidebar={hasSidebar}>
                <SpinnerOverlay visible={isLoggingOut} />
                <NavContent>
                    <LeftSection>
                        {!isServerList && (
                            <MobileMenuButton onClick={onMenuToggle}>
                                <FontAwesomeIcon icon={faBars} />
                            </MobileMenuButton>
                        )}
                        <CompanyName to={'/'}>{appName}</CompanyName>
                    </LeftSection>
                    <RightSection>
                        <ButtonGroup className={'desktop-only'}>
                            <SearchContainer />
                        </ButtonGroup>
                        {isServerPage && (
                            <ButtonGroup className={'desktop-only'}>
                                <Tooltip placement={'bottom'} content={'Back to Server List'}>
                                    <BackButton to={'/'}>
                                        <FontAwesomeIcon icon={faLayerGroup} />
                                    </BackButton>
                                </Tooltip>
                            </ButtonGroup>
                        )}
                        {rootAdmin && (
                            <ButtonGroup className={'desktop-only'}>
                                <Tooltip placement={'bottom'} content={'Admin'}>
                                    <NavButton as={'a'} href={'/admin'}>
                                        <FontAwesomeIcon icon={faCogs} />
                                    </NavButton>
                                </Tooltip>
                            </ButtonGroup>
                        )}
                        <ButtonGroup>
                            <Tooltip placement={'bottom'} content={'Account Settings'}>
                                <NavLinkStyled to={'/account'}>
                                    <Avatar.User />
                                </NavLinkStyled>
                            </Tooltip>
                            <Tooltip placement={'bottom'} content={'Sign Out'} className={'desktop-only'}>
                                <NavButton onClick={onTriggerLogout} className={'desktop-only'}>
                                    <FontAwesomeIcon icon={faSignOutAlt} />
                                </NavButton>
                            </Tooltip>
                        </ButtonGroup>
                    </RightSection>
                </NavContent>
            </NavContainer>
        </>
    );
};

export default TopNavigation;
