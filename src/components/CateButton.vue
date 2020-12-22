<template>
<div>
  <a-button v-if="state===-1" v-on:click="addDownloadTask(name,url)" :loading="loading">
    <a-icon v-if="!loading" type="cloud-download" />
    获取
  </a-button>
  <a-progress v-else-if="state===0" :width="20" type="circle" :percent="percent" :show-info="false"/>
  <a-button v-else-if="state===1" v-on:click="unPause(info.gid)">
    <a-icon type="play-circle" />
    继续
  </a-button>
  <a-button v-else-if="state===11" disabled>
    <a-icon type="check" />
    已安装
  </a-button>
  <a-button v-else-if="state===3" v-on:click="reStart(info.gid)">
    <a-icon type="redo" />
    重试
  </a-button>
  <a-button v-else-if="state===2||state===10" disabled>
    <a-icon type="loading" />
    安装中
  </a-button>
</div>
</template>

<script>
import DownloadManager from "@/components/DownloadManager";

export default {
name: "CateButton",
  props:['name','url'],
  data(){
  return{
    state:-1, //-1未操作，0下载中，1暂停，2下载成功，3下载异常
    percent:0,
    loading:false,
    info:{
      name:'Plugin',
      gid:'null',
      uri:'null',
      uriName:'null',
      trueName:'null'
    }
  }
  },
  methods:{
    addDownloadTask(name,url){
      //冻结按钮
      this.loading=true
      //发送添加下载事件
      this.$root.eventHub.$emit('add-download-task',{
        'name':name,
        'url':url
      })
      //console.log("event sent")
    },
    unPause(gid){
      //发送继续/暂停下载事件
      this.$root.eventHub.$emit('unpause-download-task',{
        'gid':gid
      })
    },
    reStart(gid){
      //发送重新下载事件
      this.$root.eventHub.$emit('restart-download-task',{
        'gid':gid
      })
    }
  },
  created() {
    //监听状态更新事件
    this.$root.eventHub.$on('state-update-node',(data)=>{
      if(data.name===this.name){
        //确认是自己，解冻按钮，从广播中获取信息
        this.loading=false
        this.info=data.info
        this.percent=data.percent
        //更新状态以刷新DOM
        if(this.state!==Number(data.state)) this.state=Number(data.state)
      }
    })
  }
}
</script>

<style scoped>

</style>