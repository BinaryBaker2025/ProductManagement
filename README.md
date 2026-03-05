# Product Management Notes

## How to run

1. Run `npm install`
2. Run `npm run dev`
3. Open the local Vite link in the browser

## Brief notes on architecture choices

- I kept most of the app in `src/App.jsx` because the project is not that big yet.
- The data is coming from `src/mockData.json`.
- I used React hooks for state because that was enough for this size of app.
- Styling is split between `src/index.css` and `src/App.css` so the global and page styling are not mixed together too much.

## What I'd do next with more time

- Break `App.jsx` into smaller components because it is getting a bit long now.
- Make it more responsive by turning table rows into cards on mobile, because tables are hard to use on small screens.
- Add better accessibility for the modal and keyboard use.
- Add proper tests for the main flows.
- Hook it up to a real backend or API.
- Improve the form handling and error messages more.
