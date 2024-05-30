import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import Signup from "./components/Signup";
import ForgetPassword from "./components/ForgetPassword"; 
import PasswordResetPage from "./components/PasswordReset";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./context/PrivateRoute";
import { WebSocketProvider } from './context/WebSocketContext';
export default function App() {
  return (
      <AuthProvider>
        <WebSocketProvider>
        <Router>
          <Routes>
            {/* Public routes (accessible without authentication) */}
            <Route path="/signup" element={<Signup />} />
            <Route path="/forget" element={<ForgetPassword />} />
            <Route path="/password-reset/:uid/:token" element={<PasswordResetPage />} /> 

            {/* Protected routes (require authentication) */}
            <Route path="/dashboard" element={<PrivateRoute />}>
              <Route index element={<Dashboard />} />
            </Route>

            {/* Default route (redirects to login if not authenticated) */}
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </Router>
        </WebSocketProvider>
      </AuthProvider>
  );
}
