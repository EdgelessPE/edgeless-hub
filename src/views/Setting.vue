<template>
<div>
  <a-page-header
      title="设置中心"
      @back="() => $router.go(-1)"
  />
  <a-card title="侧边栏主题" style="width: 100%">
    <a-switch checked-children="亮" un-checked-children="暗" :default-checked="$store.state.theme==='light'" @change="changeTheme"/>
  </a-card>
  <br/>
  <a-card title="Edgeless启动盘盘符" style="width: 100%">
    <a-select v-model="currentEdgelessDisk" @change="changeDisk">
      <a-select-option v-for="(item,index) in edgelessDisks" :value="(index===0)?'A':item" :key="index">
        {{item+(item==='自动'?'':'：')}}
      </a-select-option>
    </a-select>
  </a-card>
  <br/>
  <a-card title="下载缓存目录" style="width: 100%">
    当前目录：{{$store.state.downloadDir}}
    <br/><br/>
    <a-button @click="chooseDir">选择</a-button>
  </a-card>
  <br/>
  <a-card title="镜像源" style="width: 100%">
    <a-select :default-value="mirrors[0].url" @change="changeMirror">
      <a-select-option v-for="item in mirrors" :value="item.url" :key="item.name">
        {{item.name}}
      </a-select-option>
    </a-select>
  </a-card>
</div>
</template>

<script>
import DownloadManager from "@/components/DownloadManager";
import {notification} from "ant-design-vue";
export default {
name: "Setting",
  data(){
  return{
    interval:'',
    edgelessDisks:[],
    mirrors:[
      {
        name:'菠萝云',
        url:'https://pineapple.edgeless.top/api/list/1'
      }
    ],
    currentEdgelessDisk:'A'
  }
  },
  methods:{
    chooseDir(){
      //向主进程发送打开目录选择对话框事件
      this.$electron.ipcRenderer.send('openDirectoryDialog-request','')
    },
    changeTheme(val,event){
      if(val){
        this.$store.commit('changeTheme','light')
      }else{
        this.$store.commit('changeTheme','dark')
      }
    },
    changeDisk(val){
      if(val!=='自动'){
        this.$store.commit('setPluginPath',val)
        //console.log('set disk:'+val)
      }else{
        this.$store.commit('setPluginPath','A')
      }
    },
    changeMirror(val){
      //更新Vuex
      this.$store.commit('changeMirror',val)
      //发送刷新数据事件
      this.$root.eventHub.$emit('update-mirror',{})
    }
  },
  created() {
    //初始化DownloadManager
    DownloadManager.methods.init(this.$axios,this.$store,this.$root)
    this.interval=setInterval(()=>{
      //定时更新启动盘列表数据
      this.edgelessDisks=DownloadManager.methods.getUSBList()
      this.currentEdgelessDisk=this.$store.state.pluginPath.split(':')[0]
    },1000)
    //设置事件监听
    this.$electron.ipcRenderer.on('openDirectoryDialog-reply',(event,arg)=>{
      if(arg) this.$store.commit('changeDownloadDir',arg[0])
    })
  },
  destroyed() {
    clearInterval(this.interval)
    DownloadManager.methods.writeConfig()
  }
}
</script>