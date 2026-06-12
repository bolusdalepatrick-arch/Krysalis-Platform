@echo off
rem Launches the krysalis-gate dev server from its real (long) path.
rem Turbopack panics when started via an 8.3 short path, and the preview
rem launcher can't quote spaces in args — this wrapper bridges the two.
cd /d "C:\Users\bolus\OneDrive\Desktop\Krysalis Website"
npm run dev -- -p 3105
