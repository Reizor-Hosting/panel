import TransferListener from '@/components/server/TransferListener';
import React, { useEffect, useState } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { TopNavigation } from '@/components/NavigationBar';
import SidebarNavigation from '@/components/SidebarNavigation';
import TransitionRouter from '@/TransitionRouter';
import WebsocketHandler from '@/components/server/WebsocketHandler';
import { ServerContext } from '@/state/server';
import Spinner from '@/components/elements/Spinner';
import { NotFound, ServerError } from '@/components/elements/ScreenBlock';
import { httpErrorToHuman } from '@/api/http';
import InstallListener from '@/components/server/InstallListener';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { useLocation } from 'react-router';
import ConflictStateRenderer from '@/components/server/ConflictStateRenderer';
import PermissionRoute from '@/components/elements/PermissionRoute';
import routes from '@/routers/routes';
import tw from 'twin.macro';
import styled from 'styled-components/macro';

const ContentArea = styled.div<{ $sidebarCollapsed?: boolean }>`
    ${tw`transition-all duration-300`};
    margin-top: 3.5rem;
    margin-left: 0;
    padding-top: 1rem;
    padding-left: 1rem;
    padding-right: 1rem;
    padding-bottom: 1rem;
    min-height: calc(100vh - 3.5rem);

    @media (min-width: 640px) {
        padding-top: 1.25rem;
        padding-left: 1.25rem;
        padding-right: 1.25rem;
        padding-bottom: 1.25rem;
    }

    @media (min-width: 769px) {
        margin-top: 4rem;
        min-height: calc(100vh - 4rem);
        margin-left: ${(props) => (props.$sidebarCollapsed ? '4rem' : '16rem')};
        padding-top: 1.5rem;
        padding-left: 2rem;
        padding-right: 2rem;
        padding-bottom: 1.5rem;
    }
`;

export default () => {
    const match = useRouteMatch<{ id: string }>();
    const location = useLocation();

    const [error, setError] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const inConflictState = ServerContext.useStoreState((state) => state.server.inConflictState);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.internalId);
    const getServer = ServerContext.useStoreActions((actions) => actions.server.getServer);
    const clearServerState = ServerContext.useStoreActions((actions) => actions.clearServerState);

    const to = (value: string, url = false) => {
        if (value === '/') {
            return url ? match.url : match.path;
        }
        return `${(url ? match.url : match.path).replace(/\/*$/, '')}/${value.replace(/^\/+/, '')}`;
    };

    useEffect(
        () => () => {
            clearServerState();
        },
        []
    );

    useEffect(() => {
        setError('');

        getServer(match.params.id).catch((error) => {
            console.error(error);
            setError(httpErrorToHuman(error));
        });

        return () => {
            clearServerState();
        };
    }, [match.params.id]);

    return (
        <React.Fragment key={'server-router'}>
            <TopNavigation
                onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
                sidebarCollapsed={sidebarCollapsed}
                hasSidebar={false}
            />
            <SidebarNavigation
                serverRoutes
                serverId={serverId?.toString()}
                mobileOpen={mobileMenuOpen}
                onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
                onCollapsedChange={setSidebarCollapsed}
            />
            {!uuid || !id ? (
                <ContentArea $sidebarCollapsed={sidebarCollapsed}>
                    {error ? <ServerError message={error} /> : <Spinner size={'large'} centered />}
                </ContentArea>
            ) : (
                <ContentArea $sidebarCollapsed={sidebarCollapsed}>
                    <InstallListener />
                    <TransferListener />
                    <WebsocketHandler />
                    {inConflictState &&
                    !location.pathname.endsWith(`/server/${id}`) &&
                    !location.pathname.includes('/settings/gtnh-files') &&
                    !location.pathname.includes('/settings/cosmic-frontiers-files') ? (
                        <ConflictStateRenderer />
                    ) : (
                        <ErrorBoundary>
                            <TransitionRouter>
                                <Switch location={location}>
                                    {routes.server.map(({ path, permission, component: Component }) => (
                                        <PermissionRoute key={path} permission={permission} path={to(path)} exact>
                                            <Spinner.Suspense>
                                                <Component />
                                            </Spinner.Suspense>
                                        </PermissionRoute>
                                    ))}
                                    <Route path={'*'} component={NotFound} />
                                </Switch>
                            </TransitionRouter>
                        </ErrorBoundary>
                    )}
                </ContentArea>
            )}
        </React.Fragment>
    );
};
