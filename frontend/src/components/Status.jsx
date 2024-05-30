import React, { useRef, useEffect, useState } from "react";
import { Zuck } from "zuck.js";
import "zuck.js/css";
import "zuck.js/skins/snapgram";
import { MdClose } from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocketContext";
import { IoIosAddCircle } from "react-icons/io";

const Status = () => {
  const storiesRef = useRef(null);
  const othersStoryRef = useRef(null);
  const { status, setStatus, userData } = useAuth();
  const { socket } = useWebSocket();
  const addedStories = new Set();
  const addedOtherStories = new Set();
  const [show, setShow] = useState(true);

  const handleDelete = () => {
    socket.send(
      JSON.stringify({
        source: "delete_status",
      })
    );
    if (storiesRef.current) {
      storiesRef.current.innerHTML = '';
    }
    setShow(true);
  };

  const addStatus = (e) => {
    const selectedFile = e.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const base64Data = reader.result.split(",")[1];
      socket.send(
        JSON.stringify({
          source: "add_status",
          data: base64Data,
          fileName: selectedFile.name,
        })
      );
    };

    reader.readAsDataURL(selectedFile);
  };

  useEffect(() => {
    if (socket) {
      socket.send(
        JSON.stringify({
          source: "fetch_all_status",
        })
      );
    }
    const handleStatusList = (event) => {
      const data = JSON.parse(event.data);
      if (data.source === "fetch_all_status") {
        if (storiesRef.current) {
          const options = {
            skin: "snapgram", // container class
            avatars: true, // shows user photo instead of last story item preview
            // list: true,           // displays a timeline instead of carousel
            openEffect: true, // enables effect when opening story
            cubeEffect: true, // enables the 3d cube effect when sliding story
            // autoFullScreen: true, // enables fullscreen on mobile browsers
            // backButton: true, // adds a back button to close the story viewer
            // backNative: false,     // uses window history to enable back button on browsers/android
            // previousTap: true, // use 1/3 of the screen to navigate to previous item when tap the story
            // localStorage: true,    // set true to save "seen" position. Element must have a id to save properly.
            // reactive: true,        // set true if you use frameworks like React to control the timeline (see react.sample.html)
            // rtl: false,
          };
          const stories = new Zuck(storiesRef.current, options);
          const otherStories = new Zuck(othersStoryRef.current, options);
          // Add received stories
          // Add received stories
          data.data.status.forEach((status) => {
            const createdDate = new Date(status.created_at);
            const unixTime = createdDate.getTime();
            const storyData = {
              id: status.user,
              photo: `http://127.0.0.1:8000/media/${status.status_file}`,
              name: status.user,
              items: [
                {
                  id: status.id,
                  type: "photo",
                  length: 5,
                  src: `http://127.0.0.1:8000/media/${status.status_file}`,
                  time: unixTime / 1000,
                },
              ],
            };
            // Check if the story has already been added
            if (
              !addedStories.has(status.id) &&
              !addedOtherStories.has(status.id)
            ) {
              // Add the story to the corresponding Zuck instance and mark it as added
              if (status.user === userData.user) {
                stories.add(storyData);
                setShow(false);
                addedStories.add(status.id);
              } else {
                otherStories.add(storyData);
                addedOtherStories.add(status.id);
              }
            }
          });
        }
      }
    };

    if (socket) {
      socket.addEventListener("message", handleStatusList);
    }

    return () => {
      if (socket) {
        socket.removeEventListener("message", handleStatusList);
      }
    };
  }, [socket]);

  return (
    <>
      {status ? (
        <div className="w-[60%] ">
          <div className="flex p-6 flex-row bg-gray-400 drop-shadow-2xl justify-between">
            <p className="text-lg font-semibold text-white">Status</p>
            <MdClose
              className="text-white w-8 h-8 cursor-pointer"
              onClick={() => setStatus(false)}
            />
          </div>
          <div className="flex flex-row m-5 ">
            <div ref={storiesRef} className=""></div>

            <div className="m-4 text-gray-700 flex flex-row gap-5">
              {show && (
                <img
                  src={userData.profilePhoto}
                  alt=""
                  className="rounded-full w-16 h-16"
                />
              )}
              <div>
                <div className="flex flex-row items-center">
                  <p className="font-semibold mr-2">My Status</p>
                  <label
                    htmlFor="addstatus"
                    className="cursor-pointer relative"
                  >
                    <IoIosAddCircle className="size-8 text-gray-400 cursor-pointer" />
                    <input
                      type="file"
                      id="addstatus"
                      className="hidden"
                      onChange={addStatus}
                    />
                  </label>
                </div>
                <p className="text-sm">Tap to View status</p>
              </div>
              <div>
                {!show && (
                  <div className="bg-gray-400 p-2 font-semibold text-white rounded-md cursor-pointer" onClick={handleDelete}>
                    <span>Delete</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="p-6 pb-0 font-semibold">Recent Updates</p>
          <div className="p-6" ref={othersStoryRef}></div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export default Status;
