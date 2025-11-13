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
    faWrench,
    faDivide,
    faArrowsAlt,
    faServer,
} from '@fortawesome/free-solid-svg-icons';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import Can from '@/components/elements/Can';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import routes, { ServerRouteDefinition } from '@/routers/routes';
import { useLocation, Link } from 'react-router-dom';
import http from '@/api/http';
import SearchModal from '@/components/dashboard/search/SearchModal';

const SidebarContainer = styled.aside<{ $collapsed: boolean; $isMobile: boolean; $mobileOpen?: boolean }>`
    ${tw`fixed left-0 z-40 transition-all duration-300 ease-in-out overflow-hidden flex flex-col`};
    top: 3.5rem;
    height: calc(100vh - 3.5rem);
    width: ${(props) => (props.$collapsed ? '4rem' : '16rem')};
    background: linear-gradient(180deg, rgba(33, 33, 33, 0.95) 0%, rgba(24, 24, 24, 0.98) 100%);
    backdrop-filter: blur(20px) saturate(180%);
    border-right: 1px solid rgba(211, 47, 66, 0.2);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.05), inset -1px 0 0 rgba(211, 47, 66, 0.1);

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
        box-shadow: 4px 0 32px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.05);
    }
`;

const SidebarFooter = styled.div`
    ${tw`absolute bottom-0 left-0 right-0`};
    border-top: 1px solid rgba(211, 47, 66, 0.2);
    background: linear-gradient(180deg, transparent 0%, rgba(33, 33, 33, 0.8) 100%);
    backdrop-filter: blur(10px);
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
`;

const ToggleButton = styled.button<{ $collapsed: boolean }>`
    ${tw`flex items-center justify-center h-12 text-neutral-400 hover:text-neutral-100 relative`};
    background: transparent;
    border: none;
    cursor: pointer;
    width: 100%;
    padding: 0;
    gap: 0.75rem;
    position: relative;
    border-radius: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(211, 47, 66, 0.15);
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    &::after {
        content: '';
        position: absolute;
        left: -100%;
        top: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(211, 47, 66, 0.15), transparent);
        transition: left 0.5s ease;
    }

    &:hover {
        ${tw`text-white`};
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(211, 47, 66, 0.2);

        &::before {
            opacity: 1;
        }

        &::after {
            left: 100%;
        }
    }

    &:active {
        transform: translateY(0) scale(0.98);
    }

    svg {
        ${tw`flex-shrink-0 absolute`};
        width: 1rem;
        font-size: 1rem;
        left: ${(props) => (props.$collapsed ? '50%' : '1rem')};
        transform: ${(props) => (props.$collapsed ? 'translateX(-50%)' : 'none')};
        transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s ease;
    }

    span {
        ${tw`flex-1 text-left`};
        white-space: nowrap;
        overflow: hidden;
        display: ${(props) => (props.$collapsed ? 'none' : 'block')};
        font-weight: 500;
        margin-left: ${(props) => (props.$collapsed ? '0' : '2.5rem')};
        transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
        opacity: ${(props) => (props.$collapsed ? 0 : 1)};
    }
`;

const NavSection = styled.div`
    ${tw`py-2 flex-1 overflow-y-auto`};
`;

const MobileActionsDivider = styled.div`
    display: none;
    margin: 1.5rem 1rem 1rem 1rem;
    border-top: 1px solid rgba(211, 47, 66, 0.2);
    position: relative;

    &::before {
        content: '';
        position: absolute;
        left: 0;
        top: -1px;
        width: 4rem;
        height: 2px;
        background: linear-gradient(90deg, rgba(211, 47, 66, 0.5) 0%, rgba(211, 47, 66, 0.2) 50%, transparent 100%);
        box-shadow: 0 0 8px rgba(211, 47, 66, 0.3);
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
    ${tw`flex items-center gap-3 px-4 py-3 text-neutral-300 no-underline relative w-full text-left`};
    font-weight: 500;
    position: relative;
    min-height: 2.75rem;
    margin: 0.125rem 0.5rem;
    border-radius: 0.75rem;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        left: -100%;
        top: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(211, 47, 66, 0.15), transparent);
        transition: left 0.4s ease;
    }

    svg {
        ${tw`flex-shrink-0 relative z-10`};
        width: 1.25rem;
        font-size: 1.25rem;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s ease;
    }

    span {
        ${tw`flex-1 relative z-10`};
        white-space: nowrap;
        overflow: hidden;
        font-size: 0.9375rem;
        transition: color 0.3s ease;
    }

    &:hover {
        ${tw`text-white`};
        background: rgba(211, 47, 66, 0.15);
        transform: translateX(4px);
        box-shadow: 0 4px 12px rgba(211, 47, 66, 0.2);

        &::before {
            left: 100%;
        }

        svg {
            transform: scale(1.1);
            color: #d32f42;
        }
    }

    &:active {
        transform: translateX(2px) scale(0.98);
    }
`;

