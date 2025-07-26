# AI Component Generator - Frontend

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.x-black.svg)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)

This is the frontend for the AI Component Generator, a stateful, AI-driven micro-frontend playground. It allows authenticated users to iteratively generate, preview, tweak, and export React components using a conversational interface.

## Features

- ✅ **Interactive Playground**: A three-panel layout for component preview, code inspection, and AI chat.
- ✅ **Live Component Rendering**: Securely renders AI-generated components in an `<iframe>` sandbox.
- ✅ **Session Management**: Users can create new sessions or resume previous ones, with all work preserved.
- ✅ **Code Inspection & Export**: View generated JSX/TSX and CSS in syntax-highlighted tabs, with options to copy or download as a `.zip` file.
- ✅ **Authentication Flow**: Full UI for signup, login, and OAuth callbacks.
- ✅ **Responsive Design**: Built with Tailwind CSS for a seamless experience on all devices.

## Tech Stack

- **Framework**: React & Next.js
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (`useState`, `useEffect`)
- **API Communication**: Axios
- **Code Highlighting**: `react-syntax-highlighter`
- **Icons**: `lucide-react`

---

## Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
    cd component-generator-frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create `.env.local` file:**
    Create a new environment file in the root of the frontend directory.
    ```bash
    touch .env.local
    ```

4.  **Configure your `.env.local` file:**
    Add the URL of your running backend server.
    ```env
    NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
    ```

5.  **Start the local development server:**
    ```bash
    npm run dev
    ```

The application should now be running at `http://localhost:3000`.

---

## Project Structure

| Path                      | Description                                      |
|---------------------------|--------------------------------------------------|
| `/public/`                | Static assets (icons, etc.)                      |
| `/src/app/`               | Next.js App Router pages                         |
| `/src/app/auth/`          | Auth pages (login, signup, callback)            |
| `/src/app/playground/`    | The main application playground                  |
| `/src/app/layout.tsx`     | Shared layout component                          |
| `/src/app/page.tsx`       | Landing page                                     |
| `/src/lib/axios.ts`       | Axios instance with interceptors                 |
| `/.env.local`             | Environment variables                            |
| `/next.config.ts`         | Next.js configuration                            |
| `/package.json`           | Project dependencies                             |
| `/tailwind.config.ts`     | Tailwind CSS configuration                       |

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Author

**Raunit Raj** — [LinkedIn](https://www.linkedin.com/in/raunitraj/)
<br />
*Computer Science & Engineering Student*
