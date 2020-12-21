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
    updateGlobalState(){
      this.aria2cHelper('getGlobalStat',(res)=>{
        return res.data.result
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

    //套接工具
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
        callback(res.data.result)
      })
    },


    //aria2c交互工具
    generateID(){
      let date=new Date()
      return date.getDay().toString()+date.getHours().toString()+date.getMinutes().toString()+date.getSeconds().toString()+date.getMilliseconds().toString()+(Math.random()*1000).toFixed(0).toString()
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