<template>
<div>
  <a-steps :current="stepBarNumber">
    <a-step :key="0" title="下载升级文件"/>
    <a-step :key="1" title="部署新版Edgeless"/>
    <a-step :key="2" title="完成"/>
  </a-steps>
  <div class="steps-content" key="0" v-if="$store.state.UpdateInfo.state===0||$store.state.UpdateInfo.state===1">
    <a-result :title="$store.state.UpdateInfo.state===0?'有可用的Edgeless更新':'正在下载升级文件'" :subTitle="'当前版本：'+localVersion+' >> 最新版本：'+onlineVersion">
      <template #icon>
        <a-icon type="cloud-download"/>
      </template>
      <template #extra>
        <a-space direction="vertical" style="width: 100%">
          <div v-if="$store.state.UpdateInfo.state===1">
            <a-row>
              <a-col :span="8">
                {{ isoName }}
              </a-col>
              <a-col :span="12">
                <a-progress
                    :percent="Number((($store.state.UpdateInfo.task.completedLength*100)/$store.state.UpdateInfo.task.totalLength).toFixed(1))"
                    status="active"/>
              </a-col>
              <a-col :span="4">
                {{ getSizeString($store.state.UpdateInfo.task.downloadSpeed) + "/s" }}
              </a-col>
            </a-row>
          </div>
          <a-button v-else-if="$store.state.UpdateInfo.state===0" type="primary" v-on:click="startDownload" :loading="loading">
            开始
          </a-button>
        </a-space>
      </template>
    </a-result>
  </div>
  <div class="steps-content" key="1" v-else-if="$store.state.UpdateInfo.state===2">
    <a-result title="向启动盘部署更新" subTitle="这可能需要几分钟的时间">
      <template #icon>
        <a-icon type="hourglass" />
      </template>
      <template #extra>
        <a-row>
          <a-col :span="9"/>
          <a-col :span="1">
            <a-icon type="loading" />
          </a-col>
          <a-col :span="5">
            {{waitingTip}}...
          </a-col>
        </a-row>
      </template>
    </a-result>
  </div>
  <div class="steps-content" key="2" v-else-if="$store.state.UpdateInfo.state===3">
    <a-result
        status="success"
        title="您的Edgeless启动盘已经完成升级！"
        :sub-title="'当前版本：'+onlineVersion"
    >
    </a-result>
  </div>
</div>
</template>

