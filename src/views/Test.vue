<template>
<div>
  <a-button v-on:click="init">init</a-button>
</div>
</template>

<script>
import StationObject from '@/stationpool/pineapplecloud'
export default {
name: "Test",
  data(){
  return{
  }
  },
  methods:{
    init(){
      StationObject.init(this.$axios,()=>{
        StationObject.getCateData((cData)=>{
          console.log(cData)
        })
        StationObject.getPluginList('安全急救',(pData)=>{
          console.log(pData)
        })
      })
    }
  }
}
</script>