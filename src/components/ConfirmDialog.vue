<template>
  <a-modal v-model="visible" :closable="false" :keyboard="false" :maskClosable="false">
    <template slot="title">
      <a-icon type="exclamation-circle" theme="twoTone" two-tone-color="orange" />
      兼容性警告
    </template>
    <a-button slot="footer" :loading="loading" :type="type" v-on:click="handleOk">{{okText}}</a-button>
    <p>Edgeless不是维护用PE，对劣质U盘和旧型号电脑兼容性不佳，请选用支持USB3.x+的知名品牌U盘制作并在近5年内生产的电脑上启动</p>
  </a-modal>
</template>

<script>
let interval
export default {
  name: "ConfirmDialog",
  data(){
    return{
      okText:"我知道了(5)",
      loading:true,
      timeLeft:5,
      visible:true,
      type:"",
    }
  },
  methods:{
    handleOk(){
      this.visible=false
    }
  },
  created() {
    interval=setInterval(()=>{
      this.timeLeft--
      if(this.timeLeft<=0){
        clearInterval(interval)
        this.okText="我知道了"
        this.loading=false
        this.type="primary"
      }else{
        this.okText="我知道了("+this.timeLeft+")"
      }
    },1000)
  }
}
</script>