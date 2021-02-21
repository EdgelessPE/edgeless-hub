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
    test(){
      this.$error({
        title: '错误：启动盘的文件不完全',
        content: "步骤3操作失败，请关闭程序后尝试重新制作"
      });
    }
  },
  created() {
  },
  destroyed() {
  }
}
</script>