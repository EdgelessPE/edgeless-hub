<template>
<div>
  <a-button v-if="state===-1" v-on:click="addDownloadTask(name,url)" :loading="loading">
    <a-icon v-if="!loading" type="cloud-download" />
    获取
  </a-button>
  <a-progress v-else-if="state===0" :width="32" type="circle" :percent="percent" :show-info="false"/>
  <a-button v-else-if="state===1" v-on:click="unPause(info.gid)">
    <a-icon type="play-circle" />
    继续
  </a-button>
  <a-button v-else-if="state===3" v-on:click="reStart(info.gid)">
    <a-icon type="redo" />
    重试
  </a-button>
  <a-button v-else-if="state===2||state===10" disabled>
    <a-icon type="loading" />
    安装中
  </a-button>
  <a-button v-else-if="state===11&&versionCmp(version_local,version_online)!==-1" disabled>
    <a-icon type="check" />
    已安装
  </a-button>
  <a-button v-else-if="state===11&&versionCmp(version_local,version_online)===-1" v-on:click="addUpdateTask(name,url)" type="primary">
    <a-icon type="arrow-up" />
    更新
  </a-button>
</div>
</template>

<script>
import DownloadManager from "@/components/DownloadManager";

export default {
name: "CateButton",
  props:['name','fullName','url','version_online'],
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
    },
    version_local:'',
    localName:'',
    interval:''
  }
  },
  methods:{
    addDownloadTask(name,url){
      //冻结按钮
      this.loading=true
      //发送添加下载事件
      this.$root.eventHub.$emit('add-download-task',{
        'name':name,
        'url':url,
        'trueName':this.fullName
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
    },
    addUpdateTask(name,url){
      //发送禁用插件事件
      this.$root.eventHub.$emit('disable-plugin',{
        'localName':this.localName
      })
      //添加下载任务
      this.addDownloadTask(name,url)
    },

    //版本号判断函数,返回1表示x>y,-1表示x<y
    versionCmp(x,y){
      //识别含-的版本号
      x=x.replaceAll("-",".")
      y=y.replaceAll("-",".")

      let split_x=x.split(".")
      let split_y=y.split(".")
      let result=0
      let i
      for(i=0;i<Math.min(split_x.length,split_y.length);i++){
        if(Number(split_x[i])<Number(split_y[i])){
          result=-1
          break
        }else if(Number(split_x[i])>Number(split_y[i])){
          result=1
          break
        }
      }
      //当长度不相等时向后搜索长位是否全0
      if(result===0&&split_x.length!==split_y.length){
        if(split_x.length>split_x.length){
          //处理x
          for(;i<split_x.length;i++){
            if(Number(split_x[i])!==0){
              result=1
              break
            }
          }
        }else{
          //处理y
          for(;i<split_y.length;i++){
            if(Number(split_y[i])!==0){
              result=-1
              break
            }
          }
        }
      }
      return result
    },

  },
  watch:{
    state:function (){
      if(this.state===10){
        //安装中状态
        if(this.interval===''){
          //启动定时检查
          this.interval=setInterval(()=>{
            if(!(this.state===10)){
              clearInterval(this.interval)
              this.interval=''
            }
            //console.log('running...')
            let inside=false
            for(let i=0;i<this.$store.state.copyWaitingPool.length;i++){
              if(this.$store.state.copyWaitingPool[i].name===this.name){
                inside=true
                break
              }
            }
            if(!inside&&(this.state===10)) {
              //console.log('checked')
              this.state = -1
              clearInterval(this.interval)
              this.interval=''
            }
          },1500)
        }
      }else{
        if(this.interval!=='') {
          clearInterval(this.interval)
          this.interval=''
        }
      }
    }
  },
  created() {
    this.version_local=this.version_online
    //监听状态更新事件
    this.$root.eventHub.$on('state-update-node',(data)=>{
      if(data.name===this.name){
        //确认是自己，解冻按钮，从广播中获取信息
        this.loading=false
        if(data.state===11) {
          this.version_local = data.version
          this.localName=data.localName
          //console.log(data.localName)
        }
        this.info=data.info
        this.percent=data.percent
        //更新状态以刷新DOM
        if(this.state!==Number(data.state)) {
          //console.log('update form broadcast')
          //console.log(data)
          this.state = Number(data.state)
          if(this.state===2) this.state=-1
        }
      }
    })
  }
}
</script>

<style scoped>

</style>