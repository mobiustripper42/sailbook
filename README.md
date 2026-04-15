```bash
npm run dev

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

#after a shutdown
Boot computer
Open Docker Desktop
Open WSL terminal
cd ~/sailbook && supabase start && npm run dev

#run all tests
supabase db reset && npx playwright test