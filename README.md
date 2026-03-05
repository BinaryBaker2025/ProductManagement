# Product Management Notes

## How to run

1. Run `npm install`
2. Run `npm run dev`
3. Open the local Vite link in the browser

## Brief notes on architecture choices

- I kept most of the code in `src/App.jsx` because the app is still small.
- The product list comes from `src/mockData.json`.
- I used React hooks to manage state.
- I split styles into `src/index.css` (global) and `src/App.css` (page styles) to keep it tidy.
- Search, filter, and sort are calculated from the current product list instead of saving extra copy data in state.
- I used a `draft` object in the modal so a user can type changes first and then click save.

## What I'd do next with more time

- Break `App.jsx` into smaller components because it is getting a bit long now.
- Make it more responsive by turning table rows into cards on mobile, because tables are hard to use on small screens.
- Add better accessibility for the modal and keyboard use.
- Hook it up to a real backend or API.
- Improve the form handling and error messages more.
- Add bettter styling to make it a better UI and UX as a simple UI was used
