import { Routes, Route } from 'react-router-dom';

import MainLayout from './Layout/MainLayout';
import HomeScreen from './screen/HomeScreen';
import TransactionsScreen from './screen/TransactionsScreen';
import StatsScreen from './screen/StatsScreen';
import LoginScreen from './screen/LoginScreen'; // 1. Import trang Đăng nhập
import { TransactionProvider } from './contexts/TransactionContext';

function SettingsScreen() {
  return <div className="p-8"><h1 className="text-3xl font-bold">Trang Cài đặt</h1></div>;
}

function App() {
  return (
    <TransactionProvider>
      <Routes>

        {/* ĐƯỜNG DẪN 1: Màn hình Đăng nhập (Đứng độc lập, không có Sidebar) */}
        <Route path="/login" element={<LoginScreen />} />

        {/* ĐƯỜNG DẪN 2: Các màn hình bên trong (Được bọc bởi Layout 3 cột) */}
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
  );
}

export default App;