const MobileActionLink = styled(Link)`
    ${tw`flex items-center gap-3 px-4 py-3 text-neutral-300 no-underline relative`};
    font-weight: 500;
    position: relative;
    min-height: 2.75rem;
    margin: 0.125rem 0.5rem;
    border-radius: 0.75rem;
    border: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        left: -100%;
        top: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(211, 47, 66, 0.15), transparent);
        transition: left 0.4s ease;
    }

    svg {
        ${tw`flex-shrink-0 relative z-10`};
        width: 1.25rem;
        font-size: 1.25rem;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s ease;
    }

    span {
        ${tw`flex-1 relative z-10`};
        white-space: nowrap;
        overflow: hidden;
        font-size: 0.9375rem;
        transition: color 0.3s ease;
    }

    &:hover {
        ${tw`text-white`};
        background: rgba(211, 47, 66, 0.15);
        transform: translateX(4px);
        box-shadow: 0 4px 12px rgba(211, 47, 66, 0.2);

        &::before {
            left: 100%;
        }

        svg {
            transform: scale(1.1);
            color: #d32f42;
        }
    }

    &:active {
        transform: translateX(2px) scale(0.98);
    }
`;

const MobileActionAnchor = styled.a`
    ${tw`flex items-center gap-3 px-4 py-3 text-neutral-300 no-underline relative`};
    font-weight: 500;
    position: relative;
    min-height: 2.75rem;
    margin: 0.125rem 0.5rem;
    border-radius: 0.75rem;
    border: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        left: -100%;
        top: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(211, 47, 66, 0.15), transparent);
        transition: left 0.4s ease;
    }

    svg {
        ${tw`flex-shrink-0 relative z-10`};
        width: 1.25rem;
        font-size: 1.25rem;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s ease;
    }

    span {
        ${tw`flex-1 relative z-10`};
        white-space: nowrap;
        overflow: hidden;
        font-size: 0.9375rem;
        transition: color 0.3s ease;
    }

    &:hover {
        ${tw`text-white`};
        background: rgba(211, 47, 66, 0.15);
        transform: translateX(4px);
        box-shadow: 0 4px 12px rgba(211, 47, 66, 0.2);

        &::before {
            left: 100%;
        }

        svg {
            transform: scale(1.1);
            color: #d32f42;
        }
    }

    &:active {
        transform: translateX(2px) scale(0.98);
    }
`;

