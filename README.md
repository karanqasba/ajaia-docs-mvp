# Ajaia Docs MVP

A lightweight collaborative document editor built for the Ajaia Technical Program and Project Manager, AI Delivery assessment.

## What it does

- Create a new document
- Rename a document
- Edit rich text in the browser
- Save and reopen documents
- Import `.txt` or `.md` files as editable documents
- Share a document with another seeded user
- Distinguish between `Owned by me` and `Shared with me`
- Persist documents and sharing data in Supabase

## Tech stack

- React + Vite
- TipTap rich-text editor
- Supabase database
- Vitest for automated test coverage

## Seeded users

This MVP uses mocked users to keep scope focused on document collaboration instead of authentication.

- Karan Qasba — `karan@example.com`
- Ajaia Reviewer — `reviewer@ajaia.ai`
- Teammate User — `teammate@example.com`

Use the dropdown in the top-right corner to switch users and test the sharing flow.

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create Supabase project

Create a free Supabase project and open the SQL editor.

Run the SQL from:

```bash
src/lib/schema.sql
```

### 3. Configure environment variables

Copy the example env file:

```bash
cp .env.example .env
```

Add your Supabase values:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Start the app

```bash
npm run dev
```

### 5. Run tests

```bash
npm test
```

## Deployment

Recommended path:

1. Push this repo to GitHub
2. Import it into Vercel
3. Add the two environment variables in Vercel project settings
4. Deploy

The database remains hosted on Supabase.

## Known scope decisions

- Authentication is mocked through seeded users.
- File import supports `.txt` and `.md` only.
- Shared users can open documents; edit restrictions are intentionally lightweight for MVP clarity.
- Real-time collaboration is not included.
