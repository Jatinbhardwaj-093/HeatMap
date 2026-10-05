const { app, BrowserWindow, protocol, net } = require('electron');
const path = require('path');
const url = require('url');

// Register privileged custom protocol before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

function createWindow() {
  const iconPath = path.join(__dirname, '../assets/icon.png');

  if (process.platform === 'darwin') {
    app.dock.setIcon(iconPath);
  }

  const win = new BrowserWindow({
    title: 'TrackHeat',
    width: 1180,
    height: 820,
    minWidth: 780,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 18, y: 18 },
    backgroundColor: '#090A0C',
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  win.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (targetUrl.includes('mode=widget')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          title: 'TrackHeat Widget',
          width: 380,
          height: 220,
          minWidth: 300,
          minHeight: 160,
          alwaysOnTop: true,
          titleBarStyle: 'hiddenInset',
          trafficLightPosition: { x: 12, y: 12 },
          backgroundColor: '#090A0C',
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
          },
        },
      };
    }
    return { action: 'allow' };
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
    // In production, load via custom 'app' protocol which maps to the dist directory
    win.loadURL('app://./index.html').catch(() => {
      // Fallback to direct file path
      const filePath = path.join(__dirname, '../dist/index.html');
      win.loadURL(url.pathToFileURL(filePath).toString());
    });
  }

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.warn('Page failed to load:', errorCode, errorDescription);
  });
}

app.whenReady().then(() => {
  const distDir = path.join(__dirname, '../dist');

  protocol.handle('app', (request) => {
    try {
      const parsedUrl = new URL(request.url);
      let pathname = decodeURIComponent(parsedUrl.pathname);
      if (pathname === '/' || !pathname) {
        pathname = '/index.html';
      }
      const filePath = path.join(distDir, pathname);
      return net.fetch(url.pathToFileURL(filePath).toString());
    } catch (err) {
      console.warn('Protocol fetch error, serving index.html fallback:', err);
      const fallback = path.join(distDir, 'index.html');
      return net.fetch(url.pathToFileURL(fallback).toString());
    }
  });

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
