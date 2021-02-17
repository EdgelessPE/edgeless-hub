<template>
<div>
  <a-button v-on:click="test">Test</a-button>
</div>
</template>

<script>
import DownloadManager from "@/components/DownloadManager";
export default {
name: "Test",
  data(){
  return{
  }
  },
  methods:{
    test(){
      DownloadManager.methods.matchFiles("D:\\Download\\ELStore\\Burn","^Edgeless.*iso$")
    }
  }
}
</script>