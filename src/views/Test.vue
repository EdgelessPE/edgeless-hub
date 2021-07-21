<template>
<div>
  <a-space>
    <a-button v-on:click="openDevTool">Devtool</a-button>
    <a-button v-on:click="test">Test</a-button>
  </a-space>
</div>
</template>

<script>
import DownloadManager from "@/components/DownloadManager"
export default {
name: "Test",
  data(){
  return{
  }
  },
  methods:{
    openDevTool(){
      this.$electron.ipcRenderer.send('devtool-request','')
    },
    test(){
      console.log(DownloadManager.methods.del("D:\\360极速浏览器下载\\搜狗 拼音_10.5.0.4737_Cno.7z"))
    }
  },
  created() {
  },
  destroyed() {
  }
}
</script>