// File: src/App.jsx
import HomeScreen from './screen/HomeScreen';
import MainLayout from './Layout/MainLayout';

function App() {
  return (
    // Gọi thẳng component HomeScreen ra đây
    <MainLayout>
      <HomeScreen />
    </MainLayout>
  );
}

export default App;