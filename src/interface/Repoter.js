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
    if(HOLIDAY) return
    interval=setInterval(()=>{
        if(!clearBuffer){
            writeToFile()
            clearBuffer=true
        }
    },INTERVAL_TIME*1000)
}
export function destroy() {
    if(HOLIDAY) return
    clearInterval(interval)
}

const HOLIDAY=false
const LOG_PATH='./Log.txt'
const INTERVAL_TIME=2
var buffer=new String('Start reporting')
var interval
var clearBuffer=true

function appendToBuffer(msg,level) {
    if(HOLIDAY) return
    const date=new Date()
    let content_time=date.getHours().toString()+":"+date.getMinutes().toString()+":"+date.getSeconds().toString()

    buffer=buffer.concat('\n',content_time,"-",level," ",msg)
    clearBuffer=false
}

function writeToFile() {
    if(HOLIDAY) return
    fs.writeFile(LOG_PATH,buffer.toString(),()=>{})
}