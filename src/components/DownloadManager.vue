<script>
import {notification} from 'ant-design-vue'
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
      this.aria2cDownloader(add,(res)=>{
        this.store.commit('appendOurTasksPool',{
          name:name,
          gid:res.data.result
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
        this.store.commit('updateTask',{data:data,index:2})
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
              selected.push(tmp)
            }
          })
        }
        callback(selected)
      })
    },
    //查询是否是Edgeless Store创建的任务
    getTaskInfo(gid){
      let pool=this.store.state.ourTasksPool,name=""
      pool.forEach((item)=>{
        if(item.gid===gid) {
          name=item.name
        }
      })

      if(name!=="") {
        return {
          isOurTask:true,
          name:name
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
        notification.open({
          message:'Aria2cHelper',
          description:"aria2c通讯错误："+err.message
        })
      })
    },
    aria2cDownloader(address,callback){
      this.axios.post(this.path,{
        'id':this.generateID(),
        'jsonrpc':"2.0",
        'method':'aria2.addUri',
        'params':[[address],{
          'dir':this.downloadDir
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