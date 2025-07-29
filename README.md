# 🎨 AI Component Generator - Frontend

This is the frontend for the **AI Component Generator**, a stateful, AI-driven micro-frontend playground. It allows authenticated users to iteratively generate, preview, tweak, and export React components using a conversational interface.

---

## 🔗 Live Demo & Repository

- 🔥 **Live Demo** (Vercel): [https://component-generator-frontend.vercel.app/](https://component-generator-frontend.vercel.app/)
- 🧠 **Backend Server** (Render): [https://component-generator-backend.onrender.com/](https://component-generator-backend.onrender.com/)
- 🛠 **GitHub Repository**: [https://github.com/raunit2025/component-generator](https://github.com/raunit2025/component-generator)

---

## ✨ Features

- **Interactive Playground**: A three-panel layout for component preview, code inspection, and AI chat interface.
- **Live Component Rendering**: Securely renders AI-generated components in a sandboxed `<iframe>`.
- **Session Management**: Resume previous sessions with saved chat + code.
- **Code Inspection & Export**: View JSX/TSX + CSS with syntax highlighting and export as `.zip`.
- **Authentication Flow**: Full UI for login, signup, and OAuth (Google + GitHub).
- **Interactive Property Editor (Bonus)**: Click elements to tweak style via AI prompts.

---

## 🛠 Tech Stack

| Category           | Tech Used                        |
|--------------------|----------------------------------|
| Framework          | React, Next.js                   |
| Styling            | Tailwind CSS                     |
| State Management   | React Hooks (`useState`, `useEffect`, `useCallback`) |
| API Communication  | Axios                            |
| Code Highlighting  | react-syntax-highlighter         |
| Icons              | lucide-react                     |
| Deployment         | Vercel                           |

---

## 🚀 Getting Started

### 📦 Prerequisites

- Node.js (v18 or later recommended)
- A running instance of the [Backend Server](https://component-generator-backend.onrender.com)

---

### 1. Clone the Repository

```bash
git clone https://github.com/raunit2025/component-generator.git
cd component-generator/component-generator-frontend
```
### 2. Install Dependencies
```bash
npm install
```
### 3. Configure Environment Variables
### Create a .env.local file in the root of the frontend directory and add:
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```
### 4. Start the Development Server
```bash
npm run dev
```
App should now be running at: http://localhost:3000

### 📁 Project Structure
```bash
.
├── public/                     # Static assets (icons, etc.)
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/               # Auth pages (login, signup, callback)
│   │   ├── playground/         # The main application playground
│   │   ├── layout.tsx          # Shared root layout
│   │   └── page.tsx            # Landing page
│   ├── lib/
│   │   └── axios.ts            # Axios instance with auth interceptors
│   └── globals.css             # Global styles
├── .env.local                  # Environment variables
├── next.config.ts              # Next.js configuration
├── package.json                # Project dependencies
└── tailwind.config.ts          # Tailwind CSS configuration
```
