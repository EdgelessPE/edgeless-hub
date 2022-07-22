'use strict'

import {app, protocol, BrowserWindow, ipcMain, dialog, Menu, shell} from 'electron'
import {createProtocol} from 'vue-cli-plugin-electron-builder/lib'
import cp from 'child_process'
import vp from '@/utils/what-did-ventoy-do'
import path from 'path'

const isDevelopment = process.env.NODE_ENV !== 'production'
const fs = require('fs')

var updateOnExit = false

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
    {scheme: 'app', privileges: {secure: true, standard: true}}
])

function killAria2c() {
    cp.exec('TASKKILL /F /IM aria2c.exe /T', (err, stdout, stderr) => {
        //console.log(stdout)
    })
}

async function createWindow() {
    Menu.setApplicationMenu(null)
    // Create the browser window.
    const win = new BrowserWindow({
        width: 1600,
        height: 800,
        webPreferences: {
            // Use pluginOptions.nodeIntegration, leave this alone
            // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            webSecurity: false,
            webviewTag: true,
            contextIsolation: false,
            enableRemoteModule: true,
            preload: 'preload.js'
        },
        icon: "./core/favicon.ico"
    })

    ipcMain.on('reload-request', (event, payload) => {
        win.reload()
    })

    ipcMain.on('quit-request', (event, payload) => {
        win.close()
    })

    if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
        if (!process.env.IS_TEST) win.webContents.openDevTools()
    } else {
        createProtocol('app')
        // Load the index.html when not in development
        win.loadURL('app://./index.html')
    }

    win.on('close', (event) => {
        killAria2c()
        if (updateOnExit) {
            cp.exec('start cmd /c main.cmd')
        }
        //console.error('close')
        app.exit()
    })

}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        killAria2c()
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
    createWindow()
})

//监听、回复渲染进程发送的事件
ipcMain.on('openDirectoryDialog-request', (event, arg) => {
    let data = dialog.showOpenDialogSync({
        title: "请选择下载缓存目录",
        properties: ['openDirectory']
    })
    event.reply('openDirectoryDialog-reply', data)
})
ipcMain.on('openFileDialog-request', (event, arg) => {
    let data = dialog.showOpenDialogSync({
        title: "请选择壁纸文件",
        filters: [{
            name: "jpg图像文件",
            extensions: ['jpg']
        }],
        properties: ['openFile']
    })
    event.reply('openFileDialog-reply', data)
})


ipcMain.on('unzip-request', (event, payload) => {
    let node7z = require('node-7zip')
    //console.log(payload)
    node7z.unzip(payload.zip, payload.path)
        .then((res) => {
            event.reply('unzip-reply', payload.zip)
        })
})

ipcMain.on('unpackISO-request', (event, payload) => {
    if (fs.existsSync(payload.dst + '\\sources\\boot.wim')) {
        event.reply('unpackISO-reply', '')
    } else {
        cp.exec('.\\core\\UltraISO\\UltraISO.exe -input "' + payload.src + '" -extract "' + payload.dst + '"', {
            windowsHide: true
        }, () => {
            event.reply('unpackISO-reply', '')
        })
    }
})

ipcMain.on('devtool-request', (event, payload) => {
    let wc=BrowserWindow.getAllWindows()[0].webContents
    wc.toggleDevTools()
})

ipcMain.on('version-request', (event, payload) => {
    event.returnValue = app.getVersion()
})

ipcMain.on('isDev-request', (event, payload) => {
    event.returnValue = isDevelopment
})

ipcMain.on('trash-request', (event, payload) => {
    event.returnValue = shell.moveItemToTrash(payload)
})

ipcMain.on('updateOnExit', (event, payload) => {
    updateOnExit = true
})

ipcMain.on('getVentoyDisk', (event, log_path) => {
    try {
        let log = fs.readFileSync(log_path).toString()
        let result = vp(log)
        console.log(JSON.stringify(result))
        let target = ""
        let possibleLetter = "A"

        //获得最后一个安装了Ventoy的盘
        for (let i = 0; i < result.systemInfo.drives.length; i++) {
            let disk = result.systemInfo.drives[i]
            console.log("checking ventoy " + disk.letter)
            if (disk.ventoyStatus.installed || disk.ventoyStatus.updated) {
                if (possibleLetter < disk.letter) {
                    target = disk
                    possibleLetter = disk.letter
                    console.log("find ventoy in " + disk.letter)
                }
            }
        }

        //如果结果为空，选中最后一个可移动设备
        if (target === "") {
            for (let i = 0; i < result.systemInfo.drives.length; i++) {
                let disk = result.systemInfo.drives[i]
                console.log("checking removable " + disk.letter)
                if (disk.removable) {
                    if (possibleLetter < disk.letter) {
                        target = disk
                        possibleLetter = disk.letter
                        console.log("find removable in " + disk.letter)
                    }
                }
            }
        }

        event.returnValue = {
            target,
            parse_result: result
        }
    } catch (e) {
        console.log("Error getting VentoyDisk")
        event.returnValue = {
            target: "",
            parse_result: e
        }
    }
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === 'win32') {
        process.on('message', (data) => {
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
