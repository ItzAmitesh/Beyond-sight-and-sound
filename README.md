# Beyond Sight & Sound

## Run locally on Windows

Prerequisite: Node.js 20.9 or newer (npm is included with Node.js). This project also includes a Bun lockfile, but Bun is optional; the steps below use npm.

1. Install Node.js if it is not already installed.
2. Extract this folder and open PowerShell or a terminal in this project directory (the one containing `package.json`).
3. Install the dependencies:

   ```powershell
   npm install
   ```

4. Start the development server:

   ```powershell
   npm run dev
   ```

5. Open <http://localhost:3000> in your browser. Stop the server with `Ctrl+C`.

## Production build

Run `npm run build`, then `npm run start`. The build script copies Next.js static assets into the standalone output using Node.js, so it also works on Windows. Production starts with Node.js.

## Notes

- Import aliases such as `@/lib/bss/context` are configured in `tsconfig.json`; the app's local imports resolve to files included in the ZIP.
- `DATABASE_URL` is required only if you use the Prisma database commands. For the included SQLite database in `db/custom.db`, set it in PowerShell before running one of those commands:

  ```powershell
  $env:DATABASE_URL = "file:./db/custom.db"
  npm run db:generate
  npm run db:push
  ```

- `db:push` can change the database schema. Back up `db/custom.db` before using it if you have data to keep.
