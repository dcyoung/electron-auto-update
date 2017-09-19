/**
* app.js: 
* The electron "main" process that controls the application (entry point). 
* Manages the creation/destruction/visibility of all application windows, as well 
* as the communication between the render processes associated with each window. 
* The latter is handled via global event listeners using Electron’s IPC module.
**/

const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
// IPC Module 
const ipc = require('electron').ipcMain;
//dialog boxes
const dialog = require('electron').dialog;
// custom logging
const log = require('electron-log');
// access dev tools
require('electron-debug')({ enabled: true });

const autoUpdater = require("electron-updater").autoUpdater

/****************************************************************************************
* Custom Log File
* Setup a custom logger to create formatted logs at the following location:
*   on Linux: ~/.config/<app name>/log.log
*   on OS X: ~/Library/Logs/<app name>/log.log
*   on Windows: %USERPROFILE%\AppData\Roaming\<app name>\log.log
****************************************************************************************/
// disable console output from custom logger
log.transports.console = false;
// Set the logging level and format
log.transports.file.level = 'info';
log.transports.file.format = '{m}:{d}:{h}:{i}:{s}:{ms}  {level}: {text}';
// Set maximum log size in bytes. When it exceeds, old log will be saved as log.old.log file
log.transports.file.maxSize = 5 * 1024 * 1024;

/////////////////// Window Management ///////////////////////////////////////
//this main app.js process will handle the creation/destruction and visibility of all windows
let windowArray = [];

function getWindow(theWindowName) {
    for (let i = 0, len = windowArray.length; i < len; i++) {
        if (windowArray[i].name === theWindowName) {
            return windowArray[i];
        }
    }
    return null;
}

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
})

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindows();
    }
})


function createWindows() {
    // delete the cache incase there are previously stored files (such as the visualizer update URL etc)
    deleteCache();
    // creat the main window after the cache has been cleared
    createMainWindow();
}

//require the file system and path node modules
const fs = require('fs');
const path = require('path');
function deleteCache() {
    var chromeCacheDir = path.join(app.getPath('userData'), 'Cache');
    if (fs.existsSync(chromeCacheDir)) {
        var files = fs.readdirSync(chromeCacheDir);
        for (var i = 0; i < files.length; i++) {
            var filename = path.join(chromeCacheDir, files[i]);
            if (fs.existsSync(filename)) {
                try {
                    fs.unlinkSync(filename);
                }
                catch (e) {
                    console.log(e);
                }
            }
        }
    }
};

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
function sendStatusToWindow(text) {
    mainWindow.webContents.send('message', text);
}

autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Checking for update...');
});
autoUpdater.on('update-available', (info) => {
    sendStatusToWindow('Update available.');
});
autoUpdater.on('update-not-available', (info) => {
    sendStatusToWindow('Update not available.');
});
autoUpdater.on('error', (err) => {
    sendStatusToWindow('Error in auto-updater: ' + err.message);
});
autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    sendStatusToWindow(log_message);
});
autoUpdater.on('update-downloaded', (info) => {
    sendStatusToWindow('Update downloaded.');
    console.log("Update Downloaded");
    // autoUpdater.quitAndInstall();
});

//////////////////////DEFINE MAIN WINDOW/////////////////////////////////////
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
const windowStateKeeper = require('electron-window-state');

function createMainWindow() {
    // create a state keeper for the main window
    let mainWindowState = windowStateKeeper({
        defaultWidth: 1280,
        defaultHeight: 1280
    });

    // Create the browser window.
    mainWindow = new BrowserWindow({
        'x': mainWindowState.x,
        'y': mainWindowState.y,
        'width': mainWindowState.width,
        'height': mainWindowState.height,
        'minWidth': 850,
        'minHeight': 600
    });

    mainWindow.name = 'mainWindow';
    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/windows/main/main.html`);

    // Open the DevTools.
    //mainWindow.webContents.openDevTools({detach:true});


    // Register listeners on the window, so we can update the state
    // automatically (the listeners will be removed when the window is closed)
    // and restore the maximized or full screen state
    mainWindowState.manage(mainWindow);

    // check that the window was not restored to state that is incompatible with 
    // the current monitor setup. Center the window if so.
    const combinedScreenBounds = getCombinedScreenBounds();
    if (mainWindowState.x < combinedScreenBounds.x_min ||
        mainWindowState.y < combinedScreenBounds.y_min ||
        mainWindowState.x > combinedScreenBounds.x_max - 20 ||
        mainWindowState.y > combinedScreenBounds.y_max - 20) {
        mainWindow.center();
    }

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;

        //QUIT the application if the main window is closed.
        // Again, On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') {
            app.quit();
        }
    })
    windowArray.push(mainWindow);
}

// get the absolute min/max X & Y bounds considering all screens
function getCombinedScreenBounds() {
    // note the present screens
    let primaryScreen = electron.screen.getPrimaryDisplay();
    let allDisplays = electron.screen.getAllDisplays();
    let numDisplays = allDisplays.length;

    // get info about the primary screen
    const primaryOrigin_X = primaryScreen.bounds.x;
    const primaryOrigin_Y = primaryScreen.bounds.y;
    const primaryDimensions = primaryScreen.workAreaSize;

    // initialize the min/max X & Y based off the primary screen
    let min_X = primaryOrigin_X,
        max_X = primaryOrigin_X + primaryDimensions.width,
        min_Y = primaryOrigin_Y,
        max_Y = primaryOrigin_Y + primaryDimensions.height;

    // look through all the displays to update min and max X and Y
    let display, x, y, dimensions;
    for (let i = 0; i < numDisplays; i++) {
        display = allDisplays[i];
        x = display.bounds.x;
        y = display.bounds.y;
        dimensions = display.workAreaSize;

        if (x < min_X) {
            min_X = x;
        }
        if (y < min_Y) {
            min_Y = y;
        }
        if ((x + dimensions.width) > max_X) {
            max_X = x + dimensions.width;
        }
        if ((y + dimensions.height) > max_Y) {
            max_Y = y + dimensions.height;
        }
    }

    return {
        x_min: min_X,
        x_max: max_X,
        y_min: min_Y,
        y_max: max_Y
    }
}

ipc.on('shutdown', function () {
    app.exit();
})


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function () {
    // create the windows
    createWindows();
    setTimeout(function () {
        sendStatusToWindow("Test");
        autoUpdater.checkForUpdates();
    }, 5000);
});

