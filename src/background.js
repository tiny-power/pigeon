import { app, protocol, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
const isDevelopment = process.env.NODE_ENV !== 'production'
import path from 'path'

protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true } }
])

let mainWindow = null
async function createMainWindow() {
    if (!app.requestSingleInstanceLock()) {
        app.quit()
        return
    }

    mainWindow = new BrowserWindow({
        title: 'Pigeon',
        center: true,
        width: 1200,
        height: 680,
        resizable: false,
        maximizable: true,
        autoHideMenuBar: true,
        useContentSize: true,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    if (process.env.WEBPACK_DEV_SERVER_URL) {
        await mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
        if (!process.env.IS_TEST) mainWindow.webContents.openDevTools()
    } else {
        createProtocol('app')
        mainWindow.loadURL('app://./index.html')
    }

    ipcMain.handle('dialog:openDirectory', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openDirectory']
        })
        if (!canceled) {
            return filePaths[0]
        }
    })

    ipcMain.handle('dialog:openFile', async () => {
        if (process.platform == 'darwin') {
            const { canceled, filePaths } = await dialog.showOpenDialog({
                properties: ['openDirectory', 'openFile', 'multiSelections']
            })
            if (!canceled) {
                return filePaths
            }
        } else {
            const { canceled, filePaths } = await dialog.showOpenDialog({
                properties: ['openFile', 'multiSelections']
            })
            if (!canceled) {
                return filePaths
            }
        }
    })

    ipcMain.handle('openPath', async (event, args) => {
        shell.openPath(args)
    })

    ipcMain.handle('getDesktopPath', async () => {
        return app.getPath('desktop')
    })

    ipcMain.handle('getAppPath', async () => {
        let resourcesPath = process.resourcesPath
        if (process.platform == 'darwin') {
            resourcesPath = resourcesPath.replace('node_modules/electron/dist/Electron.app/Contents', '')
        } else if (process.platform == 'win32') {
            resourcesPath = resourcesPath.replace('node_modules\\electron\\dist', '')
        } else {
            resourcesPath = resourcesPath.replace('node_modules/electron/dist/Electron.app/Contents', '')
        }
        return { appPath: resourcesPath }
    })
}

app.on('second-instance', () => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        if (mainWindow.isVisible()) {
            mainWindow.focus()
        } else {
            mainWindow.show()
            mainWindow.setSkipTaskbar(false)
        }
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow()
    } else {
        mainWindow.show()
    }
})

app.on('ready', async () => {
    await createMainWindow()
})

if (isDevelopment) {
    if (process.platform === 'win32') {
        process.on('message', data => {
            if (data === 'graceful-exit') {
                app.quit()
            }
        })
    } else {
        process.on('SIGTERM', () => {
            app.quit()
        })
    }
}
