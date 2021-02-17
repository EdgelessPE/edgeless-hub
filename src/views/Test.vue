<template>
<div>
  <a-button v-on:click="init">init</a-button>
</div>
</template>

<script>
import StationObject from '@/stationpool/pineapplecloud'
import {notification} from "ant-design-vue";
export default {
name: "Test",
  data(){
  return{
  }
  },
  methods:{
    init(){
      this.$axios.get("https://pineapple.edgeless.top/api/v2/info/iso_version")
          .then((res)=>{
            console.log("Edgeless_Beta_"+res.data+".iso")
          })
          .catch((err) => {
            notification.open({
              message: '获取ISO镜像信息失败',
              description: err.message
            })
          })
    }
  }
}
</script>