<template>
  <div>
    <a-alert
        v-if="hotUpdateInfo.needUpdate"
        :message="'Edgeless Hub '+$store.state.hub_online_version+' 现已可用👌'"
        type="info"
        show-icon
        closeText="更新"
        @close="confirmUpdate"
    />
  </div>
</template>

<script>
import DownloadManager from "@/components/DownloadManager";
import {notification} from "ant-design-vue";
export default {
name: "HotUpdate",
  data(){
  return{
    hotUpdateInfo:{
      needUpdate:false,//总开关
      hubApiData:{"miniupdate_pack_addr":"https://pineapple.edgeless.top/disk/Socket/Hub/Update/miniupdate.7z","update_pack_addr":"https://pineapple.edgeless.top/disk/Socket/Hub/Update/update.7z","full_update_redirect":"https://down.edgeless.top","update_info":{"dependencies_requirement":"1.5","wide_gaps":["1.5"]}},
      updateMethod:"FULL_UPDATE",//FULL_UPDATE,HOT_UPDATE,MINI_UPDATE，分别对应手动全量更新、含依赖的增量更新和最小更新，最常用的是最小更新
    },
    interval:"",
  }
  },
  methods:{
    async generateUpdateInformation(){
      //检查是否在开发版本
      if(!this.$electron.ipcRenderer.sendSync('isDev-request')){
        //如果没获取过在线版本号则发送请求
        if(this.$store.state.hub_online_version===""){
          let online_version_res=await this.$axios.get("https://pineapple.edgeless.top/api/v2/info/hub_version")
          this.$store.commit('updateHubOnlineVersion',online_version_res.data)
        }
        //检查版本号
        if(this.$store.state.hub_online_version>this.$store.state.hub_local_version){
          this.hotUpdateInfo.needUpdate=true
          //修改标题
          document.title='Edgeless Hub '+this.$store.state.hub_local_version+'  ('+this.$store.state.hub_online_version+'版本已可用)'
          //获取hub聚合信息
          if(this.$store.state.hub_api_data===""){
            let res=await this.$axios.get("https://pineapple.edgeless.top/api/v2/info/hub")
            this.hotUpdateInfo.hubApiData=res.data
            this.$store.commit('updateHubApiData',res.data)
          }else{
            this.hotUpdateInfo.hubApiData=this.$store.state.hub_api_data
          }
          //console.log(this.hotUpdateInfo.hubApiData)
          //检查是否跨越了鸿沟
          let needFullUpdate=false
          this.hotUpdateInfo.hubApiData.update_info.wide_gaps.forEach((item)=>{
            if(this.$store.state.hub_local_version<item&&item<=this.$store.state.hub_online_version) needFullUpdate=true
          })
          if(needFullUpdate){
            //需要手动下载
            this.hotUpdateInfo.updateMethod="FULL_UPDATE"
          }else{
            //检查是否需要连依赖更新
            if(this.$store.state.hub_local_version<this.hotUpdateInfo.hubApiData.update_info.dependencies_requirement){
              this.hotUpdateInfo.updateMethod="HOT_UPDATE"
            }else{
              this.hotUpdateInfo.updateMethod="MINI_UPDATE"
            }
          }
        }
      }
    },
    confirmUpdate(){
      this.$store.commit('setHotChecked')
      console.log(this.hotUpdateInfo.updateMethod)
      if(this.hotUpdateInfo.updateMethod==="FULL_UPDATE"){
        this.$electron.shell.openExternal(this.hotUpdateInfo.hubApiData.full_update_redirect)
      }else if(this.hotUpdateInfo.updateMethod==="MINI_UPDATE"){
        this.addHotUpdateTask(this.hotUpdateInfo.hubApiData.miniupdate_pack_addr)
      }else{
        this.addHotUpdateTask(this.hotUpdateInfo.hubApiData.update_pack_addr)
      }
    },
    addHotUpdateTask(url){
      //清理目录
      DownloadManager.methods.delDir("./core/Update/source")
      DownloadManager.methods.delDir(this.$store.state.downloadDir + '\\Update')

      //创建工作目录
      DownloadManager.methods.mkdir("./core/Update/source")
      DownloadManager.methods.mkdir(this.$store.state.downloadDir + '\\Update')

      //添加下载任务
      DownloadManager.methods.aria2cDownloaderDir(url, true, this.$store.state.downloadDir + '\\Update', (res) => {
        this.$store.commit('setHotGid', res.data.result)
        console.log('HotUpdate start downloading')
      })

      //配置定时器监视下载情况
      this.interval=setInterval(()=>{
        if(this.$store.state.HotUpdateInfo.taskStopped){
          if(this.$store.state.HotUpdateInfo.task.completedLength!==0&&this.$store.state.HotUpdateInfo.task.completedLength===this.$store.state.HotUpdateInfo.task.totalLength){
            //确实已经完成

            //解析文件名
            let split_result=url.split("/")
            let fileName=split_result[split_result.length-1]
            console.log(fileName)

            //发送解压请求
            this.$electron.ipcRenderer.send('unzip-request',{
              zip:this.$store.state.downloadDir + '\\Update\\'+fileName,
              path:"./core/Update/source"
            })
          }else{
            //下载失败
            notification.open({
              message:'Edgeless Hub热更新失败',
              description:"下载增量更新包时出错，请访问官网获取新版"
            })
          }
          clearInterval(this.interval)
        }
      },1500)

      //监听unzip完成事件
      this.$electron.ipcRenderer.on('unzip-reply',(event,args)=>{
        if(args!==this.$store.state.downloadDir + '\\Update\\update.7z'&&args!==this.$store.state.downloadDir + '\\Update\\miniupdate.7z') return
        //将./core/Update/main.cmd提到根目录
        DownloadManager.methods.copy("./core/Update/main.cmd","./main.cmd",true,()=>{})
        //注册退出时更新
        this.$electron.ipcRenderer.send('updateOnExit',"")
        //弹出通知
        notification.open({
          message:'Edgeless Hub热更新准备就绪',
          description:"当您关闭程序时会执行热更新"
        })
      })
    }
  },
  created() {
    if(this.$store.state.HotUpdateInfo.checked) return
    this.generateUpdateInformation()
  }
}
</script>
