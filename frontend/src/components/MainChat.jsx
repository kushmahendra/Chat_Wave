import React, { useState, useEffect, useRef } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import { useAuth } from "../context/AuthContext";
import "../index.css";
import ClipLoader from "react-spinners/ClipLoader";
import { MdClose } from "react-icons/md";
import { CSSTransition } from "react-transition-group";
import axios from "axios";
import { SiGoogletranslate } from "react-icons/si";
import { HiDotsVertical } from "react-icons/hi";
import { Button } from "flowbite-react";

const MainChat = React.memo(({ user }) => {
  const [message, setMessage] = useState("");
  const [firstLoad, setFirstLoad] = useState(true);
  const [sent, setSent] = useState(false);
  const [profile, setProfile] = useState(false);
  const [about, setAbout] = useState("");
  const [languageToTranslate, setLanguageToTranslate] = useState({
    code: "en",
    name: "English",
  });
  const [preference, setPreference] = useState(false);
  const [languages, setLanguages] = useState([]);
  const nodeRef = useRef(null);
  const {
    socket,
    messageList,
    setMessageList,
    typingIndicator,
    whoIsTyping,
    setUpdateConversationList,
    received,
    page,
    setPage,
  } = useWebSocket();
  const { userData, onlineList } = useAuth();
  const [hasMoreData, setHasMore] = useState(true);
  const chatContainerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [languagePanel, setLanguagePanel] = useState(false);
  const receivingRef = useRef(null);
  const [loadingTranslation, setloadingTranslation] = useState({});

  const loadLanguages = async () => {
    try {
      let response = await axios.get("http://127.0.0.1:5000/languages");
      const languageData = response.data;
      const extractedLanguages = languageData.map((lang) => ({
        code: lang.code,
        name: lang.name,
      }));

      setLanguages(extractedLanguages);
    } catch (error) {
      console.log("Error fetching Language List: ", error);
    }
  };

  const translateText = async (message, index) => {
    setloadingTranslation((prevLoading) => ({ ...prevLoading, [index]: true }));
    try {
      const response = await axios.post("http://127.0.0.1:5000/translate", {
        q: message,
        source: "auto",
        target: languageToTranslate.code,
        format: "text",
      });

      const newMessages = [...messageList];
      newMessages[index] = {
        ...newMessages[index],
        translatedText: response.data.translatedText,
      };
      setMessageList(newMessages);
    } catch (error) {
      console.error("Error translating text:", error);
    } finally {
      setloadingTranslation((prevLoading) => ({
        ...prevLoading,
        [index]: false,
      })); // Reset loading state for the specific message
    }
  };

  const handleInfiniteScroll = () => {
    setFirstLoad(false);
    if (hasMoreData) {
      const chatContainer = chatContainerRef.current;
      if (chatContainer.scrollTop == 0 && messageList.length > 0) {
        setLoading(true);
        const nextPage = page + 1;
        setTimeout(() => {
          socket.send(
            JSON.stringify({
              source: "load_more_messages",
              receiver: user.username,
              sender: userData.user,
              last_message_timestamp: messageList[0].timestamp,
              page_number: nextPage,
            })
          );
          setPage(page + 1);
          setLoading(false);
          chatContainer.scrollTop += 100;
        }, 1000);
        console.log("bhej di mene");
      }
    }
  };

  useEffect(() => {
    if (sent) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [sent]);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;

    if (firstLoad && chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
    chatContainer.addEventListener("scroll", handleInfiniteScroll);

    return () => {
      chatContainer.removeEventListener("scroll", handleInfiniteScroll);
    };
  }, [messageList, hasMoreData]);

  const SendMsgComponent = ({ message, time }) => {
    const formatedTimeString = new Date(time);
    const formattedTime = formatedTimeString.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return (
      <div>
        <div className="flex-row-reverse flex max-w-full">
          <div className="flex-row-reverse flex">
            {/* <span className="font-inter font-semibold m-1 mx-2">You</span> */}
          </div>

          <div className="max-w-[50%] min-w-40 flex flex-wrap min-h-10 items-center justify-between px-2 text-white font-inter m-2 text-sm bg-[#FF731D] rounded-md">
            {message}
            <span className="font-inter text-xs self-center mx-2 text-[#FFFF]">
              {formattedTime}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const ReceivingMsg = ({
    message,
    time,
    index,
    translatedText,
    loadingTranslation,
  }) => {
    const formatedTimeString = new Date(time);
    const formattedTime = formatedTimeString.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return (
      <div ref={receivingRef}>
        <div className="flex flex-row items-center">
          <div className=" max-w-[40%] inline-block min-h-10 px-2 font-inter m-2 text-sm bg-[#F7F5F4] rounded-md">
            <div className="flex justify-between">
              <div className="flex-wrap items-center py-2 mr-2">
                {" "}
                {translatedText ? translatedText : message}
              </div>
              <div className="flex justify-between items-end">
                <span className="font-inter text-xs text-[#A19791] self-center">
                  {formattedTime}
                </span>
              </div>
            </div>
          </div>
          {loadingTranslation ? (
            <ClipLoader color="#FF731D" />
          ) : (
            <>
              <SiGoogletranslate
                onClick={() => translateText(message, index)}
                className="cursor-pointer w-8 h-8 text-gray-500"
              />
              <p className="text-sm ml-2 text-gray-700">({languageToTranslate.name})</p>
            </>
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    console.log("on changing the user, I am running and page number is", page);
    if (socket && socket.readyState === WebSocket.OPEN && page === 0) {
      setHasMore(true);
      socket.send(
        JSON.stringify({
          source: "get_messages",
          receiver: user.username,
          sender: userData.user,
          page_number: 0,
        })
      );
    }

    const handleMessageList = (event) => {
      const data = JSON.parse(event.data);
      if (
        data.source === "get_messages" ||
        data.source === "load_more_messages"
      ) {
        if (data.data.messages.length === 0) {
          console.log("m nhi bhej rha ab");
          setHasMore(false);
          return;
        }
        if (data.data.receiver === user.username) {
          const newMessages = data.data.messages;
          setMessageList((prevMessages) => [...prevMessages, ...newMessages]);
        }
      }
    };

    if (socket) {
      socket.addEventListener("message", handleMessageList);
    }

    return () => {
      if (socket) {
        socket.removeEventListener("message", handleMessageList);
      }
    };
  }, [user, page]);

  useEffect(() => {
    if (message != "") {
      socket.send(
        JSON.stringify({
          source: "message_typing",
          username: user.username,
        })
      );
    }
  }, [message]);

  useEffect(() => {
    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [received]);

  useEffect(() => {
    if (
      chatContainerRef.current.scrollTop + 32 ==
      chatContainerRef.current.scrollHeight -
        chatContainerRef.current.clientHeight
    ) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [typingIndicator]);

  const sendMessage = () => {
    if (socket && socket.readyState === WebSocket.OPEN && message != "") {
      socket.send(
        JSON.stringify({
          source: "realtime",
          message: message,
          receiver: user.username,
          sender: userData.user,
        })
      );
      // Update message list with the new message
      setMessageList((prevMessages) => [
        {
          message: message,
          sent_by: userData.user,
          timestamp: new Date().toISOString(),
        },
        ...prevMessages,
      ]);
      setMessage("");
      setSent(true);
      setTimeout(() => {
        setSent(false);
      }, 500);

      return socket;
    } else {
      console.error("WebSocket connection not open.");
      return null;
    }
  };

  // Function to handle message_seen
  const handleNewMessage = (sender) => {
    if (user.username === sender) {
      socket.send(
        JSON.stringify({
          source: "message_seen",
          sender: sender,
        })
      );
    }
  };

  useEffect(() => {
    if (userData && socket && socket.readyState === WebSocket.OPEN) {
      handleNewMessage(user.username);
      setUpdateConversationList((prevState) => !prevState);
    }
  }, [messageList]);

  const LanguagePreference = () => {
    return (
      <div className="p-2 bg-white rounded-sm cursor-pointer">
        <p
          onClick={() => {
            loadLanguages();
            setLanguagePanel(true);
          }}
        >
          Language Preference
        </p>
      </div>
    );
  };

  const SelectLanguagePreference = () => {
    return (
      <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="flex flex-col items-center justify-center w-1/2 bg-white rounded-lg p-8">
          <form class="max-w-sm mx-auto">
            <label
              for="countries"
              class="block mb-2 text-sm font-medium text-gray-900 dark:text-white text-center"
            >
              Select your preferred language for translations
            </label>
            <select
              id="countries"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              value={`${languageToTranslate.code},${languageToTranslate.name}`}
              onChange={(event) => {
                const [code, name] = event.target.value.split(",");
                setLanguageToTranslate({ code, name });
              }}
            >
              <option value="" disabled selected>
                Choose a language
              </option>
              {languages.map((lang) => (
                <option key={lang.code} value={`${lang.code},${lang.name}`}>
                  {lang.name}
                </option>
              ))}
            </select>
          </form>
          <div className="flex justify-center gap-4 mt-2">
            <Button
              color="failure"
              className="bg-[#FF731D] px-2 font-semibold"
              onClick={() => {
                setLanguagePanel(false);
                setPreference(false);
              }}
            >
              Ok
            </Button>
            <Button
              color="gray"
              className="text-[#FF731D] font-medium  px-2 "
              onClick={() => {
                setLanguagePanel(false);
                setPreference(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  };
  const isOnline = onlineList.some((person) => person === user.username);
  return (
    <div className="flex-row flex flex-1">
      <div className="  flex-1 flex-col h-screen   flex   ">
        <div className="p-2 flex  h-24 shadow-md">
          <div className="m-2  flex justify-center w-20 h-20 items-center ">
            {user.thumbnail_url ? (
              <>
                {isOnline ? (
                  <div className="border-[3px]  border-green-500 rounded-full p-1">
                    <img
                      src={`http://127.0.0.1:8000${user.thumbnail_url}`}
                      className="w-16 h-16 rounded-full"
                      alt="person_profile"
                    />
                  </div>
                ) : (
                  <img
                    src={`http://127.0.0.1:8000${user.thumbnail_url}`}
                    className="w-16 h-16 rounded-full"
                    alt="person_profile"
                  />
                )}
              </>
            ) : isOnline ? (
              <div className="border-[3px]  border-green-500 rounded-full p-1">
                <img
                  src={`http://127.0.0.1:8000/media/avatars/blank.png`}
                  className="w-16 h-16 rounded-full"
                  alt="person_profile"
                />
              </div>
            ) : (
              <img
                src={`http://127.0.0.1:8000/media/avatars/blank.png`}
                className="w-16 h-16 rounded-full"
                alt="person_profile"
              />
            )}
          </div>
          <div className=" flex-col p-5">
            <span className="font-bold text-xl truncate font-inter">
              {user.username}
            </span>
            <div
              className="font-light text-sm truncate font-inter text-gray-400 hover:text-gray-700 cursor-pointer"
              onClick={() => {
                socket.send(
                  JSON.stringify({
                    source: "fetch_profile",
                    username: user.username,
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
                setProfile(true);
              }}
            >
              View Profile
            </div>
            <div className="text-gray-800 font-semibold text-sm truncate font-inter ">
              {typingIndicator &&
              whoIsTyping === user.username &&
              userData.user != user.username ? (
                "is typing..."
              ) : (
                <></>
              )}
            </div>
          </div>
          <div className="self-center ml-auto">
            <HiDotsVertical
              className="self-center ml-auto w-8 h-8 mr-5 text-gray-600 cursor-pointer"
              onClick={() => setPreference(!preference)}
            />
            {preference && <LanguagePreference />}
          </div>
        </div>
        <div
          className="flex flex-col overflow-y-auto flex-grow  "
          ref={chatContainerRef}
        >
          <div className="    flex-col-reverse flex ">
            {/* <div className="p-2 h-full flex flex-col justify-between"> */}
            {messageList ? (
              <>
                {messageList.map((item, index) => {
                  return item.sent_by === user.username ? (
                    <ReceivingMsg
                      key={index}
                      message={item.message}
                      time={item.timestamp}
                      index={index}
                      translatedText={item.translatedText}
                      loadingTranslation={loadingTranslation[index]}
                    />
                  ) : (
                    <SendMsgComponent
                      key={index}
                      message={item.message}
                      time={item.timestamp}
                    />
                  );
                })}
              </>
            ) : (
              <></>
            )}
            {loading && hasMoreData ? (
              <div className="text-center flex  justify-center m-5">
                <ClipLoader color="#FF731D" />
              </div>
            ) : (
              <>
                <p className="text-center text-gray-600 font-semibold">
                  {!hasMoreData && "No more messages to load"}
                </p>
              </>
            )}
          </div>
          <div className="flex flex-row">
            {typingIndicator &&
            whoIsTyping === user.username &&
            userData.user != user.username ? (
              <MessageTypingAnimation />
            ) : null}
          </div>
        </div>
        <div className="px-6">
          <div className="relative mb-3 p-2">
            <div
              className="absolute inset-y-0  right-0 flex items-center gap-5 cursor-pointer"
              onClick={() => {
                sendMessage();
              }}
            >
              {/* <img src="./assets/mic.png" alt="" /> */}
              {/* <img src="./assets/pic.png" alt="" /> */}
              {/* <img src="./assets/attachment.png" alt="" /> */}
              <img src="./assets/send.png" alt="" />
            </div>
            <input
              type="text"
              id="input-group-1"
              className="bg-gray-50  border outline-neutral-400 border-gray-300 text-gray-900 max-w-[90%] w-full text-sm rounded-lg focus:ring-blue-500  block p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 "
              placeholder="Send your message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.shiftKey && e.key === "Enter") {
                  setMessage(message + "\n");
                } else if (e.key === "Enter") {
                  sendMessage();

                  setMessage("");
                  e.preventDefault();
                }
              }}
            />
          </div>
        </div>
      </div>
      <CSSTransition
        in={profile}
        nodeRef={nodeRef}
        timeout={300}
        classNames="fade"
        unmountOnExit
        // onEnter={() => setProfile(true)}
        // onExited={() => setProfile(false)}
      >
        <div className=" w-96  " ref={nodeRef}>
          <div className="flex p-6 flex-row bg-gray-400 drop-shadow-2xl justify-between">
            <p className="text-lg font-semibold text-white">Profile</p>
            <MdClose
              className="text-white w-8 h-8 cursor-pointer"
              onClick={() => setProfile(false)}
            />
          </div>
          <div className="flex justify-center p-5 myclass">
            <label htmlFor="profilePhotoUpload" className=" relative">
              {user.thumbnail_url ? (
                <img
                  src={`http://127.0.0.1:8000${user.thumbnail_url}`}
                  className="w-48 h-48 rounded-full"
                  alt="person_profile"
                />
              ) : (
                <img
                  src={`http://127.0.0.1:8000/media/avatars/blank.png`}
                  className="w-48 h-48 rounded-full"
                  alt="person_profile"
                />
              )}
            </label>
          </div>
          <div className="p-5 text-gray-700  ">
            <p className="font-semibold">About</p>
            <div className="flex flex-row mt-5">
              <div className="w-full">
                <p className="drop-shadow-2xl">
                  {about ? about : "You have not set your about"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CSSTransition>
      {languagePanel ? (
        <>
          <SelectLanguagePreference />
        </>
      ) : null}
    </div>
  );
});

const MessageTypingAnimation = () => {
  return (
    <div className="ticontainer">
      <div className="tiblock">
        <div className="tidot"></div>
        <div className="tidot"></div>
        <div className="tidot"></div>
      </div>
    </div>
  );
};
export default MainChat;
