#  **💬 Chat Web Application**
A full-featured Chat Web Application built using React.js ⚛️, Tailwind CSS 🎨, JWT 🔑, Python Django Channels 🐍, and LibreTranslate 🌍. This application allows users to register, log in, chat in real-time, and translate messages on the go!

# 🚀 Tech Stack

**React.js:** Front-end framework for building interactive user interfaces with reusable components.

**Tailwind CSS:** Utility-first CSS framework for creating a responsive and modern design.

**JWT (JSON Web Tokens):** Securely manage user authentication and authorization.

Python Django Channels: Enables real-time communication using WebSockets for a responsive chat experience.

LibreTranslate: Provides multi-language translation capabilities for chat messages.

WebSockets: Real-time, full-duplex communication for chat functionality.

# ✨ Features

🔐 User Authentication: Secure login and registration using JWT for authentication.
💬 Real-Time Messaging: Chat with other users in real-time using WebSockets powered by Django Channels.
🌍 Multi-Language Support: Translate chat messages instantly with LibreTranslate.
📝 Group and Direct Chats: Supports both group chats and one-on-one direct messaging.
👤 User Profiles: View and manage user profiles with personalized settings.
🔄 Persistent Sessions: Sessions persist between page reloads, ensuring a seamless experience.
📱 Responsive Design: Adapts to mobile, tablet, and desktop devices for a smooth user experience.

# 📂 Project Structure

The project is divided into client-side and server-side folders for better organization:


# 📦 Installation

To run this project locally, follow these steps:

Client-side (React)
Navigate to the client directory:


cd chat-web-app/client
Install dependencies:


**npm install**

Start the development server:


**npm run dev**

Open your browser and visit: http://localhost:3000

Server-side (Django)
Navigate to the server directory:


cd chat-web-app/server
Create a virtual environment:


python -m venv venv
Activate the virtual environment:

On Windows: venv\Scripts\activate

Install dependencies:


**pip install -r requirements.txt**

Run database migrations:


**python manage.py migrate**

Start the Django development server:


**python manage.py runserver** 

# 🌐 Deployment

This project can be deployed using platforms like Netlify for the client-side and Heroku or AWS for the server-side. Ensure WebSocket support is enabled on your hosting platform for real-time messaging.

# 🛠️ Development

Client-side:

npm run dev: Start the client development server.

npm run build: Build the client for production.

Server-side:

python manage.py runserver: Start the Django development server.

daphne -b 0.0.0.0 -p 8001 chat-web-app.asgi:application: Start the ASGI server for WebSockets.

# 📧 Contact

Feel free to reach out if you have any questions, suggestions, or feedback!

**Email:** kushwahamahendra691@gmail.com

**LinkedIn:** www.linkedin.com/in/mahendra-kushwaha-333569259

# 🙌 Acknowledgments
Thanks to the open-source community for providing incredible tools and resources that make development fun and efficient!
