<template>
<div>
  <a-steps :current="stepBarNumber">
    <a-step :key="0" title="下载升级文件"/>
    <a-step :key="1" title="部署新版Edgeless"/>
    <a-step :key="2" title="完成"/>
  </a-steps>
  <div class="steps-content" key="0" v-if="$store.state.UpdateInfo.state===0||$store.state.UpdateInfo.state===1">
    <a-result :title="$store.state.UpdateInfo.state===0?'有可用的Edgeless更新':'正在下载升级文件'" :subTitle="'现有版本：'+localVersion+' >> 最新版本：'+onlineVersion">
      <template #icon>
        <a-icon type="cloud-download"/>
      </template>
      <template #extra>
        <a-space direction="vertical" style="width: 100%">
          <div v-if="$store.state.UpdateInfo.state===1">
            <a-row>
              <a-col :span="8">
                Edgeless_Beta_{{ onlineVersion }}.iso
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
          <a-button v-else-if="$store.state.UpdateInfo.state===0" type="primary" v-on:click="startDownload" :loading="$store.state.UpdateInfo.state!==0">
            开始
          </a-button>
        </a-space>
      </template>
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
    interval:"",
    stepBarNumber:0,
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
      this.$store.commit('setUpdateState',1)
    }
  },
  created() {
    //检查启动盘是否存在
    if(DownloadManager.methods.exist(this.$store.state.pluginPath)){
      //检查盘内版本号
      this.localVersion=fs.readFileSync(this.$store.state.pluginPath[0]+":\\Edgeless\\version.txt").toString().split("_")[3]
      //console.log(localVersion)
      this.$axios.get("https://pineapple.edgeless.top/api/v2/info/iso_version")
      .then((res)=>{
        //console.log(res.data)
        this.onlineVersion=res.data
        if (this.onlineVersion!==this.localVersion) {
          //检查通过，可以执行升级
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
    },1000)
  },
  destroyed() {
    clearInterval(this.interval)
  }
}
</script>