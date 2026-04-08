import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import MainLayout from './Layout/MainLayout';
import HomeScreen from './screen/HomeScreen';
import TransactionsScreen from './screen/TransactionsScreen';
import StatsScreen from './screen/StatsScreen';
import LoginScreen from './screen/LoginScreen';
import SettingsScreen from './screen/SettingsScreen';
// import RegisterScreen from './screen/RegisterScreen';

import { TransactionProvider } from './contexts/TransactionContext';
import { SettingsProvider } from './contexts/SettingsContext';

// Auth Guard Component
const ProtectedRoute = ({ children }) => {
  const userId = localStorage.getItem('finance_user_id');
  if (!userId) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <SettingsProvider>
      <TransactionProvider>
        <Toaster position="top-center" reverseOrder={false} />
        <Routes>

          <Route path="/login" element={<LoginScreen />} />
          {/* <Route path="/register" element={<RegisterScreen />} /> */}

          <Route path="/*" element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<HomeScreen />} />
                  <Route path="/transactions" element={<TransactionsScreen />} />
                  <Route path="/stats" element={<StatsScreen />} />
                  <Route path="/settings" element={<SettingsScreen />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          } />

        </Routes>
      </TransactionProvider>
    </SettingsProvider>
  );
}

export default App;