import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { TopNavigation } from '@/components/NavigationBar';
import SidebarNavigation from '@/components/SidebarNavigation';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import { NotFound } from '@/components/elements/ScreenBlock';
import TransitionRouter from '@/TransitionRouter';
import { useLocation } from 'react-router';
import Spinner from '@/components/elements/Spinner';
import routes from '@/routers/routes';
import tw from 'twin.macro';
import styled from 'styled-components/macro';

const ContentArea = styled.div<{ $sidebarCollapsed?: boolean; $hasSidebar?: boolean }>`
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
        margin-left: ${(props) => {
            if (!props.$hasSidebar) return '0';
            return props.$sidebarCollapsed ? '4rem' : '16rem';
        }};
        padding-top: 1.5rem;
        padding-left: 2rem;
        padding-right: 2rem;
        padding-bottom: 1.5rem;
    }
`;

export default () => {
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
    const showSidebar = location.pathname.startsWith('/account');

    return (
        <>
            <TopNavigation
                onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
                sidebarCollapsed={showSidebar ? sidebarCollapsed : undefined}
                hasSidebar={showSidebar}
            />
            {showSidebar && (
                <SidebarNavigation
                    serverRoutes={false}
                    mobileOpen={mobileMenuOpen}
                    onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
                    onCollapsedChange={setSidebarCollapsed}
                />
            )}
            <ContentArea $sidebarCollapsed={sidebarCollapsed} $hasSidebar={showSidebar}>
                <TransitionRouter>
                    <React.Suspense fallback={<Spinner centered />}>
                        <Switch location={location}>
                            <Route path={'/'} exact>
                                <DashboardContainer />
                            </Route>
                            {routes.account.map(({ path, component: Component }) => (
                                <Route key={path} path={`/account/${path}`.replace('//', '/')} exact>
                                    <Component />
                                </Route>
                            ))}
                            <Route path={'*'}>
                                <NotFound />
                            </Route>
                        </Switch>
                    </React.Suspense>
                </TransitionRouter>
            </ContentArea>
        </>
    );
};
