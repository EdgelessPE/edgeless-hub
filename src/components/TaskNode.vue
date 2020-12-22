<template>
  <a-list item-layout="horizontal" :data-source="data">
    <a-list-item slot="renderItem" slot-scope="item">
      <a-icon v-if="index==='0'" :type="'pause-circle'" slot="actions" v-on:click="unPauseOrPause(item.gid)"/>
      <a-icon v-else-if="index==='1'" :type="'play-circle'" slot="actions" v-on:click="unPauseOrPause(item.gid)"/>
      <a-icon v-else-if="index==='3'" :type="'reload'" slot="actions" v-on:click="reStart(item.gid)"/>
      <a-icon type="close-circle" slot="actions" v-on:click="reMoveTask(item.gid)"/>
      <a-list-item-meta :description="getSizeString(item.totalLength)">
        <div slot="title">{{ item.name }}</div>
        <a-progress v-if="index==='0'" slot="avatar" :width="80" type="circle" :percent="getPercent(item.completedLength,item.totalLength)"/>
        <a-progress v-else-if="index==='1'" slot="avatar" :width="80" type="circle" :percent="getPercent(item.completedLength,item.totalLength)" :stroke-color="'#FF9800'" status="exception" :show-info="false"/>
        <a-progress v-else-if="index==='2'" slot="avatar" :width="80" type="circle" :percent="100"/>
        <a-progress v-else-if="index==='3'" slot="avatar" :width="80" type="circle" :percent="getPercent(item.completedLength,item.totalLength)" status="exception"/>

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
      <div v-else-if="(index==='3')">
        错误
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
      if(typeof size!="string") return "null"
      else if(size<1024) return Number(size).toFixed(2)+"B"
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
      //发送继续/暂停下载事件
      this.$root.eventHub.$emit((this.index==='0')?'pause-download-task':'unpause-download-task',{
        'gid':gid
      })
    },
    reMoveTask(gid){
      this.$store.commit('removeTask',gid)
      this.updateData()
    },
    reStart(gid){
      //发送重新下载事件
      this.$root.eventHub.$emit('restart-download-task',{
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