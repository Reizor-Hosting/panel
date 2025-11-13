import React, { useState, useEffect } from 'react';
import { NavLink, useRouteMatch } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTerminal,
    faFolder,
    faDatabase,
    faClock,
    faUsers,
    faArchive,
    faNetworkWired,
    faCog,
    faListAlt,
    faUser,
    faKey,
    faFingerprint,
    faHome,
    faChevronLeft,
    faChevronRight,
    faSearch,
    faSignOutAlt,
    faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import Can from '@/components/elements/Can';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import routes from '@/routers/routes';
import { useLocation, Link } from 'react-router-dom';
import http from '@/api/http';
import SearchModal from '@/components/dashboard/search/SearchModal';

const SidebarContainer = styled.aside<{ $collapsed: boolean; $isMobile: boolean; $mobileOpen?: boolean }>`
    ${tw`fixed left-0 z-40 transition-all duration-300 ease-in-out overflow-hidden flex flex-col`};
    top: 3.5rem;
    height: calc(100vh - 3.5rem);
    width: ${(props) => (props.$collapsed ? '4rem' : '16rem')};
    background: linear-gradient(180deg, rgba(28, 28, 28, 0.98) 0%, rgba(24, 24, 24, 0.98) 100%);
    backdrop-filter: blur(20px) saturate(180%);
    border-right: 1px solid rgba(211, 47, 66, 0.15);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.4), 0 0 1px rgba(255, 255, 255, 0.05);

    @media (min-width: 769px) {
        top: 4rem;
        height: calc(100vh - 4rem);
    }

    @media (max-width: 768px) {
        top: 3.5rem;
        height: calc(100vh - 3.5rem);
        transform: ${(props) => (props.$mobileOpen ? 'translateX(0)' : 'translateX(-100%)')};
        width: 16rem;
        z-index: 60;
    }
`;

const SidebarFooter = styled.div`
    ${tw`absolute bottom-0 left-0 right-0`};
    border-top: 1px solid rgba(211, 47, 66, 0.12);
    background: rgba(32, 32, 32, 0.5);
    backdrop-filter: blur(10px);
`;

const ToggleButton = styled.button<{ $collapsed: boolean }>`
    ${tw`flex items-center justify-center h-12 text-neutral-400 hover:text-neutral-100 transition-all duration-200 relative`};
    background: transparent;
    border: none;
    cursor: pointer;
    width: 100%;
    padding: 0;
    gap: 0.75rem;
    position: relative;
    border-radius: 0;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(211, 47, 66, 0.1);
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    &:hover {
        &::before {
            opacity: 1;
        }
    }

    &:active {
        transform: scale(0.98);
    }

    svg {
        ${tw`flex-shrink-0 absolute`};
        width: 1rem;
        font-size: 1rem;
        left: ${(props) => (props.$collapsed ? '50%' : '1rem')};
        transform: ${(props) => (props.$collapsed ? 'translateX(-50%)' : 'none')};
        transition: left 0.3s ease, transform 0.3s ease;
    }

    span {
        ${tw`flex-1 text-left`};
        white-space: nowrap;
        overflow: hidden;
        display: ${(props) => (props.$collapsed ? 'none' : 'block')};
        font-weight: 500;
        margin-left: ${(props) => (props.$collapsed ? '0' : '2.5rem')};
        transition: margin-left 0.3s ease, opacity 0.2s ease;
        opacity: ${(props) => (props.$collapsed ? 0 : 1)};
    }
`;

const NavSection = styled.div`
    ${tw`py-2 flex-1 overflow-y-auto`};
`;

const MobileActionsDivider = styled.div`
    display: none;
    margin: 1.5rem 1rem 1rem 1rem;
    border-top: 1px solid rgba(211, 47, 66, 0.25);
    position: relative;

    &::before {
        content: '';
        position: absolute;
        left: 0;
        top: -1px;
        width: 3rem;
        height: 2px;
        background: linear-gradient(90deg, rgba(211, 47, 66, 0.4) 0%, transparent 100%);
    }

    @media (max-width: 768px) {
        display: block;
    }
`;

