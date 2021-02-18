const fs = window.require('fs')

export function log(msg) {
    appendToBuffer(msg,"log")
}
export function warning (msg) {
    appendToBuffer(msg,"warning")
}
export function error (msg){
    appendToBuffer(msg,"error")
}

export function init() {
    interval=setInterval(()=>{
        if(!clearBuffer){
            writeToFile()
            clearBuffer=true
        }
    },INTERVAL_TIME*1000)
}
export function destroy() {
    clearInterval(interval)
}


const LOG_PATH='./Log.txt'
const INTERVAL_TIME=2
var buffer=new String('Start reporting')
var interval
var clearBuffer=true

function appendToBuffer(msg,level) {
    const date=new Date()
    let content_time=date.getHours().toString()+":"+date.getMinutes().toString()+":"+date.getSeconds().toString()

    buffer=buffer.concat('\n',content_time,"-",level,"-",msg)
    clearBuffer=false
}

function writeToFile() {
    console.log('write')
    fs.writeFile(LOG_PATH,buffer.toString(),()=>{})
}