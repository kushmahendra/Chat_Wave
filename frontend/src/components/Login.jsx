import React, { useEffect, useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { Bars } from "react-loader-spinner";
import { useAuth } from "../context/AuthContext";
import { FaEye, FaSlack } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";

const Login = () => {
  const { isAuthenticated, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const signin = useGoogleLogin({
    onSuccess: async (response) => {
      console.log("success: ", response);

      const userPayload = {
        grant_type: "convert_token",
        client_id: import.meta.env.VITE_DJANGO_CLIENT_ID,
        client_secret: import.meta.env.VITE_DJANGO_CLIENT_SECRET_KEY,
        backend: "google-oauth2",
        token: response.access_token,
      };

      try {
        setLoading(true);
        const { data } = await axios.post(
          "http://localhost:8000/api-auth/convert-token/",
          userPayload,
          {
            headers: {
              "Content-Type": "application/json",
            },
            withCredentials: true,
          }
        );

        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${data["access_token"]}`;
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        localStorage.setItem("token_type", "google-oauth");

        login();

        // Navigate to dashboard page after successful authentication
        navigate("/dashboard");
      } catch (error) {
        alert("Failed to send token to the server:", error.error_description);
        setLoading(false);
      }
    },
    onError: (error) => console.log("Login Failed:", error.error_description),
  });

  const handleLogin = async (e) => {
    try {
      setLoading(true);
      e.preventDefault();

      const user = {
        username: username,
        password: password,
      };

      // Create the POST request
      const { data } = await axios.post("http://localhost:8000/token/", user, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      // console.log(jwtDecode(data.access));

      // Decode the JWT token to get user information
      // const userPayload = jwt_decode(data.access);
      // console.log(userPayload)

      // // Update the user context with the decoded payload
      // updateUser({
      //   username: userPayload.username,
      //   email: userPayload.email,
      //   // ... other user data
      // });

      // Initialize the access & refresh token in local storage.
      localStorage.clear();
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("token_type", "jwt");
      axios.defaults.headers.common["Authorization"] = `Bearer ${data.access}`;

      login();
    } catch (error) {
      alert(`Login failed: ${error.response.data.detail}`);
      console.error("Login failed:", error.response.data.detail);
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
              <div className=" w-[80%]  ">
                <div className="">
                  <h1 className="text-3xl mb-5 text-white font-bold ">Login</h1>
                </div>

                <div className="">
                  <form onSubmit={handleLogin} className="flex flex-col gap-6">
                    <div className="relative">
                      <input
                        type="text"
                        id="username"
                        className="rounded-md p-2 border-none focus:border-transparent focus:outline-none focus:ring-0 block px-2.5 pb-2.5 pt-4 w-full text-md text-gray-900  r border-1 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500  focus:border-blue-600 peer"
                        placeholder=" "
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                      <label
                        htmlFor="username"
                        className="absolute text-md text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-transparent dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1"
                      >
                        Username
                      </label>
                    </div>
                    <div className="relative">
                      <div className="flex justify-between">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          className="rounded-md p-2 border-none focus:border-transparent focus:outline-none focus:ring-0 block px-2.5 pb-2.5 pt-4 w-full text-md text-gray-900  r border-1 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500  focus:border-blue-600 peer"
                          placeholder=" "
                          value={password}
                          required
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <label
                          htmlFor="password"
                          className="absolute text-md text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-transparent dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1"
                        >
                          Password
                        </label>
                      </div>
                      {showPassword ? (
                        <>
                          <FaEyeSlash
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-3 h-6 w-6 text-gray-500 cursor-pointer"
                          />
                        </>
                      ) : (
                        <>
                          <FaEye
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-3 h-6 w-6 text-gray-500 cursor-pointer"
                          />
                        </>
                      )}
                    </div>

                    <span className="mt-8">
                      <Link
                        className="text-white hover:text-gray-600"
                        to="/forget"
                      >
                        Forget Password
                      </Link>
                    </span>

                    <button
                      disabled={loading}
                      className="bg-[#FF731D] text-white rounded border border-white border-solid hover:bg-orange-700 p-2 mb-3 text-center"
                    >
                      Sign in
                    </button>
                  </form>
                  <div className="  flex flex-col gap-4 ">
                    <div className="text-center text-white">
                      or continue with
                    </div>
                    <div className="flex  bg-white rounded-md p-2 px-5">
                      <div className="rounded-full bg-white w-8 h-8 flex justify-center ">
                        <img src="../assets/google.svg" alt="google" />
                      </div>

                      <div className="flex-1 flex items-center justify-center text-md font-semibold ">
                        <button
                          onClick={signin}
                          disabled={loading}
                          className="hover:text-gray-400"
                        >
                          Sign in with Google
                        </button>
                      </div>

                      {/* <button>
                        <div className="rounded-full bg-white w-8 h-8  flex justify-center">
                          <img src="../assets/github.svg" alt="github" />
                        </div>
                      </button> */}
                      {/* <button>
                        <div className="rounded-full bg-white w-8 h-8 flex justify-center">
                          <img src="../assets/meta.svg" alt="meta" />
                        </div>
                      </button> */}
                    </div>
                    <span className="self-center text-white truncate">
                      Don't have an account?{" "}
                      <Link className="hover:text-gray-600" to="/signup">
                        Register here
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
};

export default Login;
