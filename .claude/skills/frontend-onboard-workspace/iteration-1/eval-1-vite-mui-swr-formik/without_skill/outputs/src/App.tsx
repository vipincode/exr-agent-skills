import { Routes, Route } from "react-router-dom";
import UsersPage from "./pages/UsersPage";
import LoginPage from "./pages/LoginPage";
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<UsersPage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}
