import { NostrProvider } from "./context/NostrContext";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { FeedPage } from "./pages/FeedPage";
import { SettingsPage } from "./pages/SettingsPage";
import { Navigation } from "./components/Navigation";
import { Box, Flex } from "@chakra-ui/react";

function App() {
  return (
    <NostrProvider>
      <BrowserRouter>
        <Flex direction='column' minH='100vh'>
          <Navigation />
          <Box as='main' pt='60px' flex='1'>
            <Routes>
              <Route path='/login' element={<LoginPage />} />
              <Route path='/feed' element={<FeedPage />} />
              <Route path='/settings' element={<SettingsPage />} />
              <Route path='/' element={<Navigate to='/login' replace />} />
            </Routes>
          </Box>
        </Flex>
      </BrowserRouter>
    </NostrProvider>
  );
}

export default App;
