<template>
<div>
  <a-steps :current="stepsInfo.step">
    <a-step v-for="(i,index) in stepsInfo.data" :key="index" :title="i.title"/>
  </a-steps>
  <div class="steps-content" key="0" v-if="stepsInfo.step===0">
    <a-result title="在开始之前，我们需要下载Ventoy的制作程序" subTitle="Ventoy是一个制作可启动U盘的开源工具，我们推荐使用Ventoy作为Edgeless启动盘引导解决方案">
      <template #icon>
        <img src="https://www.ventoy.net/favicon.ico"/>
      </template>
      <template #extra>
        <a-row v-if="$store.state.ventoyInfo.needTrace">
          <a-col :span="6">
            Ventoy {{ventoyInfo.version}}
          </a-col>
          <a-col :span="12">
            <a-progress :percent="Number((($store.state.ventoyInfo.task.completedLength*100)/$store.state.ventoyInfo.task.totalLength).toFixed(1))" status="active" />
          </a-col>
          <a-col :span="6">
            {{ getSizeString($store.state.ventoyInfo.task.downloadSpeed) + "/s" }}
          </a-col>
        </a-row>
        <a-button v-else type="primary" v-on:click="startVentoyDownload" :loading="stepsInfo.stepText!=='开始'">
          {{stepsInfo.stepText}}
        </a-button>
      </template>
    </a-result>
  </div>
  <div class="steps-content" key="1" v-else-if="stepsInfo.step===1">
    <a-result title="请手动操作Ventoy安装程序，将Ventoy安装至您的U盘" subTitle="完成安装后关闭Ventoy安装程序并点击检查">
      <template #icon>
        <a-icon type="bulb"/>
      </template>
      <template #extra v-if="!showExecVentoyButton">
        <a-button type="primary" v-on:click="checkVentoyUDisk">
          检查
        </a-button>
      </template>
      <template #extra v-else>
        <a-space direction="vertical">
          <a-alert message="如果您将Ventoy安装到了移动硬盘，请点击再次检查按钮" type="info"/>
          <a-space>
            <a-button type="primary" v-on:click="checkVentoyUDisk">
              再次检查
            </a-button>
            <a-button v-on:click="execVentoy">
              重启Ventoy
            </a-button>
          </a-space>
        </a-space>
      </template>
    </a-result>
  </div>
  <div class="steps-content" key="2" v-else-if="stepsInfo.step===2">
    <a-result :title="'正在向'+selectedVentoyPart+'盘部署Edgeless，请稍候...'" subTitle="稍安勿躁，您的启动盘马上就好">
      <template #icon>
        <a-icon type="usb"/>
      </template>
      <template #extra>
        <a-row>
          <a-col :span="4">
            {{stepsInfo.stepText}}
          </a-col>
          <a-col :span="20">
            <a-progress :percent="stepsInfo.step3percent" status="active"/>
          </a-col>
        </a-row>
      </template>
    </a-result>
  </div>
</div>
</template>

<script>
import {notification} from "ant-design-vue";
import DownloadManager from "@/components/DownloadManager"
const cp=window.require('child_process')

