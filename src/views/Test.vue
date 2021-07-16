<template>
<div>
  <a-space>
    <a-button v-on:click="openDevTool">Devtool</a-button>
    <a-input v-model:value="x"/>
    <a-input v-model:value="y"/>
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
    x:"0.0.0.0",y:"0.0.0.0"
  }
  },
  methods:{
    openDevTool(){
      this.$electron.ipcRenderer.send('devtool-request','')
    },
    test(){
      console.log(DownloadManager.methods.versionCmp(this.x,this.y))
    }
  },
  created() {
  },
  destroyed() {
  }
}
</script>