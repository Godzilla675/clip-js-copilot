// Using .cjs extension to ensure this file is always treated as CommonJS,
// regardless of any "type": "module" in package.json.
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Set WEB_APP_URL to point to the running web app.
// In development: defaults to the Next.js dev server at localhost:3000.
// In production: set this env var to the URL where the web app is served.
const WEB_APP_URL = process.env.WEB_APP_URL || 'http://localhost:3000';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(WEB_APP_URL);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
