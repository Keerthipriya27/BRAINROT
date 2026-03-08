# BRAINROT 🧠💀

ur unhinged AI bestie — a chaotic, Gen-Z-flavored AI chat assistant built with React and streaming AI responses.

![BRAINROT Screenshot](public/screenshot.png)

> *Replace `public/screenshot.png` with your own screenshot or GIF of the app.*

## Features

- 🔥 Real-time streaming AI responses
- 💬 Clean chat interface with markdown support
- ⚡ Quick-start suggestion cards (Brainstorm, Write, Explain, Get creative)
- 📱 Fully responsive design
- 🎨 Dark-themed, minimal aesthetic

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **AI**: Google Gemini 3 Flash (via Lovable AI gateway)
- **Backend**: Lovable Cloud (Edge Functions for streaming chat)
- **Styling**: Tailwind CSS with custom design tokens

## Getting Started

```sh
# Clone the repo
git clone <YOUR_GIT_URL>

# Install dependencies
npm install

# Start dev server
npm run dev
```

## Project Structure

```
src/
├── components/       # UI components (ChatMessage, ChatInput, etc.)
├── lib/              # Utilities (streamChat helper)
├── pages/            # Page components (Index)
└── integrations/     # Backend client config
supabase/
└── functions/
    └── chat/         # Streaming chat edge function
```

## License

MIT
