import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const WebSocketContext = createContext();

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { isAuthenticated,setOnlineList } = useAuth();
  const [messageList, setMessageList] = useState([]);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [whoIsTyping, setWhoIsTyping] = useState("");
  const [updateConversationList, setUpdateConversationList] = useState(false);
  const [received, setReceived] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      const access_token = localStorage.getItem("access_token");
      const token_type = localStorage.getItem("token_type");
      const socket = new WebSocket(
        `ws://127.0.0.1:8000/chat/?token_type=${token_type}&token=${access_token}`
      );

      socket.onopen = () => {
        console.log("Socket is open");
      };

      socket.onmessage = (event) => {
        // console.log("Received message:", event.data);
        const data = JSON.parse(event.data);
        // console.log(data);
        if (data.source === "message_typing") {
          setWhoIsTyping(data.data.username);
          setTypingIndicator(true);
        }
        if (data.source === "online_status") {
          const { online_users } = data.data;
          setOnlineList(online_users);
        }
      };
      socket.onerror = (error) => {
        console.error("Socket error:", error);
      };

      socket.onclose = () => {
        console.log("Socket is closed");
      };

      setSocket(socket);

      // Clean up WebSocket on unmount
      return () => {
        if (socket) {
          socket.close();
        }
      };
    } else {
      // Close the WebSocket connection if the user is not logged in
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.source === "realtime") {
        console.log("m bhi run kr rha hun");
        setMessageList((prevMessages) => [
          {
            message: data.data.message,
            sent_by: data.data.sender,
            timestamp: new Date().toISOString(),
          },
          ...prevMessages,
        ]);
        setTypingIndicator(false);
        setUpdateConversationList((prevState) => !prevState);
        setReceived((prevState) => !prevState);
      }
    };

    if (socket) {
      socket.addEventListener("message", handleMessage);
    }
    return () => {
      // Cleanup function to remove event listener when component unmounts
      if (socket) {
        socket.removeEventListener("message", handleMessage);
      }
    };
  }, [socket]);

  useEffect(() => {
    const animationTimeout = setTimeout(() => {
      const typingTimeout = setTimeout(() => {
        setTypingIndicator(false);
      }, 4000); // Adjust the duration of typing animation as needed
      return () => clearTimeout(typingTimeout);
    }); // Adjust the delay between each typing animation as needed
    return () => clearTimeout(animationTimeout);
  }, [typingIndicator]);

  const fetchUserList = (query) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const message = {
        type: "get_user_list",
        query: query,
      };
      socket.send(JSON.stringify(message));
      return socket; // Return the socket directly
    } else {
      console.error("WebSocket connection not open.");
      return null;
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        fetchUserList,
        messageList,
        setMessageList,
        typingIndicator,
        setTypingIndicator,
        whoIsTyping,
        updateConversationList,
        setUpdateConversationList,
        received,
        page,
        setPage,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
