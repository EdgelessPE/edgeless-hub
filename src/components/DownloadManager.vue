<script>
import {notification} from 'ant-design-vue'
const urlencode = require('urlencode')
const fs=window.require('fs')
const path = require('path')
export default {
name: "DownloadManager",
  data(){
  return{
    axios:'',
    store:'',
    path:'',
    downloadDir:''
  }
  },
  methods:{
    //添加下载任务
    taskAdd(add,name){
      this.aria2cDownloader(add,false,(res)=>{
        let splitResult=add.split('/')
        let trueName=splitResult[splitResult.length-1]
        let uriName=urlencode(trueName)
        console.log(uriName+' true:'+trueName)
        this.store.commit('appendOurTasksPool',{
          name:name,
          gid:res.data.result,
          uri:add,
          uriName:uriName,
          trueName:trueName
        })
      })
    },
    //取消暂停（继续下载）
    taskPause(gid){
      this.aria2cHelper("aria2.pause",[gid],(data)=>{})
    },
    //取消暂停（继续下载）
    taskUnpause(gid){
      this.aria2cHelper("aria2.unpause",[gid],(data)=>{})
    },
    //重新开始
    taskRestart(info){
      //删除临时文件
      let curPath=path.join(this.downloadDir,info.uriName)
      console.log(curPath)
      if(fs.existsSync(curPath)){
        fs.unlinkSync(curPath)
        fs.unlinkSync(curPath+'.aria2')
      }

      //重新提交任务
      this.aria2cDownloader(info.uri,true,(res)=>{
        this.store.commit('appendOurTasksPool',{
          name:info.name,
          gid:res.data.result,
          uri:info.uri,
          uriName:info.uriName,
          trueName:info.trueName
        })
      })
    },



    //更新状态相关
    updateMaster(){
      this.updateGlobalState()
      this.updateRunningTasks()
    },
    updateGlobalState(){
      this.aria2cHelper_noParams('aria2.getGlobalStat',(res)=>{
        this.store.commit('updateGlobalData',res.data.result)
      })
    },
    updateRunningTasks(){
      this.getTasks("aria2.tellActive",(data)=>{
        this.store.commit('updateTask',{data:data,index:0})
      })
      this.getTasks("aria2.tellWaiting",(data)=>{
        this.store.commit('updateTask',{data:data,index:1})
      })
      this.getTasks("aria2.tellStopped",(data)=>{
        //分离成功的和失败的任务
        let succeed=[],fail=[]
        data.forEach((item)=>{
          if(item.completedLength===item.totalLength) succeed.push(item)
          else fail.push(item)
        })
        this.store.commit('updateTask',{data:succeed,index:2})
        this.store.commit('updateTask',{data:fail,index:3})
      })
    },

    //辅助工具
    //负责填充参数数组、过滤结果
    getTasks(method,callback){
      let params=[]
      switch(method){
        case "aria2.tellActive":
          params[0]=["gid", "totalLength", "completedLength", "uploadSpeed", "downloadSpeed", "connections", "numSeeders","seeder","status","errorCode","verifiedLength","verifyIntegrityPending"]
          break
        case "aria2.tellWaiting":
          params[0]=0
          params[1]=1000
          params[2]=["gid", "totalLength", "completedLength", "uploadSpeed", "downloadSpeed", "connections", "numSeeders","seeder","status","errorCode","verifiedLength","verifyIntegrityPending"]
          break
        case "aria2.tellStopped":
          params[0]=-1
          params[1]=1000
          params[2]=["gid", "totalLength", "completedLength", "uploadSpeed", "downloadSpeed", "connections", "numSeeders","seeder","status","errorCode","verifiedLength","verifyIntegrityPending"]
          break
      }
      this.aria2cHelper(method,params,(res)=>{
        //console.log(res.data)
        //筛选结果
        let raw=res.data.result,selected=[],info
        if(raw.length>0){
          raw.forEach((item)=>{
            info=this.getTaskInfo(item.gid)
            if(info.isOurTask) {
              let tmp=item
              tmp['name']=info.name
              tmp['info']=info.info
              selected.push(tmp)
            }
          })
        }
        callback(selected)
      })
    },
    //查询是否是Edgeless Store创建的任务
    getTaskInfo(gid){
      let pool=this.store.state.ourTasksPool,name="",info
      pool.forEach((item)=>{
        if(item.gid===gid) {
          name=item.name
          info=item
        }
      })

      if(name!=="") {
        return {
          isOurTask:true,
          name:name,
          info:info
        }
      }else return {
        isOurTask:false,
        name:'Unknown'
      }
    },


    //aria2c交互工具
    generateID(){
      return "2333"
      //let date=new Date()
      //return date.getDay().toString()+date.getHours().toString()+date.getMinutes().toString()+date.getSeconds().toString()+date.getMilliseconds().toString()+(Math.random()*1000).toFixed(0).toString()
    },
    aria2cHelper_noParams(method,callback){
      this.axios.post(this.path,{
        'id':this.generateID(),
        'jsonrpc':"2.0",
        'method':method
      }).then(callback)
          .catch((err)=>{
            notification.open({
              message:'Aria2cHelper_noParams',
              description:"aria2c通讯错误："+err.message
            })
          })
    },
    aria2cHelper(method,params,callback){
      this.axios.post(this.path,{
        'id':this.generateID(),
        'jsonrpc':"2.0",
        'method':method,
        'params':params
      }).then(callback)
      .catch((err)=>{
        //处理已知的特殊错误
        if(method==="aria2.pause"&&err.response.data.error.code===1){
          notification.open({
            message:'Aria2cHelper',
            description:"现在无法暂停此任务"
          })
        }else{
          notification.open({
            message:'Aria2cHelper：'+err.message,
            description:err.response.data.error.message
          })
        }

      })
    },
    aria2cDownloader(address,overwrite,callback){
      this.axios.post(this.path,{
        'id':this.generateID(),
        'jsonrpc':"2.0",
        'method':'aria2.addUri',
        'params':[[address],{
          'dir':this.downloadDir,
          'allow-overwrite': overwrite?"true":"false"
        }]
      }).then(callback)
          .catch((err)=>{
            notification.open({
              message:'Aria2cDownloader',
              description:"aria2c通讯错误："+err.message
            })
          })
    },

    //初始化
    init(axios,store){
      this.axios=axios
      this.store=store

      this.path=this.store.state.aria2cUri
      this.downloadDir=this.store.state.downloadDir
    }
  }

}
</script>