'use strict'

import {app, protocol, BrowserWindow, ipcMain, dialog, Menu} from 'electron'
import {createProtocol} from 'vue-cli-plugin-electron-builder/lib'
import installExtension, {VUEJS_DEVTOOLS} from 'electron-devtools-installer'
import cp from 'child_process'

const isDevelopment = process.env.NODE_ENV !== 'production'
const fs = require('fs')
const edge = require("electron-edge-js")

var updateOnExit=false

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
            webviewTag: true
        },
        icon:"./core/favicon.ico"
    })

    ipcMain.on('reload-request',(event,payload)=>{
        win.reload()
    })

    ipcMain.on('quit-request',(event,payload)=>{
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
        if(updateOnExit){
            console.log('run updater')
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
    if (isDevelopment && !process.env.IS_TEST) {
        // Install Vue Devtools
        try {
            await installExtension(VUEJS_DEVTOOLS)
        } catch (e) {
            console.error('Vue Devtools failed to install:', e.toString())
        }
    }
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
        filters:[{
            name:"jpg图像文件",
            extensions:['jpg']
        }],
        properties: ['openFile']
    })
    event.reply('openFileDialog-reply', data)
})
ipcMain.on('scanDisks-request', (event, arg) => {
    // const findUSB = edge.func(function () {/*
    // using System.IO;
    //   async (input) => {
    //             DriveInfo[] drives = DriveInfo.GetDrives();
    //             string[] results = new string[drives.Length];
    //             int pointer = 0;
    //             foreach (DriveInfo i in drives)
    //             {
    //                 results[pointer] = i.Name + (i.DriveType == DriveType.Removable ? 1 : 0) + i.VolumeLabel;
    //                 //Console.WriteLine(results[pointer]);
    //                 pointer++;
    //             }
    //             return results;
    //     }*/
    // });
    const getDiskInfo=edge.func({
        assemblyFile: './core/DiskScanner.dll',
        typeName: 'DiskScanner.Scanner',
        methodName: 'getDiskInfo'
    })
    try{
        //throw 'error'
        getDiskInfo('0', function (error, result) {
            if (error) throw error;
            console.log(result)
            //解析为Json对象
            let json = {
                'names': [],
                'labels': [],
                'removable': []
            }
            result.forEach((i) => {
                if(i){
                    json['names'].push(i.slice(0, 1))
                    json['removable'].push(i.slice(3, 4))
                    json['labels'].push(i.slice(4))
                }
            })
            //console.log(json)
            if(json['names'].length===0) throw 'null result'
            event.reply('scanDisks-reply', json)
        })
    }catch (e) {
        console.log('c#运行失败')
        event.reply('scanDisks-reply', undefined)
    }


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
        }, (res) => {
            event.reply('unpackISO-reply', res)
        })
    }
})

ipcMain.on('devtool-request',(event,payload)=>{
    BrowserWindow.getAllWindows()[0].webContents.openDevTools()
})

ipcMain.on('version-request',(event,payload)=>{
    event.returnValue=app.getVersion()
})

ipcMain.on('isDev-request',(event,payload)=>{
    event.returnValue=isDevelopment
})

ipcMain.on('updateOnExit',(event,payload)=>{
    updateOnExit=true
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
