## Getting Started

You can start project by bocker compose or manually 

Docker:

```bash
docker compose up --build
```
## Or

First, run the development server for frontend in ./frontend directory:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
Then, run the server for backend in ./backend directory:

```bash
node server.js
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