const MobileActionsSection = styled.div`
    display: none;
    padding: 0.75rem 0 1rem 0;
    margin-top: 0.5rem;

    @media (max-width: 768px) {
        display: block;
    }
`;

const NavList = styled.ul`
    ${tw`list-none m-0 p-0`};
`;

const NavItem = styled.li`
    ${tw`m-0`};
`;

const MobileActionButton = styled.button`
    ${tw`flex items-center gap-3 px-4 py-3 text-neutral-300 no-underline transition-all duration-200 relative w-full text-left`};
    font-weight: 500;
    position: relative;
    min-height: 2.75rem;
    margin: 0.125rem 0.5rem;
    border-radius: 0.5rem;
    background: transparent;
    border: none;
    cursor: pointer;

    svg {
        ${tw`flex-shrink-0`};
        width: 1.25rem;
        font-size: 1.25rem;
        transition: transform 0.2s ease;
    }

    span {
        ${tw`flex-1`};
        white-space: nowrap;
        overflow: hidden;
        font-size: 0.9375rem;
    }

    &:hover {
        ${tw`text-neutral-100`};
        background: rgba(211, 47, 66, 0.12);
        transform: translateX(2px);

        svg {
            transform: scale(1.1);
        }
    }

    &:active {
        transform: translateX(0) scale(0.98);
    }
`;

const MobileActionLink = styled(Link)`
    ${tw`flex items-center gap-3 px-4 py-3 text-neutral-300 no-underline transition-all duration-200 relative`};
    font-weight: 500;
    position: relative;
    min-height: 2.75rem;
    margin: 0.125rem 0.5rem;
    border-radius: 0.5rem;

    svg {
        ${tw`flex-shrink-0`};
        width: 1.25rem;
        font-size: 1.25rem;
        transition: transform 0.2s ease;
    }

    span {
        ${tw`flex-1`};
        white-space: nowrap;
        overflow: hidden;
        font-size: 0.9375rem;
    }

    &:hover {
        ${tw`text-neutral-100`};
        background: rgba(211, 47, 66, 0.12);
        transform: translateX(2px);

        svg {
            transform: scale(1.1);
        }
    }

    &:active {
        transform: translateX(0) scale(0.98);
    }
`;

const MobileActionAnchor = styled.a`
    ${tw`flex items-center gap-3 px-4 py-3 text-neutral-300 no-underline transition-all duration-200 relative`};
    font-weight: 500;
    position: relative;
    min-height: 2.75rem;
    margin: 0.125rem 0.5rem;
    border-radius: 0.5rem;

    svg {
        ${tw`flex-shrink-0`};
        width: 1.25rem;
        font-size: 1.25rem;
        transition: transform 0.2s ease;
    }

    span {
        ${tw`flex-1`};
        white-space: nowrap;
        overflow: hidden;
        font-size: 0.9375rem;
    }

    &:hover {
        ${tw`text-neutral-100`};
        background: rgba(211, 47, 66, 0.12);
        transform: translateX(2px);

        svg {
            transform: scale(1.1);
        }
    }

    &:active {
        transform: translateX(0) scale(0.98);
    }
`;

