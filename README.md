<div align="center">

# 🤖 Chatbot Using LangGraph

**A production-ready, full-stack AI chatbot with autonomous tool calling, multi-user support, and PDF-powered RAG.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![LangGraph](https://img.shields.io/badge/LangGraph-latest-FF6B35?style=flat-square)](https://github.com/langchain-ai/langgraph)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![Railway](https://img.shields.io/badge/Deployed-Railway-0B0D0E?style=flat-square&logo=railway)](https://railway.app/)
[![License](https://img.shields.io/badge/License-Educational-yellow?style=flat-square)](#-license)

[Features](#-features) • [Architecture](#-architecture) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Deployment](#-deployment) • [API Reference](#-api-reference)

</div>

---

## 📸 Overview

This project is a full-stack conversational AI application powered by **LangGraph** agents and open-source **HuggingFace** models. It supports multi-user authentication, persistent conversation threads, autonomous tool invocation (web search, calculator, stock quotes), and document Q&A via PDF-based Retrieval-Augmented Generation — all backed by **Supabase PostgreSQL**.

> 🚀 **Live API:** [`https://chatbot-backend-fastapi-production.up.railway.app`](https://chatbot-backend-fastapi-production.up.railway.app)

---

## ✨ Features

### 🔐 Authentication & Multi-User
- **Secure registration & login** — Email/password auth with Argon2 password hashing via `pwdlib`.
- **Stateless JWT sessions** — Configurable token expiry; tokens are validated on every protected request.
- **Per-user thread isolation** — Users can only read and write their own conversations.
- **Automatic logout** — Axios interceptors detect 401 responses and redirect to login seamlessly.

### 🤖 AI Agent & Tool Calling
The LangGraph agent autonomously decides when and which tools to invoke:

| Tool | Description |
|------|-------------|
| 🔍 **Web Search** | Real-time results via DuckDuckGo |
| 🧮 **Calculator** | Basic arithmetic (add, subtract, multiply, divide) |
| 📈 **Stock Prices** | Live quotes from the Alpha Vantage API |
| 📄 **RAG (PDF Q&A)** | Answers grounded in uploaded PDF documents |

- **Multi-turn memory** — Conversation history is persisted via LangGraph's PostgreSQL checkpointer, so the agent remembers context across messages.
- **PDF ingestion** — Upload a PDF through the UI; it's automatically chunked, embedded with `all-MiniLM-L6-v2`, and indexed in FAISS for per-thread retrieval.

### 💬 Chat Experience
- **Thread management** — Create, switch between, and delete conversation threads from the sidebar.
- **Typing indicator** — Live visual feedback while the AI generates a response.
- **Markdown rendering** — Responses render with full Markdown and GitHub-Flavored Markdown (GFM) table support.
- **Responsive UI** — Mobile-friendly layout with a collapsible sidebar and hamburger menu.
- **Timestamped messages** — Every message is timestamped and persisted in PostgreSQL.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      React Frontend                          │
│               (Vite + React 19 + Axios)                      │
│  ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ LoginPage │ │ Sidebar  │ │ MainChat │ │   InputBox   │   │
│  └───────────┘ └──────────┘ └──────────┘ └──────────────┘   │
└──────────────────────────┬───────────────────────────────────┘
                           │  HTTP REST + JWT Bearer Token
┌──────────────────────────▼───────────────────────────────────┐
│                    FastAPI Backend                            │
│  ┌──────────────────┐  ┌────────────────────────────────┐    │
│  │  Auth Middleware  │  │        Route Modules           │    │
│  │  (JWT + OAuth2)  │  │   /api/*    •    /users/*      │    │
│  └──────────────────┘  └────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                  LangGraph Agent                     │    │
│  │  ┌────────────────┐     ┌──────────────────────────┐ │    │
│  │  │   Chat Node    │◄───►│       Tool Node          │ │    │
│  │  │  (Qwen 2.5-7B) │     │ Search│Calc│Stock│RAG   │ │    │
│  │  └────────────────┘     └──────────────────────────┘ │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────┐  ┌──────────────────────────┐    │
│  │  PostgreSQL (Supabase) │  │   FAISS Vector Store     │    │
│  │  • LangGraph checkpts  │  │   • In-memory, per-thread│    │
│  │  • Users & threads     │  │   • MiniLM-L6-v2 embeds  │    │
│  │  • Message timestamps  │  └──────────────────────────┘    │
│  └────────────────────────┘                                  │
└──────────────────────────────────────────────────────────────┘
```

### 🔄 Request Lifecycle

```mermaid
graph LR
    A[User Message] --> B[React Frontend]
    B -->|POST /api/chat + JWT| C[FastAPI]
    C -->|Validate token & thread| D[LangGraph Agent]
    D --> E[Chat Node — Qwen 2.5]
    E -->|Tool call needed?| F{Decision}
    F -->|Yes| G[Tool Node]
    G -->|Tool result| E
    F -->|No| H[Final Response]
    H -->|Persist to PostgreSQL| C
    C --> B
```

1. **User sends a message** — The React frontend posts to `/api/chat` with the JWT in the `Authorization` header.
2. **FastAPI authenticates** — The JWT is validated, the user is identified, and thread ownership is verified.
3. **LangGraph processes** — The message enters the stateful graph. The chat node (Qwen 2.5) decides whether to respond directly or invoke a tool.
4. **Tool execution** — If a tool is invoked (web search, calculator, stock price, or RAG), the tool node runs it and feeds the result back to the chat node.
5. **Response persisted & returned** — The final AI response is timestamped, saved to PostgreSQL, and returned to the frontend.

---

## 📂 Project Structure

```
Chatbot-Using-Langraph/
├── backend/
│   ├── main.py                 # FastAPI app entry — CORS, router registration
│   ├── auth.py                 # JWT creation/validation, password hashing, OAuth2
│   ├── graph.py                # LangGraph state graph assembly & conditional edges
│   ├── tools.py                # Tool definitions: search, calc, stock, RAG
│   ├── models.py               # LLM & embedding model configuration
│   ├── database.py             # PostgreSQL pool, checkpointer, thread/user helpers
│   ├── pdf_ingestion.py        # PDF loading, text chunking & FAISS indexing
│   ├── routes/
│   │   ├── api.py              # Chat, thread, and PDF upload endpoints
│   │   └── users.py            # Registration, login, profile, and deletion
│   ├── Dockerfile              # Production container image
│   ├── .dockerignore
│   ├── requirements.txt
│   └── .env                    # ⚠️ Not committed — see Environment Variables
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Root component — auth gate & layout
│   │   ├── main.jsx            # Vite entry point
│   │   ├── index.css           # Global styles (dark theme)
│   │   ├── api/
│   │   │   └── api.js          # Axios client with JWT request/response interceptors
│   │   └── components/
│   │       ├── LoginPage.jsx   # Login / registration form
│   │       ├── Sidebar.jsx     # Thread list & management
│   │       ├── Navbar.jsx      # Top bar — mobile toggle & logout
│   │       ├── MainChat.jsx    # Message display with typing indicator
│   │       └── InputBox.jsx    # Chat input & PDF upload
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── model/                      # Legacy Streamlit prototypes (reference only)
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **LLM** | [Qwen 2.5-7B-Instruct](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct) via HuggingFace Inference API | Chat & tool-call reasoning |
| **Embeddings** | [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) | PDF chunk vectorization for RAG |
| **Agent Framework** | [LangGraph](https://github.com/langchain-ai/langgraph) | Stateful graph with conditional tool-call edges |
| **Backend** | [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/) | REST API server |
| **Auth** | [PyJWT](https://pyjwt.readthedocs.io/) + [pwdlib](https://github.com/frankie567/pwdlib) (Argon2) | Token issuance & password hashing |
| **Database** | [Supabase PostgreSQL](https://supabase.com/) via [psycopg 3](https://www.psycopg.org/psycopg3/) | Persistent storage & LangGraph checkpointing |
| **Vector DB** | [FAISS](https://github.com/facebookresearch/faiss) | In-memory, per-thread similarity search for RAG |
| **Frontend** | [React 19](https://react.dev/) + [Vite](https://vite.dev/) | SPA with fast HMR development |
| **HTTP Client** | [Axios](https://axios-http.com/) | API requests with JWT interceptors |
| **Markdown** | [react-markdown](https://github.com/remarkjs/react-markdown) + remark-gfm | Rich AI response rendering |
| **Containerization** | [Docker](https://www.docker.com/) | Reproducible, portable backend deploys |
| **Hosting** | [Railway](https://railway.app/) | CI/CD from Dockerfile on push |

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Minimum Version |
|-------------|----------------|
| Python | 3.11+ |
| Node.js | 18+ |
| PostgreSQL | Any (or a free [Supabase](https://supabase.com/) project) |

You will also need:
- A [HuggingFace API token](https://huggingface.co/settings/tokens) (free tier works)
- *(Optional)* An [Alpha Vantage API key](https://www.alphavantage.co/support/#api-key) for live stock quotes
- *(Optional)* A [LangSmith API key](https://smith.langchain.com/) for agent tracing

---

### 1. Clone the Repository

```bash
git clone https://github.com/Arjun8124/Chatbot-Using-Langraph.git
cd Chatbot-Using-Langraph
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
# ── Required ──────────────────────────────────────────────────
HUGGINGFACEHUB_API_TOKEN="hf_your_token_here"
DATABASE_URL="postgresql://user:password@host:5432/dbname"
JWT_SECRET_KEY="your-256-bit-secret"          # See tip below
JWT_ALGORITHM="HS256"

# ── Optional — Stock tool ──────────────────────────────────────
ALPHA_VANTAGE_API_KEY="your_key_here"

# ── Optional — LangSmith tracing ──────────────────────────────
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT="https://api.smith.langchain.com"
LANGCHAIN_API_KEY="lsv2_pt_your_key_here"
LANGCHAIN_PROJECT="Chatbot Project"
```

> 💡 **Tip:** Generate a cryptographically secure JWT secret with:
> ```bash
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

Start the development server:

```bash
uvicorn main:app --reload
```

The API will be available at **`http://localhost:8000`**. Interactive docs are at **`http://localhost:8000/docs`**.

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The UI will be available at **`http://localhost:5173`**.

> ⚠️ **Local development note:** The frontend defaults to the production API URL. To use your local backend, update `baseURL` in `frontend/src/api/api.js`:
> ```js
> const baseURL = "http://localhost:8000"; // change from production URL
> ```

---

## 🐳 Deployment

### Docker (Backend)

```bash
cd backend

# Build the image
docker build -t chatbot-backend .

# Run with environment variables
docker run -p 8000:8000 --env-file .env chatbot-backend
```

### Railway (Production)

The backend is deployed on [Railway](https://railway.app/) via automatic Dockerfile builds on every push.

1. Fork this repo and connect it to a new Railway project.
2. Set all required environment variables in the Railway dashboard under **Variables**.
3. Railway will auto-detect the `Dockerfile` and deploy on every push to `main`.

**Live API:** `https://chatbot-backend-fastapi-production.up.railway.app`

> For the frontend, deploy the `frontend/` directory to [Vercel](https://vercel.com/) or [Netlify](https://netlify.com/) with `npm run build` as the build command and `dist/` as the publish directory.

---

## 📡 API Reference

All protected routes require the header: `Authorization: Bearer <token>`

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/users/register` | ❌ | Create a new account |
| `POST` | `/users/login` | ❌ | Login and receive a JWT |
| `GET` | `/users/me` | 🔒 | Get the current user's profile |
| `DELETE` | `/users/{id}` | 🔒 | Delete own account |

### Chat & Threads

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/chat` | 🔒 | Send a message and receive an AI response |
| `POST` | `/api/threads` | 🔒 | Create a new conversation thread |
| `GET` | `/api/threads` | 🔒 | List all threads for the current user |
| `GET` | `/api/threads/{thread_id}/messages` | 🔒 | Retrieve message history for a thread |
| `GET` | `/api/threads/{thread_id}/documents` | 🔒 | Get PDF metadata for a thread |
| `DELETE` | `/api/threads/{thread_id}` | 🔒 | Delete a thread and its messages |
| `POST` | `/api/upload_pdf` | 🔒 | Upload and ingest a PDF for RAG |

### Example: Send a Chat Message

```bash
curl -X POST https://chatbot-backend-fastapi-production.up.railway.app/api/chat \
  -H "Authorization: Bearer <your_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"thread_id": "abc123", "message": "What is the current price of AAPL?"}'
```

---

## 📋 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `HUGGINGFACEHUB_API_TOKEN` | ✅ | HuggingFace Inference API token |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET_KEY` | ✅ | Secret for signing JWT tokens (min. 32 bytes recommended) |
| `JWT_ALGORITHM` | ✅ | JWT signing algorithm — default: `HS256` |
| `ALPHA_VANTAGE_API_KEY` | ❌ | Required for the stock price tool |
| `LANGCHAIN_TRACING_V2` | ❌ | Set `true` to enable LangSmith tracing |
| `LANGCHAIN_API_KEY` | ❌ | LangSmith API key |
| `LANGCHAIN_PROJECT` | ❌ | LangSmith project name |

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository.
2. **Create a branch** — `git checkout -b feature/your-feature-name`
3. **Commit your changes** — `git commit -m 'feat: add some feature'`
4. **Push** — `git push origin feature/your-feature-name`
5. **Open a Pull Request** against `main`.

Please open an issue first for major changes to discuss the approach.

---

## 🗺️ Roadmap

- [ ] Streaming AI responses (SSE / WebSocket)
- [ ] Support for additional LLM providers (OpenAI, Groq, Ollama)
- [ ] Persistent FAISS index storage across sessions
- [ ] Conversation export (JSON / Markdown)
- [ ] Admin dashboard for user management
- [ ] Rate limiting per user

---

## 📝 License

This project is intended for **educational and personal use**. Feel free to fork and adapt it for your own learning.

---

<div align="center">

Built with ❤️ using [LangGraph](https://github.com/langchain-ai/langgraph), [FastAPI](https://fastapi.tiangolo.com/), and [React](https://react.dev/)

</div>