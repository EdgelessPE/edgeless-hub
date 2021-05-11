<template>
<div>
  <a-space>
    <a-button v-on:click="openDevTool">Devtool</a-button>
    <a-button v-on:click="test">Test</a-button>
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
    async test(){
      let isoData=await this.$axios.get("https://pineapple.edgeless.top/api/v2/info/iso")
      console.log(isoData.data.name)
    }
  },
  created() {
  },
  destroyed() {
  }
}
</script>