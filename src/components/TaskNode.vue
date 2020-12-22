<template>
  <a-list item-layout="horizontal" :data-source="data">
    <a-list-item slot="renderItem" slot-scope="item">
      <!--第一个按钮（可选）-->
      <a-icon v-if="index==='0'" :type="'pause-circle'" slot="actions" v-on:click="unPauseOrPause(item.gid)"/>
      <a-icon v-else-if="index==='1'" :type="'play-circle'" slot="actions" v-on:click="unPauseOrPause(item.gid)"/>
      <a-icon v-else-if="index==='3'" :type="'reload'" slot="actions" v-on:click="reStart(item.gid)"/>
      <!--第二个按钮（删除）-->
      <a-icon v-if="index==='11'" type="close-circle" slot="actions" v-on:click="deleteFile(item)"/>
      <a-icon v-else-if="index!=='10'" type="close-circle" slot="actions" v-on:click="reMoveTask(item.gid)"/>

      <a-list-item-meta>
        <div slot="title">{{item.name}}</div>

        <div slot="description" v-if="index==='11'">
          {{'Ver '+item.softVer+' By '+item.softAuthor}}
          <br/>
          {{getSizeString(item.totalLength)}}
        </div>
        <div slot="description" v-else>{{getSizeString(item.totalLength)}}</div>

        <a-progress v-if="index==='0'" slot="avatar" :width="80" type="circle" :percent="getPercent(item.completedLength,item.totalLength)"/>
        <a-progress v-else-if="index==='1'" slot="avatar" :width="80" type="circle" :percent="getPercent(item.completedLength,item.totalLength)" :stroke-color="'#FF9800'" status="exception" :show-info="false"/>
        <a-progress v-else-if="index==='2'" slot="avatar" :width="80" type="circle" :percent="100"/>
        <a-progress v-else-if="index==='3'" slot="avatar" :width="80" type="circle" :percent="getPercent(item.completedLength,item.totalLength)" status="exception"/>
        <a-avatar v-else-if="index==='10'" slot="avatar" :size="60" icon="loading" style="color: #f56a00; backgroundColor: #ffffff"/>
        <a-progress v-else-if="index==='11'" slot="avatar" :width="80" type="circle" :percent="100"/>
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
      <div v-else-if="(index==='10')">
        正在安装...
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
      if(size<1024) return Number(size).toFixed(2)+"B"
      else if(size<1024*1024) return (size/1024).toFixed(2)+"KB"
      else if(size<1024*1024*1024) return (size/(1024*1024)).toFixed(2)+"MB"
      else return (size/(1024*1024*1024)).toFixed(2)+"GB"
    },
    getPercent(ready,total){
      return Number(((ready/total)*100).toFixed(1))
    },
    updateData(){
      if(this.index<10) this.data=this.$store.state.tasks[this.index]
      else if(this.index==='10'){
        //正在复制中的任务
        this.data=this.$store.state.copyRunningPool
      }else if(this.index==='11'){
        //U盘内的文件列表
        this.data=this.$store.state.fileList
      }
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
    },
    deleteFile(item){
      //发送删除文件事件
      this.$root.eventHub.$emit('delete-file',{
        'trueName':item.softName+'_'+item.softVer+'_'+item.softAuthor+'.7z',
        'name':item.softName
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