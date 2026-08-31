import { Routes, Route, useLocation } from "react-router-dom";
import TapPage from "./pages/TapPage";
import VaultPage from "./pages/VaultPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminCardsPage from "./pages/AdminCardsPage";
import NotFoundPage from "./pages/NotFoundPage";

export function App() {
  const location = useLocation();

  return (
    <div key={location.pathname} className="min-h-screen w-full animate-in fade-in zoom-in-[0.99] duration-300">
      <Routes location={location}>
        <Route path="/" element={<TapPage />} />
        <Route path="/vault" element={<VaultPage />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/cards" element={<AdminCardsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;
