import { NostrProvider } from "./context/NostrContext";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { FeedPage } from "./pages/FeedPage";
import { SettingsPage } from "./pages/SettingsPage";
import { Navigation } from "./components/Navigation";
import "./App.css";

function App() {
  return (
    <NostrProvider>
      <BrowserRouter>
        <div className='app'>
          <Navigation />
          <main className='main-content'>
            <Routes>
              <Route path='/login' element={<LoginPage />} />
              <Route path='/feed' element={<FeedPage />} />
              <Route path='/settings' element={<SettingsPage />} />
              <Route path='/' element={<Navigate to='/login' replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </NostrProvider>
  );
}

export default App;
