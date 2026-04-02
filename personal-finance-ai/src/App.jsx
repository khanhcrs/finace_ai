import { Routes, Route } from 'react-router-dom';

import MainLayout from './Layout/MainLayout';
import HomeScreen from './screen/HomeScreen';
import TransactionsScreen from './screen/TransactionsScreen';
import StatsScreen from './screen/StatsScreen';
import LoginScreen from './screen/LoginScreen';
import SettingsScreen from './screen/SettingsScreen';
// import RegisterScreen from './screen/RegisterScreen';

import { TransactionProvider } from './contexts/TransactionContext';
import { SettingsProvider } from './contexts/SettingsContext';

function App() {
  return (
    <SettingsProvider>
      <TransactionProvider>
        <Routes>

          <Route path="/login" element={<LoginScreen />} />
          {/* <Route path="/register" element={<RegisterScreen />} /> */}

          <Route path="/*" element={
            <MainLayout>
              <Routes>
                <Route path="/" element={<HomeScreen />} />
                <Route path="/transactions" element={<TransactionsScreen />} />
                <Route path="/stats" element={<StatsScreen />} />
                <Route path="/settings" element={<SettingsScreen />} />
              </Routes>
            </MainLayout>
          } />

        </Routes>
      </TransactionProvider>
    </SettingsProvider>
  );
}

export default App;