<script>
import DownloadManager from "@/components/DownloadManager";
import {notification} from "ant-design-vue";
const fs=window.require('fs')
export default {
name: "Update",
  data(){
  return{
    updateMethod:0, //更新方式，0表示Ventoy更新
    localVersion:"",
    onlineVersion:"",
    isoName:"",
    interval:"",
    stepBarNumber:0,
    loading:false, //按钮的加载状态
    startTimes:0, //任务重新开始的次数
    waitingTip:"正在解包ISO文件", //复制时的提示信息
  }
  },
  methods:{
    getSizeString(size) {
      if (size < 1024) return Number(size).toFixed(2) + "B"
      else if (size < 1024 * 1024) return (size / 1024).toFixed(2) + "KB"
      else if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + "MB"
      else return (size / (1024 * 1024 * 1024)).toFixed(2) + "GB"
    },
    startDownload(){
      this.startTimes++
      if(this.startTimes>2) {
        notification.open({
          message:'下载失败次数过多，更新步骤被暂停',
          description:'请联系作者解决问题'
        })
        return
      }
      this.loading=true
      //发送下载任务
      let url="https://pineapple.edgeless.top/api/v2/info/iso_addr"
      DownloadManager.methods.aria2cDownloaderDir(url, false, this.$store.state.downloadDir + '\\Burn', (res) => {
        this.$store.commit('setUpdateGid', res.data.result)
        this.$store.commit('setUpdateState',1)
      })
    },
    startCopy(){
      //解包ISO文件
      this.unpackISO(()=>{
        //解包ISO完成，备份U盘中的wp.jpg和Edgeless_xxx.wim
        this.waitingTip='正在备份旧的启动文件'
        DownloadManager.methods.del(this.$store.state.pluginPath[0]+":\\Edgeless\\wp_bak.jpg")
        DownloadManager.methods.ren(this.$store.state.pluginPath[0]+":\\Edgeless\\wp.jpg",this.$store.state.pluginPath[0]+":\\Edgeless\\wp_bak.jpg")

        let matchResult= DownloadManager.methods.matchFiles(this.$store.state.pluginPath[0]+":\\","^Edgeless_.*wim$")
        matchResult.forEach((item)=>{
          DownloadManager.methods.ren(this.$store.state.pluginPath[0]+":\\"+item,this.$store.state.pluginPath[0]+":\\"+item+"bak")
        })

        //覆盖复制Edgeless文件夹
        this.waitingTip='正在更新Edgeless依赖'
        DownloadManager.methods.copyDir(this.$store.state.downloadDir + '\\Burn\\release\\Edgeless',this.$store.state.pluginPath[0]+":\\Edgeless\\",false,()=>{
          //复制boot.wim
          this.waitingTip='正在更新Edgeless启动文件'
          DownloadManager.methods.copy(this.$store.state.downloadDir + '\\Burn\\release\\sources\\boot.wim', this.$store.state.pluginPath[0] + ':\\' + this.isoName.split('.iso')[0] + '.wim', true, () => {
            //step2完成，翻面
            this.$store.commit('setUpdateState',3)
          })
        })
      })
    },
    unpackISO(callback) {
      //删除release文件夹
      DownloadManager.methods.delDir(this.$store.state.downloadDir + '\\Burn\\release')
      //注册完成事件监听
      this.$electron.ipcRenderer.on('unpackISO-reply', callback)
      //发送解包事件
      this.$electron.ipcRenderer.send('unpackISO-request', {
        src: this.$store.state.downloadDir + '\\Burn\\'+this.isoName,
        dst: this.$store.state.downloadDir + '\\Burn\\release'
      })
    },
  },
  created() {
    //检查启动盘是否存在
    if(DownloadManager.methods.exist(this.$store.state.pluginPath)){
      //检查盘内版本号
      if(DownloadManager.methods.exist(this.$store.state.pluginPath[0]+":\\Edgeless\\version.txt")){
        this.localVersion=fs.readFileSync(this.$store.state.pluginPath[0]+":\\Edgeless\\version.txt").toString().split("_")[3]
      }else{
        notification.open({
          message:'不是标准的Edgeless启动盘',
          description:'您的启动盘缺少版本标识文件，请尝试重新制作'
        })
        this.$router.back()
      }
      //console.log(localVersion)
      this.$axios.get("https://pineapple.edgeless.top/api/v2/info/iso")
      .then((res)=>{
        //console.log(res.data)
        this.onlineVersion=res.data.version
        this.isoName=res.data.name
        if (this.onlineVersion>this.localVersion) {
          //检查通过，可以执行升级
          this.$store.commit('setUpdateState',0)
          //判断启动盘类型以选择更新方式
          if (!DownloadManager.methods.exist(this.$store.state.pluginPath[0]+":\\ventoy\\ventoy_wimboot.img")) {
            this.updateMethod = 1
            notification.open({
              message:'无法执行升级操作',
              description:'不支持旧版启动盘制作工具制作的启动盘，请先重新写入'
            })
            this.$router.push("/burning")
          }
        }else{
          notification.open({
            message:'无法执行升级操作',
            description:'启动盘已是最新版本:'+this.localVersion
          })
          this.$router.back()
        }
      })
    }else{
      notification.open({
        message:'无法执行升级操作',
        description:'未检测到Edgeless启动盘，请执行写入步骤'
      })
      this.$router.push("/burning")
    }
    //配置定时器
    this.interval=setInterval(()=>{
      //计算当前步骤条指向
      this.stepBarNumber=this.$store.state.UpdateInfo.state-1
      if(this.stepBarNumber<0) this.stepBarNumber=0

      //如果下载停止，检查是否出错或是完成后更新状态
      if(this.$store.state.UpdateInfo.state===1&&this.$store.state.UpdateInfo.taskStopped){
        if(this.$store.state.UpdateInfo.task.completedLength===this.$store.state.UpdateInfo.task.totalLength){
          //确实已经完成，翻页
          this.$store.commit('setUpdateState',2)
          this.startCopy()
        }else {
          //任务出错，重新开始
          DownloadManager.methods.del(this.$store.state.downloadDir + '\\Burn\\' +this.isoName)
          DownloadManager.methods.del(this.$store.state.downloadDir + '\\Burn\\' +this.isoName+'.aria2')
          this.startDownload()
        }
      }
    },1000)
  },
  destroyed() {
    clearInterval(this.interval)
  },
  beforeRouteLeave(to, from, next) {
    //当step=2时阻止用户切换页面
    if (this.$store.state.UpdateInfo.state === 2) {
      notification.open({
        message: '现在不能离开当前页面！',
        description: "请耐心等待升级任务完成"
      })
    } else {
      next()
    }
  }
}
</script>