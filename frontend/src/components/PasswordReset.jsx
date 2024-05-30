// PasswordResetPage.js

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useNavigate,Link,Navigate } from "react-router-dom";
import { Bars } from "react-loader-spinner";
import { useAuth } from "../context/AuthContext";


function PasswordResetPage() {
  const { uid, token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      setLoading(true)
      await axios.post(
        "http://127.0.0.1:8000/api/auth/users/reset_password_confirm/",
        { uid, token, new_password: password }
      );
      alert("Password reset successfully");
      setLoading(false)
      navigate("/");
    } catch (err) {
      if (err.response && err.response.data && err.response.data['new_password']) {
        alert("Password reset failed: " + err.response.data['new_password'][0]);
      } else {
        alert("Password reset failed. Please try again later.");
      }
      setLoading(false);
    }
    
  };

  return isAuthenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <div className="w-full bg-[#FF731D]  md:justify-center sm:justify-center h-screen flex">
      {loading ? (
        <>
          <Bars
            height="100"
            width="100"
            wrapperStyle={{ alignSelf: "center" }}
            color="#FFFF"
            ariaLabel="bars-loading"
            visible={true}
          />
        </>
      ) : (
        <>
          <div
            className="w-full lg:w-[50%] md:w-[70%] sm:w-[80%]  h-full     bg-center bg-contain bg-no-repeat items-center flex justify-center"
            style={{
              backgroundImage: "url('../assets/background1.jpg')",
            }}
          >
            <div className="w-[70%] h-[90%] flex justify-center items-center   rounded-[40px] bg-white bg-opacity-10 backdrop-blur-sm shadow-xl">
              <div className=" w-[80%] h-[90%] mt-20  ">
                <div className="">
                  <h1 className="text-3xl mb-5 text-white font-bold ">
                    Reset Password
                  </h1>
                </div>

                <div className="">
                  <form
                    onSubmit={handleResetPassword}
                    className="flex flex-col gap-6"
                  >
                    <div className="relative">
                      <input
                        type="password"
                        id="password1"
                        className="rounded-md p-2 border-none focus:border-transparent focus:outline-none focus:ring-0 block px-2.5 pb-2.5 pt-4 w-full text-md text-gray-900  r border-1 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500  focus:border-blue-600 peer"
                        placeholder=" "
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <label
                        htmlFor="password"
                        className="absolute text-md text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-transparent dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1"
                      >
                        New Password
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type="password"
                        id="password2"
                        className="rounded-md p-2 border-none focus:border-transparent focus:outline-none focus:ring-0 block px-2.5 pb-2.5 pt-4 w-full text-md text-gray-900  r border-1 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500  focus:border-blue-600 peer"
                        placeholder=" "
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <label
                        htmlFor="password"
                        className="absolute text-md text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-transparent dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1"
                      >
                        Confirm Password
                      </label>
                    </div>

                    <button
                      disabled={loading}
                      className="bg-[#FF731D] text-white rounded border border-white border-solid hover:bg-orange-700 p-2 mb-3 text-center"
                    >
                      Reset Password
                    </button>
                  </form>
                  <div className="  flex flex-col gap-4 ">
                    <span className="self-center text-white truncate">
                      <Link className="hover:text-gray-600" to="/">
                        Back to Login
                      </Link>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            className=" hidden md:block w-1/2 h-full bg-center bg-contain bg-no-repeat"
            style={{ backgroundImage: "url('../assets/background1.jpg')" }}
          ></div>
        </>
      )}
    </div>
  );
}

export default PasswordResetPage;
