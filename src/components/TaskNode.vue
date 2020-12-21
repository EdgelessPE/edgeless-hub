<template>
  <a-list item-layout="horizontal" :data-source="data">
    <a-list-item slot="renderItem" slot-scope="item">
      <a-icon v-if="index!=='2'" :type="(index==='1')?'play-circle':'pause-circle'" slot="actions" v-on:click="unPauseOrPause(item.gid)"/>
      <a-icon type="close-circle" slot="actions"/>
      <a-list-item-meta :description="getSizeString(item.totalLength)">
        <div slot="title">{{ item.name }}</div>
        <a-progress slot="avatar" :width="80" type="circle" :percent="getPercent(item.completedLength,item.totalLength)"/>
<!--                    :status="()=>{-->
<!--          if(index!=='2') return 'normal'-->
<!--          else {-->
<!--            if(getPercent(item.completedLength,item.totalLength)!==100) return 'exception'-->
<!--            else return 'success'-->
<!--          }-->
<!--        }" -->

      </a-list-item-meta>
      <div v-if="(index==='0')">
        {{getSizeString(item.downloadSpeed)+'/s'}}
      </div>
      <div v-else-if="(index==='1')">
        暂停
      </div>
    </a-list-item>
  </a-list>
</template>

<script>
export default {
name: "TaskNode",
  data(){
  return{
    data:[],
    interval:''
  }
  },
  props:['index'],
  methods:{
    getSizeString(size){
      if(size<1024) return size.toFixed(2)+"B"
      else if(size<1024*1024) return (size/1024).toFixed(2)+"KB"
      else if(size<1024*1024*1024) return (size/(1024*1024)).toFixed(2)+"MB"
      else return (size/(1024*1024*1024)).toFixed(2)+"GB"
    },
    getPercent(ready,total){
      return Number(((ready/total)*100).toFixed(1))
    },
    updateData(){
      this.data=this.$store.state.tasks[this.index]
    },
    getText(item){
      switch (this.index){
        case 0:
          return this.getPercent(item.completedLength,item.totalLength).toFixed(1)+"%"
        case 1:
          return "暂停"
        case 2:
          return "完成"
      }
    },
    unPauseOrPause(gid){
      //发送继续下载事件
      this.$root.eventHub.$emit((this.index==='0')?'pause-download-task':'unpause-download-task',{
        'gid':gid
      })
    }
  },
  mounted() {
    this.updateData()
    this.interval=setInterval(()=>{
      this.updateData()
    },1000)
  },
  computed:{
    getColor:function (){
      switch (this.index){
        case 0:
          return "#108ee9"
        case 1:
          return "#FF9800"
        case 2:
          return "#87d068"
      }
    }
  },
  destroyed() {
    clearInterval(this.interval)
  }
}
</script>

<style scoped>

</style>