export default {
name: "Burn",
  data(){
  return{
    interval:'',
    driveInfo:{
      'names':[],
      'labels':[],
      'removable':[]
    },
    selectedVentoyPart:"",
    ventoyInfo:{
      'version':"",
      'gid':"",
      'url':"",
      'fileName':"",
      'ventoyPath':""
    },
    whenReadyUnzip:false, //当检测到下载完成时发送unzip事件
    showExecVentoyButton:false,
    stepsInfo:{
      hasVentoy:false,
      step:1,
      stepText:"开始",
      step3percent:10,
      data:[
        {
          title:"获取Ventoy",
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
    }
  }
  },
  methods:{
  startVentoyDownload(){
    this.stepsInfo.stepText="请求中..."
    //向码云api发送请求
    this.$axios.get('https://gitee.com/api/v5/repos/longpanda/Ventoy/releases/latest')
    .then((res)=>{
      let urls=res.data.assets
      //查找关键词windows，解析对应的url和version
      urls.forEach((i)=>{
        if(i['name']&&i['name'].indexOf('windows')>0){
          this.ventoyInfo.fileName=i['name']
          this.ventoyInfo.url=i['browser_download_url']
          this.ventoyInfo.version=res.data.tag_name
        }
      })
      if(this.ventoyInfo.url===""){
        notification.open({
          message:'获取Ventoy的Release信息失败',
          description:"不存在对应的Windows版本"
        })
      }else{
        //发送下载请求
        DownloadManager.methods.aria2cDownloader(this.ventoyInfo.url,false,(res)=>{
          this.$store.commit('changeVentoyInfo',{
            needTrace:true,
            gid:res.data.result,
            task:{
              "totalLength":1,
              "completedLength":0,
              "downloadSpeed":1
          }
          })
          //启动下载完成时unzip监测
          this.whenReadyUnzip=true
          this.stepsInfo.stepText="下载中..."
        })
      }
    })
    .catch((err)=>{
      notification.open({
        message:'获取Ventoy的Release信息失败',
        description:err.message
      })
    })
  },
    getSizeString(size){
      if(size<1024) return Number(size).toFixed(2)+"B"
      else if(size<1024*1024) return (size/1024).toFixed(2)+"KB"
      else if(size<1024*1024*1024) return (size/(1024*1024)).toFixed(2)+"MB"
      else return (size/(1024*1024*1024)).toFixed(2)+"GB"
    },
    execVentoy(){
      cp.exec('Ventoy2Disk.exe',{
        'cwd':this.ventoyInfo.ventoyPath
      },(res)=>{
        //Ventoy安装程序运行结束
        console.log('finish ventoy')
      })
    },
    checkVentoyUDisk(){
      //用户点击了下一步，开始检查Ventoy启动盘是否就绪
      this.$electron.ipcRenderer.send('scanDisks-request','')
    }
  },
  created() {
    this.interval=setInterval(()=> {
      //当下载完成时unzip
      if(this.whenReadyUnzip){
        if(!this.$store.state.ventoyInfo.needTrace){
          //此时下载已经完成
          this.whenReadyUnzip=false
          this.stepsInfo.stepText="解压中..."
          this.$electron.ipcRenderer.send('unzip-request',{
            'zip':this.$store.state.downloadDir+'\\'+this.ventoyInfo.fileName,
            'path':this.$store.state.downloadDir
          })
        }
      }
        }
    ,1000)

    this.$electron.ipcRenderer.on('scanDisks-reply',(event,res)=>{
      //获取主进程发送的磁盘信息，开始检查Ventoy是否就绪
      this.driveInfo=res
      this.selectedVentoyPart=""
      for(let i=0;i<this.driveInfo.labels.length;i++){
        //跳过本地磁盘
        if(!this.showExecVentoyButton&&this.driveInfo.removable[i]===0) continue
        //检查Ventoy在卷标中是否出现
        if(this.driveInfo.labels[i]==="Ventoy"){
          this.selectedVentoyPart=this.driveInfo.names[i]
          break
        }
      }
      if(this.selectedVentoyPart===""){
        //Ventoy盘未发现
        this.showExecVentoyButton=true
        notification.open({
          message:'错误：没有发现Ventoy启动盘',
          description:"请确保已经完成Ventoy的安装，再点击检查按钮！"
        })
      }else{
        this.stepsInfo.step=2
      }
    })
    this.$electron.ipcRenderer.on('unzip-reply',(event,res)=>{
      //获取文件夹名
      let tmp=this.ventoyInfo.fileName.split('-')
      let ventoyPath=this.$store.state.downloadDir+'\\'+tmp[0]+'-'+tmp[1]

      //切换步骤条
      this.stepsInfo.step=1

      //运行Ventoy安装程序
      this.ventoyInfo.ventoyPath=ventoyPath
      this.execVentoy()
    })

  },
  destroyed() {
    clearInterval(this.interval)
  }
}
</script>