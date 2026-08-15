import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Contexts
import { UserProvider } from './contexts/UserContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import { LeagueProvider } from './contexts/LeagueContext';

// Pages
import AuthPage from './pages/AuthPage';
import Error404 from './pages/Error404';
import TennisLayout from './pages/tennis/Layout';
import TennisHome from './pages/tennis/Home';
import TennisLadder from './pages/tennis/Ladder';
import TennisDraw from './pages/tennis/Draw';
import TennisResults from './pages/tennis/Results';
import TennisTeams from './pages/tennis/Teams';
import TennisAdmin from './pages/tennis/Admin';

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/" element={<TennisLayout />}>
        <Route index element={<TennisHome />} />
        <Route path="ladder" element={<TennisLadder />} />
        <Route path="draw" element={<TennisDraw />} />
        <Route path="results" element={<TennisResults />} />
        <Route path="teams" element={<TennisTeams />} />
        <Route path="admin" element={<TennisAdmin />} />
      </Route>
      <Route path="*" element={<Error404 />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <SnackbarProvider>
        <UserProvider>
          <LeagueProvider>
            <AppContent />
          </LeagueProvider>
        </UserProvider>
      </SnackbarProvider>
    </Router>
  );
}

export default App;
