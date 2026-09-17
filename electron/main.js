const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

function createWindow() {
  const iconPath = path.join(__dirname, '../assets/icon.png');
  
  if (process.platform === 'darwin') {
    app.dock.setIcon(iconPath);
  }

  const win = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 780,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#090A0C',
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

  if (isDev) {
    const devUrl = 'http://localhost:8081';
    win.loadURL(devUrl);
    win.webContents.on('did-fail-load', () => {
      setTimeout(() => {
        win.loadURL(devUrl);
      }, 1000);
    });
  } else {
    // In production (packaged), load the exported web build index.html
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, '../dist/index.html'),
        protocol: 'file:',
        slashes: true
      })
    );
  }
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
