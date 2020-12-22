import Vue from 'vue'
import Vuex from 'vuex'
import DownloadManager from "@/components/DownloadManager";

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    cateData:[],
    allData:[],
    tasks:[[],[],[],[]], //保存aria2c返回的任务状态
    fileList:[], //保存由U盘获取的文件列表
    ourTasksPool:[], //提供由EL Store提交的任务清单
    globalData:{
      downloadSpeed: "0",
      numActive: "0",
      numStopped: "2",
      numStoppedTotal: "2",
      numWaiting: "1",
      uploadSpeed: "0"
    },
    stationUrl:'https://pineapple.edgeless.top/api/list/1',
    theme:'light',
    downloadDir:'D:',
    pluginPath:"D:\\Edgeless\\Resource",
    aria2cPath:"D:\\CnoRPS\\aria2c懒人包_1.35.0\\core",
    aria2cUri:'http://localhost:6800/jsonrpc'
  },
  mutations: {
    setCateData(state,d){
      state.cateData=d
    },
    appendAllData(state,d){
      state.allData.push(d)
    },
    clearData(state){
      state.allData=[]
      state.cateData=[]
    },
    updateTask(state,payload){
      state.tasks[payload.index]=payload.data
    },
    updateGlobalData(state,data){
      state.globalData=data
    },
    appendOurTasksPool(state,data){
      state.ourTasksPool.push(data)
    },
    removeTask(state,gid){
      let pointer=-1
      state.ourTasksPool.forEach((item,index)=>{
        if(item.gid===gid) pointer=index
      })
      //console.log(state.ourTasksPool)
      //console.log('gid:'+gid+' index:'+pointer)
      if(pointer!==-1){
        state.ourTasksPool.splice(pointer,1)
      }else{
        console.log('gid not find')
      }
    },
    setPluginPath(state,disk){
      state.pluginPath=disk+':\\Edgeless\\Resource'
    },
    setFileList(state,data){
      state.fileList=data
    }
}})
