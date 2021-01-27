<template>
  <a-result title="欢迎，今日无事可做" subTitle="（其实是还没想好放啥">
    <template #icon>
      <a-icon type="smile" theme="twoTone" />
    </template>
    <template #extra>
      <a-button v-on:click="openQQLink" type="primary" icon="qq" size="large">
        加入鹅群
      </a-button>
    </template>
  </a-result>
</template>

<script>
export default {
name: "Index",
  data(){
  return{

  }
  },
  methods:{
    openQQLink(){
      this.$electron.shell.openExternal('https://home.edgeless.top/jump/qqg.html')
    }
  }
}
</script>