const NavLinkStyled = styled(NavLink)<{ $collapsed: boolean }>`
    ${tw`flex items-center gap-3 px-4 py-3 text-neutral-300 no-underline transition-all duration-200 relative`};
    font-weight: 500;
    position: relative;
    min-height: 2.75rem;
    margin: 0.125rem 0.5rem;
    border-radius: 0.5rem;

    &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 0;
        background: linear-gradient(180deg, #d32f42 0%, #b82538 100%);
        border-radius: 0 2px 2px 0;
        opacity: 0;
        transition: height 0.2s ease, opacity 0.2s ease;
    }

    svg {
        ${tw`flex-shrink-0`};
        width: 1.25rem;
        font-size: 1.25rem;
        transition: transform 0.2s ease;
    }

    span {
        ${tw`flex-1`};
        white-space: nowrap;
        overflow: hidden;
        display: ${(props) => (props.$collapsed ? 'none' : 'block')};
        font-size: 0.9375rem;
    }

    &:hover {
        ${tw`text-neutral-100`};
        background: rgba(211, 47, 66, 0.12);
        transform: translateX(2px);

        svg {
            transform: scale(1.1);
        }

        &::before {
            height: 60%;
            opacity: 1;
        }
    }

    &.active {
        ${tw`text-white`};
        background: linear-gradient(90deg, rgba(211, 47, 66, 0.2) 0%, rgba(211, 47, 66, 0.1) 100%);
        box-shadow: inset 0 1px 2px rgba(211, 47, 66, 0.2);

        &::before {
            height: 70%;
            opacity: 1;
        }

        svg {
            color: #d32f42;
        }
    }
`;

const MobileOverlay = styled.div<{ $visible: boolean }>`
    ${tw`fixed inset-0 bg-black transition-opacity duration-300`};
    opacity: ${(props) => (props.$visible ? 0.5 : 0)};
    pointer-events: ${(props) => (props.$visible ? 'auto' : 'none')};
    display: none;
    z-index: 50;

    @media (max-width: 768px) {
        display: block;
        top: 3.5rem;
    }
`;

const iconMap: Record<string, any> = {
    Console: faTerminal,
    Files: faFolder,
    Databases: faDatabase,
    Schedules: faClock,
    Users: faUsers,
    Backups: faArchive,
    Network: faNetworkWired,
    Startup: faCog,
    Settings: faCog,
    Activity: faListAlt,
    Account: faUser,
    'API Credentials': faKey,
    'SSH Keys': faFingerprint,
};

