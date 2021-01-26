<script>
import {notification} from 'ant-design-vue'
const urlencode = require('urlencode')
const fs=window.require('fs')
const path = require('path')
export default {
name: "DownloadManager",
  data(){
  return{
    path:'',
    downloadDir:'',
    $store:'',
    $axios:'',
    $root:''
  }
  },
  methods:{
    //添加下载任务
    taskAdd(add,name){
      let splitResult=add.split('/')
      let trueName=splitResult[splitResult.length-1]
      let uriName=urlencode(trueName)
      //使用缓存
      if(fs.existsSync(path.join(this.$store.state.downloadDir,trueName))&&!fs.existsSync(path.join(this.$store.state.downloadDir,uriName)+'.aria2')) {
        fs.renameSync(path.join(this.$store.state.downloadDir, trueName), path.join(this.$store.state.downloadDir, uriName))
        console.log('use cache')
      }
      this.aria2cDownloader(add,false,(res)=>{
        //console.log(uriName+' true:'+trueName)
        this.$store.commit('appendOurTasksPool',{
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
      let curPath=path.join(this.$store.state.downloadDir,info.uriName)
      //console.log(curPath)
      if(fs.existsSync(curPath)){
        fs.unlinkSync(curPath)
        fs.unlinkSync(curPath+'.aria2')
      }

      //重新提交任务
      this.aria2cDownloader(info.uri,true,(res)=>{
        this.$store.commit('appendOurTasksPool',{
          name:info.name,
          gid:res.data.result,
          uri:info.uri,
          uriName:info.uriName,
          trueName:info.trueName
        })
      })
    },

    //读写配置文件相关
    writeConfig(){
      let data={
        stationUrl:this.$store.state.stationUrl,
        theme:this.$store.state.theme,
        downloadDir:this.$store.state.downloadDir,
      }
      fs.writeFileSync('./elstore_config.json',JSON.stringify(data))
    },
    readConfig(){
      let json={}
      if(fs.existsSync('./elstore_config.json')){
        json=fs.readFileSync('./elstore_config.json').toString()
        json=JSON.parse(json)
        if(fs.existsSync(json.downloadDir)) json['exist']=true
        else json['exist']=false
        //console.log(json)
      }else{
        json['exist']=false
      }
      return json
    },

    //更新状态相关
    updateMaster(){
      this.updateGlobalState()
      this.updateRunningTasks()
    },
    updateGlobalState(){
      this.aria2cHelper_noParams('aria2.getGlobalStat',(res)=>{
        this.$store.commit('updateGlobalData',res.data.result)
      })
    },
    updateRunningTasks(){
      this.getTasks("aria2.tellActive",(data)=>{
        this.$store.commit('updateTask',{data:data,index:0})
      })
      this.getTasks("aria2.tellWaiting",(data)=>{
        this.$store.commit('updateTask',{data:data,index:1})
      })
      this.getTasks("aria2.tellStopped",(data)=>{
        //分离成功的和失败的任务
        let succeed=[],fail=[]
        data.forEach((item)=>{
          if(item.completedLength===item.totalLength) succeed.push(item)
          else fail.push(item)
        })

        //将Urlencode的文件名重命名为正常文件名，然后将其加入复制队列
        succeed.forEach((item)=>{
          if(fs.existsSync(path.join(this.$store.state.downloadDir,item.info.uriName))){
            //重命名
            if(item.info.uriName!==item.info.trueName) fs.renameSync(path.join(this.$store.state.downloadDir,item.info.uriName),path.join(this.$store.state.downloadDir,item.info.trueName))
            //检查是否需要执行拷贝
            if(this.needCopy(item.gid)){
              //加入拷贝等候队列
              this.$store.commit('addWaitingTask',{
                name:item.name,
                totalLength:item.totalLength,
                gid:item.gid,
                version:item.info.trueName.split('_')[1],
                trueName:item.info.trueName
              })
            }
          }
        })
        //更新到Vuex中
        this.$store.commit('updateTask',{data:succeed,index:2})
        this.$store.commit('updateTask',{data:fail,index:3})
      })
    },
    //是否存在U盘
    usbIn(){
      return fs.existsSync(this.$store.state.pluginPath)
    },
    exist(path){
      return fs.existsSync(path)
    },
    mkdir(path){
      try{
        fs.mkdirSync(path)
      }catch (err){
        return false
      }
      return fs.existsSync(path)
    },
    copy(src,dst,callback){
      if(!this.exist(dst)) this.mkdir(dst)
      fs.copyFile(src,dst,callback)
    },
    del(filePath){
      console.log('delete'+filePath)
      if(fs.existsSync(filePath)){
        fs.unlinkSync(filePath)
        return true
      }else return false
    },
    //返回合法的Edgeless启动盘数组，第一项的值为“自动”
    getUSBList(){
      let path,disks=['自动']
      for(let i=25;i>=0;i--){
        path=String.fromCharCode(65+i)+':\\Edgeless\\Resource'
        if(fs.existsSync(path)) {
          disks.push(String.fromCharCode(65 + i))
        }
      }
      return disks
    },
    //将指定插件包从下载目录拷贝至U盘中（传入任务信息对象）
    copyFile(task){
      //console.log('run copy:'+task.name)
      //检查启动盘是否插入、文件是否存在
      if(fs.existsSync(this.$store.state.pluginPath)&&fs.existsSync(path.join(this.$store.state.downloadDir,task.trueName))){
        //向任务池注册任务
        this.$store.commit('addCopyingTask',task)
        //执行异步拷贝
        fs.copyFile(path.join(this.$store.state.downloadDir,task.trueName),path.join(this.$store.state.pluginPath,task.trueName),()=>{
          //通知任务完成
          this.$root.eventHub.$emit('copy-file-finish',task)
          //console.log('finish copy:'+task.name)
          //移动此任务在Vuex中的位置（从running和waiting列表中移出，并加入ended列表）
          this.$store.commit('delCopyingTask',task.gid)
        })
      }else{
        return false
      }
      return true
    },
    //从启动盘目录删除指定文件
    delPlugin(name){
      let curpath=path.join(this.$store.state.pluginPath,name)
      if(fs.existsSync(curpath)){
        fs.unlinkSync(curpath)
        return true
      }else return false
    },
    //配置Edgeless插件包目录
    setPluginPath(){
      let path,disk="-1"
      for(let i=25;i>=0;i--){
        path=String.fromCharCode(65+i)+':\\Edgeless\\Resource'
        if(fs.existsSync(path)) {
          disk = String.fromCharCode(65 + i)
          break
        }
      }
      if(disk!=="-1"){
        this.$store.commit('setPluginPath',disk)
        //console.log('plugin disk:'+disk)
        return true
      }else{
        //console.log('no edgeless uDisk found')
        return false
      }
    },
    //扫描EdgelessU盘内插件包文件夹的信息
    getPluginList(){
      //判断目录是否仍存在
      if(!fs.existsSync(this.$store.state.pluginPath)) return false
      //读取文件列表
      let files=fs.readdirSync(this.$store.state.pluginPath)
      //过滤并解析
      let result=[],update=[],data_tmp
      files.forEach((item)=>{
        if(item.indexOf('.7z')!==-1){
          let info=item.split('_')
          //识别文件名不规范的7z压缩包
          if(info.length!==3){
            result.push({
              'name':item.split('.7z')[0],
              'totalLength':fs.statSync(path.join(this.$store.state.pluginPath,item)).size,
              'softName':item.split('.7z')[0],
              'softVer':'unknown',
              'softAuthor':'unknown',
              'onlineVer':'null',
              'trueName':item
            })
          }else if(!this.stillCopying(info[0])){
            //判断是否需要升级
            data_tmp=this.getVersionAndUrl(info[0])
            if(data_tmp.version==='null'||data_tmp.version===info[1]){
              result.push({
                'name':info[0],
                'totalLength':fs.statSync(path.join(this.$store.state.pluginPath,item)).size,
                'softName':info[0],
                'softVer':info[1],
                'softAuthor':info[2].split('.7z')[0],
                'onlineVer':data_tmp.version,
                'trueName':item
              })
            }else{
              update.push({
                'name':info[0],
                'totalLength':fs.statSync(path.join(this.$store.state.pluginPath,item)).size,
                'softName':info[0],
                'softVer':info[1],
                'softAuthor':info[2].split('.7z')[0],
                'trueName':item,
                'onlineVer':data_tmp.version,
                'url':data_tmp.url
              })
            }
          }
        }
      })
      //console.log(result)
      this.$store.commit('setFileList',result)
      this.$store.commit('setUpdateList',update)
      return true
    },
    disablePlugin(localName){
      //检查“过期插件包”文件夹
      if(!fs.existsSync(path.join(this.$store.state.pluginPath,'过期插件包'))) {
        fs.mkdirSync(path.join(this.$store.state.pluginPath,'过期插件包'))
      }
      if(fs.existsSync(path.join(this.$store.state.pluginPath,localName))){
        let tmp='过期插件包/'+localName+'f'
        fs.renameSync(path.join(this.$store.state.pluginPath,localName),path.join(this.$store.state.pluginPath,tmp))
        return true
      }
      return false
    },

    //辅助工具
    //获取插件最新版本号
    getVersionAndUrl(name){
      let version='null',url=''
      for(let i=0;i<this.$store.state.versionCache.length;i++){
        if(this.$store.state.versionCache[i].name===name) {
          version=this.$store.state.versionCache[i].version
          url=this.$store.state.versionCache[i].url
          break
        }
      }
      if(version==='null'){
        for(let i=0;i<this.$store.state.allData.length;i++){
          for (let j=0;j<this.$store.state.allData[i].files.length;j++){
            if(this.$store.state.allData[i].files[j].name.split('_')[0]===name){
              version=this.$store.state.allData[i].files[j].name.split('_')[1]
              url=this.$store.state.allData[i].files[j].url
              break
            }
          }
        }
        //写入缓存，无论是否找到结果
        this.$store.commit('appendVersionCache',{
          name:name,
          version:version,
          url:url
        })
      }
      return {
        version:version,
        url:url
      }
    },
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
            }else if(item.gid===this.$store.state.ventoyInfo.gid){
              //将ventoy的下载信息放置到store内
              let info=this.$store.state.ventoyInfo
              info.task=item
              if(method==="aria2.tellStopped") {
                  info.needTrace = false
              }
              this.$store.commit('changeVentoyInfo',info)
            }else if(item.gid===this.$store.state.ventoyPluginInfo.gid){
              //将ventoy插件的下载信息放置到store内
              let info=this.$store.state.ventoyPluginInfo
              info.task=item
              if(method==="aria2.tellStopped") {
                info.needTrace = false
              }
              this.$store.commit('changeVentoyPluginInfo',info)
            }else if(item.gid===this.$store.state.isoInfo.gid){
              //将iso的下载信息放置到store内
              let info=this.$store.state.isoInfo
              info.task=item
              if(method==="aria2.tellStopped") {
                info.needTrace = false
              }
              this.$store.commit('changeIsoInfo',info)
            }
          })
        }
        callback(selected)
      })
    },
    //查询是否是Edgeless Store创建的任务
    getTaskInfo(gid){
      let pool=this.$store.state.ourTasksPool,name="",info
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
    //查询是否需要拷贝
    needCopy(gid){
      let need=true
      this.$store.state.copyRunningPool.forEach((item)=>{
        if(item.gid===gid) need=false
      })
      if(need){
        this.$store.state.copyEndedPool.forEach((item)=>{
          if(item.gid===gid) need=false
        })
      }
      if(need){
        this.$store.state.copyWaitingPool.forEach((item)=>{
          if(item.gid===gid) need=false
        })
      }
      return need
    },
    stillCopying(name){
      let still=false
      this.$store.state.copyRunningPool.forEach((item)=>{
        if(item.name===name) still=true
      })
      return still
    },

    //aria2c交互工具
    generateID(){
      return "2333"
      //let date=new Date()
      //return date.getDay().toString()+date.getHours().toString()+date.getMinutes().toString()+date.getSeconds().toString()+date.getMilliseconds().toString()+(Math.random()*1000).toFixed(0).toString()
    },
    aria2cHelper_noParams(method,callback){
      this.$axios.post(this.path,{
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
      this.$axios.post(this.path,{
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
            //description:err.response.data.error.message
          })
        }
      })
    },
    aria2cDownloader(address,overwrite,callback){
      this.$axios.post(this.path,{
        'id':this.generateID(),
        'jsonrpc':"2.0",
        'method':'aria2.addUri',
        'params':[[address],{
          'dir':this.$store.state.downloadDir,
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
    init(axios,store,root){
      this.$axios=axios
      this.$store=store
      this.$root=root

      this.path=this.$store.state.aria2cUri
    }
  }

}
</script>