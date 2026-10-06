const { app, BrowserWindow, protocol, net, shell, session } = require('electron');
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

  const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

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
      allowRunningInsecureContent: false,
      devTools: isDev,
    },
  });

  // Secure window opening: only allow internal widget popups, open external links in default OS browser
  win.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    const isInternalWidget =
      targetUrl.includes('mode=widget') &&
      (targetUrl.startsWith('app://') || targetUrl.startsWith('http://localhost:8081'));

    if (isInternalWidget) {
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
            allowRunningInsecureContent: false,
            devTools: isDev,
          },
        },
      };
    }

    // External link: open in user default browser
    if (targetUrl.startsWith('https://') || targetUrl.startsWith('http://')) {
      shell.openExternal(targetUrl);
    }
    return { action: 'deny' };
  });

  // Prevent unauthorized in-window navigation away from the app
  win.webContents.on('will-navigate', (event, navigationUrl) => {
    const isLocal =
      navigationUrl.startsWith('app://') ||
      (isDev && navigationUrl.startsWith('http://localhost:8081'));
    if (!isLocal) {
      event.preventDefault();
      if (navigationUrl.startsWith('https://') || navigationUrl.startsWith('http://')) {
        shell.openExternal(navigationUrl);
      }
    }
  });

  // Block webview creation for security
  win.webContents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });

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
  const distDir = path.resolve(__dirname, '../dist');

  // Allow Supabase cloud API requests to authenticate and sync seamlessly without CORS blocks
  if (session && session.defaultSession) {
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
      const requestHeaders = { ...details.requestHeaders };
      if (details.url && details.url.includes('supabase.co')) {
        requestHeaders['Origin'] = 'https://trackheat.surge.sh';
        requestHeaders['Referer'] = 'https://trackheat.surge.sh/';
      }
      callback({ requestHeaders });
    });

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      const responseHeaders = { ...details.responseHeaders };
      if (details.url && details.url.includes('supabase.co')) {
        responseHeaders['access-control-allow-origin'] = ['*'];
        responseHeaders['access-control-allow-headers'] = ['*'];
        responseHeaders['access-control-allow-methods'] = ['*'];
      }
      callback({ responseHeaders });
    });
  }

  // Secure custom protocol handler with directory traversal prevention
  protocol.handle('app', (request) => {
    try {
      const parsedUrl = new URL(request.url);
      let pathname = decodeURIComponent(parsedUrl.pathname);
      if (pathname === '/' || !pathname) {
        pathname = '/index.html';
      }
      const safePath = path.normalize(path.join(distDir, pathname));
      // Strict directory traversal prevention
      if (!safePath.startsWith(distDir)) {
        return new Response('Forbidden', { status: 403 });
      }
      return net.fetch(url.pathToFileURL(safePath).toString());
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
