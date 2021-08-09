<template>
  <a-list item-layout="horizontal" :data-source="data">
    <a-list-item slot="renderItem" slot-scope="item, index_wait" :key="item.name">
      <template>
        <!--第一个按钮（可选）-->
        <a-icon v-if="index==='0'" :type="loading?'loading':'pause-circle'" slot="actions" v-on:click="unPauseOrPause(item.gid)"/>
        <a-icon v-else-if="index==='1'" :type="loading?'loading':'play-circle'" slot="actions" v-on:click="unPauseOrPause(item.gid)"/>
        <a-icon v-else-if="index==='3'" :type="loading?'loading':'reload'" slot="actions" v-on:click="reStart(item.gid)"/>
        <a-icon v-else-if="index==='12'" :type="loading?'loading':'cloud-download'" slot="actions" v-on:click="update(item)"/>
        <!--第二个按钮（删除）-->
        <a-icon v-if="index==='11'||index==='12'" type="close-circle" slot="actions" v-on:click="deleteFile(item)"/>
        <a-icon v-else-if="index==='13'&&(index_wait!==0||!runningCopy)" :type="loading?'loading':'close-circle'" slot="actions" v-on:click="reMoveCopyTask(item.gid)"/>
        <a-icon v-else-if="index!=='10'&&index!=='13'" :type="loading?'loading':'close-circle'" slot="actions" v-on:click="reMoveTask(item.gid)"/>

        <a-list-item-meta>
          <div slot="title">{{item.name}}</div>

          <div slot="description" v-if="index==='11'">
            {{'Ver '+item.softVer+' By '+item.softAuthor}}
            <br/>
            {{getSizeString(item.totalLength)}}
          </div>
          <div slot="description" v-else-if="index==='12'">
            {{'Ver '+item.softVer+' By '+item.softAuthor}}
            <br/>
            {{'可更新至'+item.onlineVer+'版本'}}
            <br/>
            {{getSizeString(item.totalLength)}}
          </div>
          <div slot="description" v-else>{{getSizeString(item.totalLength)}}</div>

          <a-progress v-if="index==='0'" slot="avatar" :width="80" type="circle" :percent="getPercent(item.completedLength,item.totalLength)"/>
          <a-progress v-else-if="index==='1'" slot="avatar" :width="80" type="circle" :percent="getPercent(item.completedLength,item.totalLength)" :stroke-color="'#FF9800'" status="exception" :show-info="false"/>
          <a-progress v-else-if="index==='2'" slot="avatar" :width="80" type="circle" :percent="100"/>
          <a-progress v-else-if="index==='3'" slot="avatar" :width="80" type="circle" :percent="getPercent(item.completedLength,item.totalLength)" status="exception"/>
          <a-avatar v-else-if="index==='13'&&index_wait===0&&runningCopy" slot="avatar" :size="60" icon="loading" style="color: #f56a00; backgroundColor: #ffffff"/>
          <a-avatar v-else-if="index==='13'" slot="avatar" :size="60" icon="clock-circle" style="color: #f56a00; backgroundColor: #ffffff"/>
          <a-avatar v-else-if="index==='11'" slot="avatar" :size="80" icon="check" style="color: #4caf50; backgroundColor: #ffffff"/>
          <a-avatar v-else-if="index==='12'" slot="avatar" :size="80" icon="arrow-up" style="color: #3f51b5; backgroundColor: #ffffff"/>
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
        <div v-else-if="(index==='13'&&index_wait===0&&runningCopy)">
          正在安装...
        </div>
        <div v-else-if="(index==='11'&&item.onlineVer==='null')">
          非官方插件
        </div>
        <div v-else-if="(index==='12')">
          可更新
        </div>
        <div v-else-if="(index==='13')">
          等候中...
        </div>
      </template>
    </a-list-item>
  </a-list>
</template>

<script>
import {notification} from "ant-design-vue";

export default {
name: "TaskNode",
  data(){
  return{
    data:[],
    interval:'',
    loading:false, //针对actions插槽的按钮
    runningCopy:false
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
      this.loading=false
      this.runningCopy=(this.$store.state.copyRunningPool.length!==0)
      if(this.index<10) this.data=this.$store.state.tasks[this.index]
      else if(this.index==='10'){
        //正在复制中的任务
        this.data=this.$store.state.copyRunningPool
      }else if(this.index==='11'){
        //U盘内的文件列表
        this.data=this.$store.state.fileList
      }else if(this.index==='12'){
        //U盘内的更新列表
        this.data=this.$store.state.updateList
      }else if(this.index==='13'){
        //等待拷贝列表
        this.data=this.$store.state.copyWaitingPool
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
      this.loading=true
      //发送继续/暂停下载事件
      this.$root.eventHub.$emit((this.index==='0')?'pause-download-task':'unpause-download-task',{
        'gid':gid
      })
    },
    reMoveTask(gid){
      this.loading=true
      this.$store.commit('removeTask',gid)
      //this.updateData()
    },
    reStart(gid){
      this.loading=true
      //发送重新下载事件
      this.$root.eventHub.$emit('restart-download-task',{
        'gid':gid
      })
    },
    deleteFile(item){
      //移动文件至回收站
      let ret = this.$electron.shell.moveItemToTrash(this.$store.state.pluginPath+"\\"+item.trueName)
      if(ret){
        notification.open({
          message:'删除插件成功',
          description:item.trueName+'已移至回收站'
        })
      }else{
        //发送删除文件事件
        this.$root.eventHub.$emit('delete-file',{
          'trueName':item.trueName,
          'name':item.softName
        })
      }
    },
    update(item){
      this.loading=true
      //发送禁用插件事件
      this.$root.eventHub.$emit('disable-plugin',{
        'localName':item.trueName
      })
      //发送添加下载事件
      this.$root.eventHub.$emit('add-download-task',{
        'name':item.name,
        'url':item.url,
        'trueName':item.onlineName
      })
    },
    reMoveCopyTask(gid){
      this.loading=true
      this.$store.commit('delCopyingTask',gid)
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