<template>
  <a-collapse v-model="activeKey">
    <a-collapse-panel key="1" :header="'下载中（'+($store.state.tasks[0].length+$store.state.tasks[1].length)+'）'">
      <TaskNode v-if="$store.state.tasks[0].length!==0" index="0"/>
      <TaskNode v-if="$store.state.tasks[1].length!==0" index="1"/>
      <TaskNode v-if="$store.state.tasks[3].length!==0" index="3"/>
    </a-collapse-panel>
    <a-collapse-panel key="2" :header="'安装中（'+$store.state.copyRunningPool.length+'）'">
      <TaskNode v-if="$store.state.copyRunningPool.length!==0" index="10"/>
    </a-collapse-panel>
    <a-collapse-panel key="3" :header="'已安装（'+$store.state.fileList.length+'）'">
      <TaskNode v-if="$store.state.fileList.length!==0" index="11"/>
    </a-collapse-panel>
  </a-collapse>
</template>

<script>
import TaskNode from "@/components/TaskNode";
export default {
name: "Down",
  data(){
    return{
      activeKey:[]
    }
  },
  components:{
    TaskNode
  },
  methods:{
    print(){
      console.log(this.$store.state.tasks)
    }
  },
  mounted() {
    // this.updateData()
    // this.interval=setInterval(()=>{
    //   this.updateData()
    // },1000)
    //展开第一个不为0的折叠组
    //考虑第一组
    this.activeKey=[]
    if(this.$store.state.tasks[0].length+this.$store.state.tasks[1].length+this.$store.state.tasks[3].length>0) {
      this.activeKey.push('1')
    }
    //考虑第二组
    if(this.$store.state.copyRunningPool.length>0){
      this.activeKey.push('2')
    }
    //考虑第三组
    if(this.activeKey.length===0&&this.$store.state.fileList.length>0){
      this.activeKey.push('3')
    }
  },
  computed:{
  }
}
</script>