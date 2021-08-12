<template>
<div>
  <ConfirmDialog v-if="show"/>
  <a-space>
    <a-button v-on:click="openDevTool">Devtool</a-button>
    <a-button v-on:click="test">Test</a-button>
  </a-space>
</div>
</template>

<script>
import DownloadManager from "@/components/DownloadManager"
import ConfirmDialog from "@/components/ConfirmDialog"
export default {
name: "Test",
  data(){
  return{
    show:false
  }
  },
  components: {ConfirmDialog},
  methods:{
    openDevTool(){
      this.$electron.ipcRenderer.send('devtool-request','')
    },
    async test(){
      this.show=true
    }
  },
  created() {
  },
  destroyed() {
  }
}
</script>