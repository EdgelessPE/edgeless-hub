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
    async test(){
      try{
        let res=await DownloadManager.methods.getMD5("D:\\Download\\vs_Community.exe")
        console.log(res)
      }catch (e) {
        console.log(e)
      }
    }
  },
  created() {
  },
  destroyed() {
  }
}
</script>