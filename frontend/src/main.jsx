import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
// import { UserProvider } from './context/UserContext';

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_CLIENT_ID}>
    {/* <React.StrictMode> */}
    {/* <UserProvider> */}
    <App />
    {/* </UserProvider> */}
    {/* </React.StrictMode> */}
  </GoogleOAuthProvider>
);