const NavLinkStyled = styled(NavLink)<{ $collapsed: boolean }>`
    ${tw`flex items-center gap-3 px-4 py-3 text-neutral-300 no-underline relative`};
    font-weight: 500;
    position: relative;
    min-height: 2.75rem;
    margin: 0.125rem 0.5rem;
    border-radius: 0.75rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;

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
        transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
        box-shadow: 0 0 8px rgba(211, 47, 66, 0.5);
    }

    &::after {
        content: '';
        position: absolute;
        left: -100%;
        top: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(211, 47, 66, 0.15), transparent);
        transition: left 0.4s ease;
        z-index: 0;
    }

    svg {
        ${tw`flex-shrink-0 relative z-10`};
        width: 1.25rem;
        font-size: 1.25rem;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s ease;
    }

    span {
        ${tw`flex-1 relative z-10`};
        white-space: nowrap;
        overflow: hidden;
        display: ${(props) => (props.$collapsed ? 'none' : 'block')};
        font-size: 0.9375rem;
        transition: color 0.3s ease;
    }

    &:hover {
        ${tw`text-white`};
        background: rgba(211, 47, 66, 0.15);
        transform: translateX(4px);
        box-shadow: 0 4px 12px rgba(211, 47, 66, 0.2);

        &::before {
            height: 65%;
            opacity: 1;
        }

        &::after {
            left: 100%;
        }

        svg {
            transform: scale(1.1);
            color: #d32f42;
        }
    }

    &.active {
        ${tw`text-white`};
        background: linear-gradient(90deg, rgba(211, 47, 66, 0.25) 0%, rgba(211, 47, 66, 0.15) 100%);
        box-shadow: inset 0 1px 2px rgba(211, 47, 66, 0.3), 0 4px 12px rgba(211, 47, 66, 0.15);
        transform: translateX(2px);

        &::before {
            height: 75%;
            opacity: 1;
        }

        svg {
            color: #d32f42;
            transform: scale(1.05);
        }
    }
`;

const AdminViewLink = styled.a<{ $collapsed: boolean }>`
    ${tw`flex items-center gap-3 px-4 py-3 text-neutral-300 no-underline relative`};
    font-weight: 500;
    position: relative;
    min-height: 2.75rem;
    margin: 0.125rem 0.5rem;
    border-radius: 0.75rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;

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
        transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
        box-shadow: 0 0 8px rgba(211, 47, 66, 0.5);
    }

    &::after {
        content: '';
        position: absolute;
        left: -100%;
        top: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(211, 47, 66, 0.15), transparent);
        transition: left 0.4s ease;
        z-index: 0;
    }

    svg {
        ${tw`flex-shrink-0 relative z-10`};
        width: 1.25rem;
        font-size: 1.25rem;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s ease;
    }

    span {
        ${tw`flex-1 relative z-10`};
        white-space: nowrap;
        overflow: hidden;
        display: ${(props) => (props.$collapsed ? 'none' : 'block')};
        font-size: 0.9375rem;
        transition: color 0.3s ease;
    }

    &:hover {
        ${tw`text-white`};
        background: rgba(211, 47, 66, 0.15);
        transform: translateX(4px);
        box-shadow: 0 4px 12px rgba(211, 47, 66, 0.2);

        &::before {
            height: 65%;
            opacity: 1;
        }

        &::after {
            left: 100%;
        }

        svg {
            transform: scale(1.1);
            color: #d32f42;
        }
    }

    &:active {
        transform: translateX(2px) scale(0.98);
    }
`;

const MobileOverlay = styled.div<{ $visible: boolean }>`
    ${tw`fixed inset-0 bg-black transition-opacity duration-300`};
    opacity: ${(props) => (props.$visible ? 0.6 : 0)};
    pointer-events: ${(props) => (props.$visible ? 'auto' : 'none')};
    display: none;
    z-index: 50;
    backdrop-filter: ${(props) => (props.$visible ? 'blur(4px)' : 'none')};
    transition: opacity 0.3s ease, backdrop-filter 0.3s ease;

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
    Startup: faWrench,
    Settings: faCog,
    Activity: faListAlt,
    Account: faUser,
    Splitter: faServer,
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
        if (!serverRoutes) {
            // For account routes, prefix with /account
            if (value === '/') {
                return '/account';
            }
            return `/account${value}`;
        }
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

        if (serverRoutes) {
            const serverRoute = route as ServerRouteDefinition;
            if (serverRoute.permission !== null && serverRoute.permission !== undefined) {
                const permission = serverRoute.permission;
                return (
                    <Can key={route.path || index} action={permission} matchAny>
                        <NavItem>{link}</NavItem>
                    </Can>
                );
            }
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
                                <AdminViewLink
                                    href={`/admin/servers/view/${serverId}`}
                                    target={'_blank'}
                                    rel={'noreferrer'}
                                    onClick={handleLinkClick}
                                    $collapsed={collapsed && !isMobile}
                                >
                                    <FontAwesomeIcon icon={faNetworkWired} />
                                    <span>Admin View</span>
                                </AdminViewLink>
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
