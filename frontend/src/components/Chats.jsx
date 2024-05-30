import React, { useState, useEffect, useRef } from "react";
import MainChat from "./MainChat";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocketContext";
import { BiUserX } from "react-icons/bi";
import { MdClose } from "react-icons/md";
import { MdModeEdit } from "react-icons/md";
import { TiTick } from "react-icons/ti";
import Status from "./Status";
const Chats = () => {
  const { userData, onlineList, setUserData,status, setStatus,showAccount,setShowAccount } = useAuth();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [edit, setEdit] = useState(false);
  const editRef = useRef(null);
  const [about,setAbout] = useState('');
  const [prevUser, setPrevUser] = useState(null);

  useEffect(() => {
    if (edit && editRef.current) {
      editRef.current.focus();
    }
  }, [edit]);

  useEffect(() => {
    if (showAccount && socket) {
      socket.send(
        JSON.stringify({
          source: "fetch_profile",
          username: userData.user,
        })
      );
      const fetched_profile = (event) => {
        const data = JSON.parse(event.data);
        if (data.source === "fetch_profile") {
          setAbout(data.data.about);
        }
      };
      if (socket) {
        socket.addEventListener("message", fetched_profile);
      }
    }
  }, [showAccount]);

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const base64Data = reader.result.split(",")[1];
      socket.send(
        JSON.stringify({
          source: "file",
          data: base64Data,
          fileName: selectedFile.name,
        })
      );
    };

    reader.readAsDataURL(selectedFile);
  };

  useEffect(()=>{
    if (socket) {
      socket.addEventListener("message", handleProfilePhoto);
    }
  },[])

  const handleProfilePhoto = (event) => {
    const data = JSON.parse(event.data);
    if (data.source === "profile_updated") {
      if (data.data.username === userData.username) {
        setUserData((prevData) => ({
          ...prevData,
          profilePhoto: `http://127.0.0.1:8000${data.data.thumbnail}`,
        }));
      }
      handleConversationList();
    }
  };

  const {
    fetchUserList,
    socket,
    updateConversationList,
    whoIsTyping,
    typingIndicator,
    setUpdateConversationList,
    setPage,
    page,
    setMessageList,
  } = useWebSocket();
  const [showMainChat, setShowMainChat] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const inputRef = useRef(null);
  const [conversationList, setConversationList] = useState([]);

  const handleImageClick = () => {
    inputRef.current.focus();
  };

  useEffect(() => {
    const handleMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "user_list") {
        setUsers(data.users);
      }
    };

    // Conditionally add event listener based on the query
    if (query) {
      const socket = fetchUserList(query);
      if (socket) {
        socket.addEventListener("message", handleMessage);
      }

      // Cleanup
      return () => {
        if (socket) {
          socket.removeEventListener("message", handleMessage);
        }
      };
    }
  }, [query]);

  const handleConversationList = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({ source: "conversation_list", username: userData.user })
      );
      return socket;
    } else {
      console.error("WebSocket connection not open.");
      return null;
    }
  };
  const submitAbout = () => {
    socket.send(
      JSON.stringify({
        source: "update_about",
        about: about,
      })
    );
  };
  useEffect(() => {
    const socket = handleConversationList();

    if (socket) {
      socket.addEventListener("message", handleConversation);
    }
    // Cleanup
    return () => {
      if (socket) {
        socket.removeEventListener("message", handleConversation);
      }
    };
  }, [updateConversationList]);

  const handleConversation = (event) => {
    const data = JSON.parse(event.data);
    if (data.source === "conversation_list") {
      setConversationList(data.data);
    }
  };
  return (
    <div className="flex flex-1 ">
      <div className="min-w-80 max-w-80 h-screen flex flex-col  bg-[rgb(247,245,244)] shadow-2xl">
        <div className="w-full  h-24 flex  items-center">
          <div className="m-5 flex">
            <div
              className="m-2 mr-5 flex justify-center items-center"
            >
              <img className="absolute" src="./assets/ellipse.png" alt="" />
              <img
                src={userData ? userData.profilePhoto : null}
                className="rounded-full max-w-16 max-h-16"
                alt="photo"
              />
            </div>
            <div className="flex flex-col p-5">
              <span className="font-bold text-xl truncate font-inter">
                {userData ? userData.username : "username"}
              </span>
              <span className="font-light text-sm truncate font-inter text-gray-400 hover:text-gray-700 cursor-pointer" 
              onClick={() => setShowAccount(!showAccount)}
              
              >View your profile</span>
            </div>
          </div>
        </div>
        <div className="p-3 h-full  flex flex-col overflow-hidden">
          {/* <div className="flex m-2 justify-between items-center">
            <div>
              <h2 className="font-inter">Messages</h2>
            </div>
            <div className=" flex gap-3">
              <div>
                <img src="./assets/edit.png" alt="edit" />
              </div>
              <div>
                <img src="./assets/heart.png" alt="edit" />
              </div>
            </div>
          </div> */}
          <div className="relative">
            <span
              className="absolute m-1 p-1 right-0 cursor-pointer"
              onClick={handleImageClick}
            >
              <img src="./assets/searchicon.png" alt="" />
            </span>
            <input
              type="text"
              ref={inputRef}
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="rounded-md w-full py-2 border-none focus:outline-none focus:ring-0 p-2"
            />
          </div>
          {query ? (
            users != "" ? (
              <ul>
                {users.map((user) => (
                  <li key={user.id}>
                    <div
                      className="flex mt-5 cursor-pointer shadow-md rounded-md"
                      onClick={() => {
                        setShowMainChat(true);
                        setPage(0);
                        if (user !== prevUser) {
                          setSelectedUser(user);
                          setMessageList([]);
                          setPrevUser(user);
                        }
                        setQuery("")
                        setShowAccount(false);
                      }}
                    >
                      {user.thumbnail_url ? (
                        <img
                          src={`http://127.0.0.1:8000${user.thumbnail_url}`}
                          alt="profile_photo"
                          className="w-16 h-16 rounded-full"
                        />
                      ) : (
                        <img
                          src={`http://127.0.0.1:8000/media/avatars/blank.png`}
                          alt="profile_photo"
                          className="w-16 h-16 rounded-full"
                        />
                      )}

                      <span className="p-2 font-inter font-semibold">
                        {user.username}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className=" flex flex-col justify-center items-center  h-screen">
                <BiUserX className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
                <p className="text-gray-400 dark:text-gray-200">
                  No User Found
                </p>
              </div>
            )
          ) : (
            <div className="m-1 mt-5 gap-1 overflow-y-scroll no-scrollbar">
              {conversationList.map((person, index) => {
                const formatedTimeString = new Date(person.last_message.time);
                const formattedTime = formatedTimeString.toLocaleString(
                  "en-US",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  }
                );
                const isOnline = onlineList.some(
                  (user) => user === person.username
                );
                return (
                  <div
                    key={index}
                    className="flex pb-4 mt-5 cursor-pointer shadow-md rounded-md "
                    onClick={() => {
                      setShowMainChat(true);
                      setPage(0);
                      setSelectedUser(person);
                      setMessageList([]);
                      setShowAccount(false);
                      setStatus(false);
                    }}
                  >
                    <div className=" mr-5 flex justify-center items-center">
                      {person.thumbnail_url ? (
                        <>
                          {isOnline ? (
                            <div className="border-[3px]  border-green-500 rounded-full p-1">
                              <img
                                src={`http://127.0.0.1:8000${person.thumbnail_url}`}
                                alt="profile_photo"
                                className="w-16 h-16 rounded-full"
                              />
                            </div>
                          ) : (
                            <img
                              src={`http://127.0.0.1:8000${person.thumbnail_url}`}
                              alt="profile_photo"
                              className="w-16 h-16 rounded-full"
                            />
                          )}
                        </>
                      ) : isOnline ? (
                        <div className="border-[3px]  border-green-500 rounded-full p-1">
                          <img
                            className="w-16 h-16 rounded-full"
                            src={`http://127.0.0.1:8000/media/avatars/blank.png`}
                            alt="profile_photo"
                          />
                        </div>
                      ) : (
                        <img
                          className="w-16 h-16 rounded-full"
                          src={`http://127.0.0.1:8000/media/avatars/blank.png`}
                          alt="profile_photo"
                        />
                      )}
                    </div>
                    <div className="flex justify-between flex-1 ml-2">
                      <div className="font-inter font-semibold flex flex-col">
                        <span>{person.username}</span>
                        <div className="font-semibold text-gray-800 text-sm">
                          {typingIndicator &&
                          whoIsTyping === person.username &&
                          person.username != userData.user ? (
                            "is typing..."
                          ) : (
                            <></>
                          )}
                        </div>
                        <span
                          className={`text-[#A19791] text-sm ${
                            person.unread_count > 0
                              ? "font-semibold text-black"
                              : "font-normal"
                          }`}
                        >
                          {person.last_message.text
                            ? `${person.last_message.text}`
                            : null}
                        </span>
                      </div>
                      {person.last_message.time ? (
                        <div>
                          <div className=" text-[#A19791]  h-5   pt-2 font-public-sans text-xs">
                            {formattedTime}
                          </div>
                          {person.unread_count > 0 ? (
                            <div className="bg-[#FF731D] mt-4 text-white w-5 h-5 rounded-full flex items-center justify-center self-center font-public-sans text-xs">
                              {person.unread_count}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <></>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {showAccount ? (
        <div className=" w-96  ">
          <div className="flex p-6 flex-row bg-gray-400 drop-shadow-2xl justify-between">
            <p className="text-lg font-semibold text-white">Profile</p>
            <MdClose
              className="text-white w-8 h-8 cursor-pointer"
              onClick={() => setShowAccount(false)}
            />
          </div>
          <div className="flex justify-center p-5">
            <label
              htmlFor="profilePhotoUpload"
              className="cursor-pointer relative"
            >
              <img
                src={userData ? userData.profilePhoto : null}
                className="rounded-full w-48 h-48"
                alt="photo"
              />
              <input
                type="file"
                id="profilePhotoUpload"
                className="hidden"
                onChange={handleFileUpload}
              />

              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 hover:opacity-75 bg-black bg-opacity-50 rounded-full">
                <div className="text-white text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="64"
                    height="64"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                    className="h-12 w-12 mx-auto"
                  >
                    <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" />
                    <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1m9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0" />
                  </svg>

                  <p>Change Profile Photo</p>
                </div>
              </div>
            </label>
          </div>
          <div className="p-5 text-gray-700  ">
            <p className="font-semibold">About</p>
            <div className="flex flex-row mt-5">
              {edit ? (
                <input
                  type="text"
                  className="text-black border-none focus:outline-none w-full active:outline-none rounded bg-transparent"
                  ref={editRef}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                />
              ) : (
                <div className="w-full">
                  <p className="drop-shadow-2xl">
                    {about ? about : "You have not set your about"}
                  </p>
                </div>
              )}

              <div className=" self-center">
                {edit ? (
                  <TiTick
                    className="  w-8 h-8 mx-2 text-gray-400 cursor-pointer"
                    onClick={() => {
                      setEdit(!edit);
                      submitAbout();
                    }}
                  />
                ) : (
                  <MdModeEdit
                    className="  w-8 h-8 mx-2 text-gray-400 cursor-pointer"
                    onClick={() => {
                      setEdit(!edit);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
        {status ? <Status/>:null}
          {showMainChat && selectedUser ? (
            <MainChat user={selectedUser} />
          ) : (
            <div className="flex flex-col items-center w-full">
              <img
                src="./assets/chatbackground-removebg-preview.png"
                className="w-[50%] mt-32"
                alt="Image"
              />
              <p className="max-w-[80%] font-semibold text-center text-lg text-gray-700">
                Discover new conversations and reconnect with friends! Open
                chats from the left to start chatting and stay connected.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Chats;
