<template>
<div>
  <a-space>
    <a-button v-on:click="openDevTool">Devtool</a-button>
    <a-button v-on:click="test">Test</a-button>
    <a-button v-on:click="$router.push('/hot')">热更新</a-button>
  </a-space>
</div>
</template>

<script>
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
      console.log(this.$electron.ipcRenderer.sendSync('isDev-request',''))
    }
  },
  created() {
  },
  destroyed() {
  }
}
</script>