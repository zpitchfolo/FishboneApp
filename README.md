# 🐟 Fishbone Studio

A premium, real-time **Fishbone (Ishikawa) diagram** editor built with React, TypeScript, and Mermaid.js.

## Features

- **Structured editor** — add categories (bones) and nested causes with infinite layers of detail
- **Live Mermaid rendering** — diagrams update instantly as you type
- **Raw Mermaid code editor** — switch between visual mode and direct code editing, with proper Tab support
- **Local persistence** — your diagram is saved automatically in the browser (survives page reloads)
- **Real-time collaboration** — optional Supabase integration for live sync between two users
- **SVG export** — download your diagram as a vector graphic

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (comes with Node.js)

---

## Quick Start (Local Mode)

```bash
# 1. Clone the repository
git clone https://github.com/zpitchfolo/FishboneApp.git
cd FishboneApp

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Then open **http://localhost:5173** in your browser.

Your diagram is saved automatically in your browser's localStorage — no account or setup required.

---

## Real-Time Collaboration (Optional)

To sync the diagram live between two users, set up a free [Supabase](https://supabase.com) project:

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a new project.

### 2. Create the database table

In the Supabase **SQL Editor**, run:

```sql
create table diagrams (
  id text primary key,
  state jsonb not null,
  updated_at timestamp with time zone default now()
);

-- Enable real-time for this table
alter publication supabase_realtime add table diagrams;
```

### 3. Add your credentials

Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

Then fill in your values from the Supabase project **Settings → API**:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Restart the dev server — the status badge in the top bar will change from **Local Mode** to **Realtime Sync**.

---

## Project Structure

```
src/
├── components/
│   ├── FishboneEditor.tsx   # Sidebar editor (categories + nested causes)
│   └── MermaidViewer.tsx    # Diagram renderer + code editor
├── hooks/
│   ├── useDebounce.ts       # Debounce utility
│   └── useLocalPersistence.ts  # localStorage save/load
├── lib/
│   └── supabaseClient.ts    # Supabase client (gracefully disabled if unconfigured)
├── styles/
│   └── globals.css          # Full design system
├── types/
│   └── fishbone.ts          # TypeScript interfaces
└── App.tsx                  # Root layout and data orchestration
```

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| [Vite](https://vitejs.dev/) | Build tool & dev server |
| [React 19](https://react.dev/) | UI framework |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Mermaid.js](https://mermaid.js.org/) | Fishbone diagram rendering (`ishikawa-beta`) |
| [Supabase](https://supabase.com/) | Optional real-time backend |
| [Lucide React](https://lucide.dev/) | Icons |
