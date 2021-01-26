<template>
<div>
  <a-button v-on:click="startVentoyDownload">获取</a-button>
  {{ventoyInfo.version}}
  <template v-if="$store.state.ventoyInfo.needTrace">
    <br/>
    {{"进度："+(($store.state.ventoyInfo.task.completedLength*100)/$store.state.ventoyInfo.task.totalLength).toFixed(1)+"%"}}
    <br/>
    {{"速度："+getSizeString($store.state.ventoyInfo.task.downloadSpeed)+"/s"}}
  </template>
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
    ventoyInfo:{
      'version':"",
      'gid':"",
      'url':"",
      'fileName':""
    },
    whenReadyUnzip:false //当检测到下载完成时发送unzip事件
  }
  },
  methods:{
  startVentoyDownload(){
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
  },
  created() {
    this.interval=setInterval(()=> {
      //定时扫描磁盘信息
      this.$electron.ipcRenderer.send('scanDisks-request', '')

      //当下载完成时unzip
      if(this.whenReadyUnzip){
        if(!this.$store.state.ventoyInfo.needTrace){
          //此时下载已经完成
          this.whenReadyUnzip=false
          this.$electron.ipcRenderer.send('unzip-request',{
            'zip':this.$store.state.downloadDir+'\\'+this.ventoyInfo.fileName,
            'path':this.$store.state.downloadDir
          })
        }
      }
        }
    ,1000)

    this.$electron.ipcRenderer.on('scanDisks-reply',(event,res)=>{
      this.driveInfo=res
    })
    this.$electron.ipcRenderer.on('unzip-reply',(event,res)=>{
      //获取文件夹名
      let tmp=this.ventoyInfo.fileName.split('-')
      let ventoyPath=this.$store.state.downloadDir+'\\'+tmp[0]+'-'+tmp[1]

      //运行Ventoy安装程序
      cp.exec('Ventoy2Disk.exe',{
        'cwd':ventoyPath
      },(res)=>{
        //Ventoy安装程序运行结束
        console.log('finish ventoy')
      })
    })

  },
  destroyed() {
    clearInterval(this.interval)
  }
}
</script>