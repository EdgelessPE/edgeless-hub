<template>
  <a-collapse v-model="activeKey">
    <a-collapse-panel key="1" :header="'下载中（'+(tasks[0].length+tasks[1].length)+'）'">
      <TaskNode v-if="!disable0" index="0"/>
      <TaskNode v-if="!disable1" index="1"/>
      <TaskNode v-if="!disable3" index="3"/>
    </a-collapse-panel>
    <a-collapse-panel key="2" :header="'安装中（'+-1+'）'">
    </a-collapse-panel>
    <a-collapse-panel key="3" :header="'已完成（'+tasks[2].length+'）'">
      <TaskNode v-if="!disable2" index="2"/>
    </a-collapse-panel>
  </a-collapse>
</template>

<script>
import TaskNode from "@/components/TaskNode";
export default {
name: "Down",
  data(){
    return{
      activeKey:[],
      tasks:[[],[],[],[]],//0下载中，1暂停，2下载成功，3下载异常
      disable0:true,
      disable1:true,
      disable2:true,
      disable3:true,
      interval:''
    }
  },
  components:{
    TaskNode
  },
  methods:{
    print(){
      console.log(this.tasks)
    },
    updateData(){
      //从Vuex更新tasks数组
      this.tasks=this.$store.state.tasks

      //更新禁用情况
      this.disable0 = this.tasks[0].length <= 0
      this.disable1 = this.tasks[1].length <= 0
      this.disable2 = this.tasks[2].length <= 0
      this.disable3 = this.tasks[3].length <= 0
    },
  },
  mounted() {
    this.updateData()
    this.interval=setInterval(()=>{
      this.updateData()
    },1000)
    //展开第一个不为0的折叠组
    //考虑第一组
    if(this.tasks[0].length+this.tasks[1].length+this.tasks[3].length>0) {
      this.activeKey=['1']
    }
    //考虑第三组
    else if(this.tasks[2].length>0){
      this.activeKey=['3']
    }
  },
  computed:{
  },
  destroyed() {
    clearInterval(this.interval)
  }
}
</script>