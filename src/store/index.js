import Vue from 'vue'
import Vuex from 'vuex'
import StationList from '@/stationpool/main'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    //需要写入config的配置
    //stationUrl:'https://pineapple.edgeless.top/api/list/1',
    stationIndex:0,
    theme:'light',
    downloadDir:'D:\\ELStore',

    //无需保存到config的数据
    stationObject:{
      init:function (axios,callback){},
      getCateData:function (callback) {},
      getPluginList:function (cateName,callback){},
      name:''
    },
    cateData:[],
    allData:[],
    versionCache:[], //缓存在线版本的查询结果
    tasks:[[],[],[],[]], //保存aria2c返回的任务状态
    fileList:[], //保存由U盘获取的文件列表
    updateList:[], //保存需要更新的插件列表
    ourTasksPool:[], //提供由EL Store提交的任务清单
    globalData:{
      downloadSpeed: "0",
      numActive: "0",
      numStopped: "2",
      numStoppedTotal: "2",
      numWaiting: "1",
      uploadSpeed: "0"
    },
    pluginPath:'A:\\Edgeless\\Resource',
    aria2cPath:"./core",
    aria2cUri:'http://localhost:6800/jsonrpc',

    //复制队列相关
    copyRunningPool:[],
    copyEndedPool:[],
    copyWaitingPool:[], //等待启动盘插入后进行复制的任务清单

    //下载制作相关文件信息
    fileNames:['','',''], //ventoy,ventoy_plugin,iso
    ventoyInfo:{
      needTrace:false,
      gid:"",
      task:{
        "totalLength":1,
        "completedLength":0,
        "downloadSpeed":1
      }
    },
    ventoyPluginInfo:{
      needTrace:false,
      gid:"",
      task:{
        "totalLength":1,
        "completedLength":0,
        "downloadSpeed":1
      }
    },
    isoInfo:{
      needTrace:false,
      gid:"",
      task:{
        "totalLength":1,
        "completedLength":0,
        "downloadSpeed":1
      }
    },
    BurnStateStorage:{
      startedTasks:[false,false,false],
      finishedTasks:[false,false,false],
      whenReadyUnzip:false,
      showExecVentoyButton:false,
      showProgress:false,
      speed:0.1,
      stageLimit:0.3,
      selectedVentoyPart:"",
      ventoyInfo:{
        'version':"",
        'gid':"",
        'url':"",
        'fileName':"",
        'ventoyPath':"",
        'pluginName':"ventoy_wimboot.img",
        'finishUnzip':false,
        'queryUrl':'https://gitee.com/api/v5/repos/longpanda/Ventoy/releases/latest' //'https://gitee.com/api/v5/repos/longpanda/Ventoy/releases/latest'
      },
      stepsInfo:{
        hasVentoy:false,
        step:0,
        stepText:"开始",
        step3percent:0,
        data:[
          {
            title:"下载依赖文件",
            content:"Edgeless Hub将自动获取最新版Ventoy启动盘制作程序"
          },
          {
            title: "安装Ventoy",
            content:"手动点击，将Ventoy安装至您的U盘"
          },
          {
            title: "部署Edgeless",
            content: "Edgeless Hub会自动处理启动盘以完成Edgeless的安装"
          }
        ]
      },
    },

    //Update相关信息
    UpdateInfo:{
      state:0,//0等待用户开始下载或其他，1正在下载中，2正在解压和复制，3完成
      gid:"",
      task:{
        "totalLength":1,
        "completedLength":0,
        "downloadSpeed":1
      },
      taskStopped:false //任务是否已经暂停
    },

    //Alpha相关信息
    AlphaInfo:{
      state:0,//0等待用户开始下载或其他，1正在下载中，2正在复制，3完成
      gid:"",
      task:{
        "totalLength":1,
        "completedLength":0,
        "downloadSpeed":1
      },
      taskStopped:false //任务是否已经暂停
    },

    //盘内的Edgeless版本号
    EdgelessVersion:"Edgeless_Beta_Ofial_Undefined_2",
    wikiUrl:"https://wiki.edgeless.top/v2"
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
    },
    setUpdateList(state,data){
      state.updateList=data
    },
    addCopyingTask(state,payload){
      //console.log('start copy:'+payload.name)
      state.copyRunningPool.push(payload)
    },
    delCopyingTask(state,gid){
      let index1=-1,index2=-1
      for(let i=0;i<state.copyRunningPool.length;i++){
        if(state.copyRunningPool[i].gid===gid){
          index1=i
          break
        }
      }
      for(let i=0;i<state.copyWaitingPool.length;i++){
        if(state.copyWaitingPool[i].gid===gid){
          index2=i
          break
        }
      }
      let pushed=false
      if(index1!==-1){
        state.copyEndedPool.push(state.copyRunningPool[index1])
        state.copyRunningPool.splice(index1,1)
        pushed=true
      }
      if(index2!==-1) {
        if(!pushed) state.copyEndedPool.push(state.copyWaitingPool[index2])
        state.copyWaitingPool.splice(index2, 1)
      }else{
        console.log('gid not found:'+gid)
      }
    },
    appendVersionCache(state,data){
      state.versionCache.push(data)
    },
    addWaitingTask(state,data){
      state.copyWaitingPool.push(data)
    },
    clearWaitingTask(state){
      state.copyWaitingPool=[]
    },
    changeDownloadDir(state,path){
      state.downloadDir = path
    },
    updateByConfig(state,config){
      state.downloadDir=config.downloadDir
      state.theme=config.theme
      state.stationIndex=config.stationIndex
    },
    changeTheme(state,theme){
      state.theme=theme
    },
    changeVentoyInfo(state,payload){
      state.ventoyInfo=payload
    },
    changeVentoyPluginInfo(state,payload){
      state.ventoyPluginInfo=payload
    },
    changeIsoInfo(state,payload){
      state.isoInfo=payload
    },
    changeFileName(state,payload){
      state.fileNames[payload.index]=payload.data
    },
    saveBurnState(state,payload){
      state.BurnStateStorage=payload
    },
    saveWikiUrl(state,url){
      state.wikiUrl=url
    },
    updateStationObject(state,index){ //更新镜像源插件对象
      state.stationIndex=index
      state.stationObject=StationList[index]
    },
    setUpdateGid(state,gid){
      state.UpdateInfo.gid=gid
    },
    setUpdateTask(state,task){
      state.UpdateInfo.task=task
    },
    setUpdateState(state,code){
      state.UpdateInfo.state=code
    },
    setUpdateStopped(state,payload){
      state.UpdateInfo.taskStopped=payload
    },
    setAlphaGid(state,gid){
      state.AlphaInfo.gid=gid
    },
    setAlphaTask(state,task){
      state.AlphaInfo.task=task
    },
    setAlphaState(state,code){
      state.AlphaInfo.state=code
    },
    setAlphaStopped(state,payload){
      state.AlphaInfo.taskStopped=payload
    },
    changeEdgelessVersion(state,payload){
      state.EdgelessVersion=payload
    }
}})