interface SidebarNavigationProps {
    serverId?: string;
    serverRoutes?: boolean;
    mobileOpen?: boolean;
    onMobileToggle?: () => void;
    onCollapsedChange?: (collapsed: boolean) => void;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
    serverId,
    serverRoutes = false,
    mobileOpen = false,
    onMobileToggle,
    onCollapsedChange,
}) => {
    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [searchVisible, setSearchVisible] = useState(false);
    const match = useRouteMatch<{ id: string }>();
    const location = useLocation();
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);
    const isServerPage = location.pathname.startsWith('/server/');

    const handleMobileAction = () => {
        if (onMobileToggle) {
            onMobileToggle();
        }
    };

    const handleLinkClick = () => {
        if (isMobile && onMobileToggle) {
            onMobileToggle();
        }
    };

    const handleSearchClick = () => {
        setSearchVisible(true);
        if (onMobileToggle) {
            onMobileToggle();
        }
    };

    const onTriggerLogout = () => {
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (onCollapsedChange) {
            onCollapsedChange(collapsed && !isMobile);
        }
    }, [collapsed, isMobile, onCollapsedChange]);

    const to = (value: string, url = false) => {
        if (!serverRoutes) return value;
        if (value === '/') {
            return url ? match.url : match.path;
        }
        return `${(url ? match.url : match.path).replace(/\/*$/, '')}/${value.replace(/^\/+/, '')}`;
    };

    const currentRoutes = serverRoutes ? routes.server : routes.account;

    const renderRoute = (route: typeof currentRoutes[0], index: number) => {
        if (!route.name) return null;

        const icon = iconMap[route.name] || faCog;
        const path = to(route.path, true);

        const link = (
            <NavLinkStyled
                key={route.path || index}
                to={path}
                exact={route.exact}
                $collapsed={collapsed && !isMobile}
                onClick={handleLinkClick}
            >
                <FontAwesomeIcon icon={icon} />
                <span>{route.name}</span>
            </NavLinkStyled>
        );

        if (serverRoutes && 'permission' in route && route.permission !== null) {
            const permission = route.permission as string | string[];
            return (
                <Can key={route.path || index} action={permission} matchAny>
                    <NavItem>{link}</NavItem>
                </Can>
            );
        }

        return <NavItem key={route.path || index}>{link}</NavItem>;
    };

    return (
        <>
            {searchVisible && (
                <SearchModal appear visible={searchVisible} onDismissed={() => setSearchVisible(false)} />
            )}
            <MobileOverlay $visible={mobileOpen} onClick={onMobileToggle} />
            <SidebarContainer $collapsed={collapsed && !isMobile} $isMobile={isMobile} $mobileOpen={mobileOpen}>
                <NavSection>
                    <NavList>
                        {!serverRoutes && (
                            <NavItem>
                                <NavLinkStyled
                                    to={'/'}
                                    exact
                                    $collapsed={collapsed && !isMobile}
                                    onClick={handleLinkClick}
                                >
                                    <FontAwesomeIcon icon={faHome} />
                                    <span>Dashboard</span>
                                </NavLinkStyled>
                            </NavItem>
                        )}
                        {currentRoutes.filter((route) => !!route.name).map(renderRoute)}
                        {serverRoutes && rootAdmin && (
                            <NavItem>
                                <a
                                    href={`/admin/servers/view/${serverId}`}
                                    target={'_blank'}
                                    rel={'noreferrer'}
                                    onClick={handleLinkClick}
                                    css={tw`flex items-center gap-3 px-4 py-3 text-neutral-300 no-underline transition-all duration-200 relative min-h-[2.75rem] my-0.5 mx-2 rounded-lg font-medium`}
                                >
                                    <FontAwesomeIcon icon={faNetworkWired} css={tw`flex-shrink-0 w-5 text-[1.25rem]`} />
                                    {(!collapsed || isMobile) && (
                                        <span css={tw`flex-1 text-[0.9375rem] whitespace-nowrap overflow-hidden`}>
                                            Admin View
                                        </span>
                                    )}
                                </a>
                            </NavItem>
                        )}
                    </NavList>
                </NavSection>

                {isMobile && (
                    <>
                        <MobileActionsDivider />
                        <MobileActionsSection>
                            <NavList>
                                <NavItem>
                                    <MobileActionButton onClick={handleSearchClick}>
                                        <FontAwesomeIcon icon={faSearch} />
                                        <span>Search</span>
                                    </MobileActionButton>
                                </NavItem>
                                {isServerPage && (
                                    <NavItem>
                                        <MobileActionLink to={'/'} onClick={handleMobileAction}>
                                            <FontAwesomeIcon icon={faLayerGroup} />
                                            <span>Back to Server List</span>
                                        </MobileActionLink>
                                    </NavItem>
                                )}
                                {rootAdmin && (
                                    <NavItem>
                                        <MobileActionAnchor href={'/admin'} onClick={handleMobileAction}>
                                            <FontAwesomeIcon icon={faCog} />
                                            <span>Admin</span>
                                        </MobileActionAnchor>
                                    </NavItem>
                                )}
                                <NavItem>
                                    <MobileActionButton onClick={onTriggerLogout}>
                                        <FontAwesomeIcon icon={faSignOutAlt} />
                                        <span>Sign Out</span>
                                    </MobileActionButton>
                                </NavItem>
                            </NavList>
                        </MobileActionsSection>
                    </>
                )}

                {!isMobile && (
                    <SidebarFooter>
                        <ToggleButton $collapsed={collapsed} onClick={() => setCollapsed(!collapsed)}>
                            <FontAwesomeIcon icon={collapsed ? faChevronRight : faChevronLeft} />
                            <span>{collapsed ? 'Expand' : 'Collapse'}</span>
                        </ToggleButton>
                    </SidebarFooter>
                )}
            </SidebarContainer>
        </>
    );
};

export default SidebarNavigation;
