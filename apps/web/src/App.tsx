import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { Feed } from "./pages/Feed";
import { Surf } from "./pages/Surf";
import { FeedDetail } from "./pages/FeedDetail";
import Login from "./pages/Login";
import Callback from "./pages/Callback";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/callback" element={<Callback />} />
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <Feed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feed/:id"
          element={
            <ProtectedRoute>
              <FeedDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/surf"
          element={
            <ProtectedRoute>
              <Surf />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
