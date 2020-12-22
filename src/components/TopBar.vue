<template>
 <a-row>
   <a-col span="19"/>

   <a-col span="4" v-if="!searchBarCollapsed">
     <a-input-search v-model="input" placeholder="搜索" class="search-bar" @search="onSearch" />
   </a-col>

   <a-col span="3" v-if="searchBarCollapsed"/>
   <a-col span="1" v-if="searchBarCollapsed" @click="()=>{this.searchBarCollapsed=!this.searchBarCollapsed}">
     <a-avatar icon="search"/>
   </a-col>

   <a-col span="1"/>
   <a-col span="1">
     <a-popover :title="(downloadingTasks===0)?'无任务':globalSpeed" placement="bottomRight">
       <template slot="content">
         <TaskNodeNaive v-for="(item) in $store.state.tasks[0]" :name="compressString(item.name)" :percent="getPercent(item.completedLength,item.totalLength)"/>
       </template>
       <a-badge :count="downloadingTasks" :number-style="{
        backgroundColor: '#fff',
        color: '#999',
        boxShadow: '0 0 0 1px #d9d9d9 inset'
      }"
       v-on:click="gotoDown"
       >
         <a-avatar icon="download"/>
       </a-badge>
     </a-popover>
   </a-col>
 </a-row>
</template>

<script>
// v-if="downloadingTasks!==0"
import TaskNodeNaive from "@/components/TaskNodeNaive";
export default {
name: "TopBar",
  components:{
    TaskNodeNaive
  },
  methods:{
    onSearch(){
      this.searchBarCollapsed=true
      //console.log(this.$store.state.allData)
      if(this.input!=='') window.location='/#/search?keyword='+this.input
    },
    getPercent(ready,total){
      return Number(((ready/total)*100).toFixed(1))
    },
    getSizeString(size){
      if(size<1024) return Number(size).toFixed(2)+"B"
      else if(size<1024*1024) return (size/1024).toFixed(2)+"KB"
      else if(size<1024*1024*1024) return (size/(1024*1024)).toFixed(2)+"MB"
      else return (size/(1024*1024*1024)).toFixed(2)+"GB"
    },
    updateData(){
      //更新任务数
      this.downloadingTasks=this.$store.state.tasks[0].length
      //更新全局速度
      if(this.downloadingTasks!==0) this.globalSpeed='正在下载-'+this.getSizeString(this.$store.state.globalData.downloadSpeed)+'/s'
    },
    compressString(name){
      if(name.length>4) return name.substring(0,4)+'..'
      else return name
    },
    gotoDown(){
      window.location.href='/#/down'
    }
  },
  data(){
    return {
      searchBarCollapsed:true,
      input:'',
      interval:'',
      downloadingTasks:0,
      globalSpeed:"0B/s"
    }
  },
  created() {
    this.interval=setInterval(()=>{
      this.updateData()
    },1000)
  },
  destroyed() {
    clearInterval(this.interval)
  }
}
</script>

<style scoped>
.search-bar{
  width: 90%;
  height: 90%;

}
</style>