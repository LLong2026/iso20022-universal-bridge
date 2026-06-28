import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Orchestrator from './pages/Orchestrator';
import VaultRetrieve from './pages/VaultRetrieve';
import DecryptArtifact from './pages/DecryptArtifact';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import NavBar from '@/components/console/NavBar';
import Argis from './pages/Argis';
import ArgisNavLink from '@/components/argis/ArgisNavLink';
import SecondaryNavBar from '@/components/SecondaryNavBar';
import DIDSetup from './pages/DIDSetup';
import SerialSearch from './pages/SerialSearch';
import ArtifactViewer from './pages/ArtifactViewer';
import Receipt from './pages/Receipt';
import ClaimArtifacts from './pages/ClaimArtifacts';
import BindArtifact from './pages/BindArtifact';
import AgentConsole from './pages/AgentConsole';
import AgentConsoleLink from '@/components/agents/AgentConsoleLink';
import BulkIngest from './pages/BulkIngest';
import BulkIngestNavLink from '@/components/BulkIngestNavLink';
import UniversalBridge from './pages/UniversalBridge';
import UniversalBridgeNavLink from '@/components/bridge/UniversalBridgeNavLink';
import Cover from './pages/Cover';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const isCover = location.pathname === '/';

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <>
    <Routes>
      <Route path="/" element={<Cover />} />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/orchestrator" element={<Orchestrator />} />
      <Route path="/vault" element={<VaultRetrieve />} />
      <Route path="/decrypt" element={<DecryptArtifact />} />
      <Route path="/argis" element={<Argis />} />
      <Route path="/did-setup" element={<DIDSetup />} />
      <Route path="/serial-search" element={<SerialSearch />} />
      <Route path="/artifact-viewer" element={<ArtifactViewer />} />
      <Route path="/receipt" element={<Receipt />} />
      <Route path="/claim-artifacts" element={<ClaimArtifacts />} />
      <Route path="/bind" element={<BindArtifact />} />
      <Route path="/agents" element={<AgentConsole />} />
      <Route path="/bulk-ingest" element={<BulkIngest />} />
      <Route path="/universal-bridge" element={<UniversalBridge />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    {!isCover && (
      <>
        <SecondaryNavBar />
        <ArgisNavLink />
        <BulkIngestNavLink />
        <UniversalBridgeNavLink />
      </>
    )}
    </>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App