import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { MmlPaletteProvider } from '@/lib/mmlPalette';
import MmlLayout from '@/components/mml/MmlLayout';
import Home from '@/pages/Home';
import Plugins from '@/pages/Plugins';
import Build from '@/pages/Build';
import Profiles from '@/pages/Profiles';
import Settings from '@/pages/Settings';
import Placeholder from '@/pages/Placeholder';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<MmlLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/plugins" element={<Plugins />} />
        <Route path="/build" element={<Build />} />
        <Route path="/profiles" element={<Profiles />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/save-sync" element={<Placeholder title="Save Sync" />} />
        <Route path="/links" element={<Placeholder title="Links and Credits" />} />
        <Route path="/play" element={<Placeholder title="Play Game" />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <MmlPaletteProvider>
            <AuthenticatedApp />
          </MmlPaletteProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App