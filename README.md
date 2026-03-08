🧠💀 BRAINROT

BRAINROT is your unhinged AI bestie — a chaotic, Gen-Z-flavored AI chat assistant that delivers real-time streaming AI responses in a sleek modern interface.

Built with React + AI streaming, this project focuses on creating a smooth chat experience with a playful internet-style personality.

🚀 Features

🔥 Real-time streaming AI responses
💬 Clean chat interface with Markdown support
⚡ Quick-start suggestion cards

Brainstorm

Write

Explain

Get Creative

📱 Fully responsive design (works on desktop & mobile)
🎨 Dark-themed minimal UI

🛠 Tech Stack
Frontend

React

TypeScript

Vite

Tailwind CSS

shadcn/ui

AI

Google Gemini 3 Flash

Lovable AI Gateway

Backend

Lovable Cloud

Edge Functions for streaming chat

Styling

Tailwind CSS

Custom design tokens

⚙️ Getting Started
1️⃣ Clone the Repository
git clone https://github.com/Keerthipriya27/BRAINROT.git
2️⃣ Navigate into the Project
cd BRAINROT
3️⃣ Install Dependencies
npm install
4️⃣ Start Development Server
npm run dev

The app will start locally on:

http://localhost:5173
📂 Project Structure
src/
├── components/       # UI components (ChatMessage, ChatInput, etc.)
├── lib/              # Utility functions (streamChat helper)
├── pages/            # Page components
└── integrations/     # Backend client configuration

supabase/
└── functions/
    └── chat/         # Streaming chat edge function
💡 How It Works

User sends a message through the chat interface.

The message is sent to the backend Edge Function.

The backend communicates with the Gemini 3 Flash model through the Lovable AI gateway.

Responses are streamed back to the frontend in real time, creating a smooth chat experience.

🎯 Project Goal

The goal of BRAINROT is to explore:

Real-time AI streaming

Modern React chat interfaces

Integration with LLM APIs

Fast frontend architecture with Vite + Tailwind

🤝 Contributing

Contributions are welcome!

Fork the repository

Create a new branch

Commit your changes

Open a Pull Request

📜 License

This project is licensed under the MIT License.

⭐ If you like this project, consider starring the repository.
