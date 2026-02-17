# AgriConnect - AI Farm Assistant

A Progressive Web App (PWA) for farmers to:
- Ask an AI assistant about crops and livestock.
- Buy and sell farm produce in the Marketplace.
- Consult with Veterinarians.

## Features
- **AI Chat**: Instant answers to farming questions.
- **Marketplace**: Browse trending products and sell your own harvest.
- **Consultation**: Connect with expert vets.
- **PWA Support**: Installable on mobile devices with offline capabilities.

## How to Run
1. Open this folder in a terminal.
2. Run a local server (Service Workers require localhost or HTTPS):
   ```bash
   npx serve .
   ```
3. Open `http://localhost:3000` in your browser.
4. To test PWA features, open Chrome DevTools > Application > Manifest/Service Workers.

## Project Structure
- `index.html`: Main application shell (SPA).
- `css/style.css`: Styles and animations.
- `js/app.js`: Application logic and mock data.
- `sw.js`: Service Worker for offline caching.
- `manifest.json`: PWA configuration.
