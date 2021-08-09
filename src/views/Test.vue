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
      this.$axios.get("https://pineapple.edgeless.top/api/v2/info/ventoy_addr").then((res)=>{
        console.log(res)
      })
    }
  },
  created() {
  },
  destroyed() {
  }
}
</script>