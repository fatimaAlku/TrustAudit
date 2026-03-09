Smart IT Audit & Compliance Platform – Frontend
===============================================

This `frontend` folder contains the React single-page application for the Smart IT Audit & Compliance Platform.

It provides:

- A landing overview with key features and framework coverage.
- An Audit Projects view for managing engagements.
- An Evidence Upload screen for attaching documentation to controls.

Getting started
---------------

1. Install dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Configure your preferred dev server/bundler (for example Vite, CRA, or another React setup) and wire it to:

- Use `public/index.html` as the HTML entry.
- Use `src/index.js` as the JavaScript entry.

3. Ensure the backend is running on `http://localhost:5000` (or set `REACT_APP_API_BASE_URL`) so that API calls from `src/services/apiService.js` reach the Node/Express backend.
