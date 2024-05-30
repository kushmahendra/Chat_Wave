import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("access_token")
  );
  const [onlineList, setOnlineList] = useState([]);
  const [status, setStatus] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showAccount, setShowAccount] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (token) {
          const response = await axios.get("http://localhost:8000", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          // console.log(response)
          setUserData({
            username: response.data.username,
            profilePhoto: response.data.avatar_url,
            user:response.data.user
            //   // ... other user data
          });

          login();
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // Token is invalid or expired, attempt refresh
          console.log(
            "Token is expired or invalid, trying to refresh the token"
          );
          await handleTokenRefresh();
        } else {
          console.error("Error during initial fetch:", error);
          logout();
        }
      }
    };

    fetchData();
  }, [isAuthenticated]);

  const login = () => {
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem("refresh_token");
      const access_token = localStorage.getItem("access_token");
      if (token) {
        const response = await axios.post(
          "http://localhost:8000/logout/",
          {
            refresh_token: token,
          },
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status == 205) {
          localStorage.clear();
          setIsAuthenticated(false);
        }
      } else {
        localStorage.clear();
        console.error("Logout failed");
      }
    } catch (error) {
      localStorage.clear();
      setIsAuthenticated(false);
      console.error("Error during logout:", error);
    }
  };

  const handleTokenRefresh = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/token/refresh/",
        {
          refresh: localStorage.getItem("refresh_token"),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${response.data["access"]}`;
        localStorage.setItem("access_token", response.data.access);
        localStorage.setItem("refresh_token", response.data.refresh);
        console.log("Token refreshed successfully");
        login(); // Login after successful token refresh
      }
    } catch (refreshError) {
      console.error("Error refreshing token:", refreshError);
      logout(); // Log out if token refresh fails
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, userData,setUserData,onlineList,setOnlineList,status,setStatus,showAccount,setShowAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
