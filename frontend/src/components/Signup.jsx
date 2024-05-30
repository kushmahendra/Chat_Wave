import React from "react";
import { Link } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import axios from "axios";
import { useNavigate, Navigate } from "react-router-dom";
import { Bars } from "react-loader-spinner";
import { FaEye, FaSlack } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";

const Signup = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { isAuthenticated, login } = useAuth();
  const [firstname, setFirstName] = useState("");
  const [lastname, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const signin = useGoogleLogin({
    onSuccess: async (response) => {
      console.log("success: ", response.access_token);

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
  const handleSignup = async (e) => {
    try {
      setLoading(true);
      e.preventDefault();

      const formData = {
        first_name: firstname,
        last_name: lastname,
        username: username,
        password: password,
        email: email,
      };

      const response = await fetch("http://localhost:8000/signup/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("User registered successfully");
        try {
          const user = {
            username: username,
            password: password,
          };

          const { data } = await axios.post(
            "http://localhost:8000/token/",
            user,
            {
              headers: {
                "Content-Type": "application/json",
              },
              withCredentials: true,
            }
          );

          localStorage.clear();
          localStorage.setItem("access_token", data.access);
          localStorage.setItem("refresh_token", data.refresh);
          localStorage.setItem("token_type", "jwt");

          axios.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${data.access}`;
          login();
        } catch (error) {
          alert("Error during token acquisition:", error);
        }
      } else {
        // Handle registration error
        const errorData = await response.json();
        alert("Failed to register user: " + JSON.stringify(errorData));
      }
    } catch (error) {
      alert("Error during user registration:", error);
    } finally {
      setLoading(false);
    }
  };

  return isAuthenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <div className="w-screen bg-[#FF731D] h-screen md:justify-center sm:justify-center  flex">
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
            className="w-full lg:w-1/2  h-full    bg-center bg-contain bg-no-repeat items-center flex justify-center"
            style={{
              backgroundImage: "url('../assets/background1.jpg')",
            }}
          >
            <div className="w-[70%] h-[95%]  flex justify-center items-center  rounded-[40px] bg-white bg-opacity-10 backdrop-blur-sm shadow-xl">
              <div className=" w-[80%] ">
                <div className="">
                  <h1 className="text-3xl mb-5 text-white font-bold ">
                    Sign Up
                  </h1>
                </div>

                <div className="">
                  <form onSubmit={handleSignup} className="flex flex-col gap-6">
                    <div className="relative">
                      <input
                        type="text"
                        id="first_name"
                        className="rounded-md p-2.5 border-none focus:border-transparent focus:outline-none focus:ring-0 block    w-full text-md text-gray-900  r border-1 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500  focus:border-blue-600 peer"
                        placeholder=" "
                        required
                        value={firstname}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                      <label
                        htmlFor="first_name"
                        className="absolute text-md text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-transparent dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1"
                      >
                        First Name
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        required
                        type="text"
                        id="last_name"
                        className="rounded-md p-2.5 border-none focus:border-transparent focus:outline-none focus:ring-0 block    w-full text-md text-gray-900  r border-1 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500  focus:border-blue-600 peer"
                        placeholder=" "
                        value={lastname}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                      <label
                        htmlFor="last_name"
                        className="absolute text-md text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-transparent dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1"
                      >
                        Last Name
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        required
                        type="text"
                        id="username"
                        className="rounded-md p-2.5 border-none focus:border-transparent focus:outline-none focus:ring-0 block    w-full text-md text-gray-900  r border-1 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500  focus:border-blue-600 peer"
                        placeholder=" "
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
                      <input
                        required
                        type="email"
                        id="email"
                        className="rounded-md p-2.5 border-none focus:border-transparent focus:outline-none focus:ring-0 block    w-full text-md text-gray-900  r border-1 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500  focus:border-blue-600 peer"
                        placeholder=" "
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <label
                        htmlFor="email"
                        className="absolute text-md text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-transparent dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1"
                      >
                        Email
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

                    <button className="bg-[#FF731D] text-white rounded border border-white border-solid hover:bg-orange-700 p-1 mb-2">
                      Sign Up
                    </button>
                  </form>
                  <div className="  flex flex-col gap-2 ">
                    <div className="text-center text-white">
                      or create account with
                    </div>
                    <div className="flex  bg-white rounded-md p-1 px-5">
                      <div className="rounded-full bg-white w-8 h-8 flex justify-center ">
                        <img src="../assets/google.svg" alt="google" />
                      </div>
                      <div className="flex-1 flex items-center justify-center text-md font-semibold ">
                        <button
                          onClick={signin}
                          // disabled={loading}
                          className="hover:text-gray-400"
                        >
                          Sign Up with Google
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
                      Already have an account?{" "}
                      <Link className="hover:text-gray-600" to="/">
                        Login here
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

export default Signup;
