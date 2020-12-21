<template>
  <a-collapse v-model="activeKey">
    <a-collapse-panel key="1" :header="'下载中（'+(tasks[0].length+tasks[1].length)+'）'">
      <TaskNode v-if="!disable0" index="0"/>
      <TaskNode v-if="!disable1" index="1"/>
    </a-collapse-panel>
    <a-collapse-panel key="2" :header="'安装中（'+-1+'）'">
    </a-collapse-panel>
    <a-collapse-panel key="3" :header="'已完成（'+tasks[2].length+'）'">
      <TaskNode index="2"/>
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
      tasks:[[],[],[]],
      disable0:true,
      disable1:true,
      disable2:true,
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

      //更新三个折叠组的禁用情况
      this.disable0 = this.tasks[0].length <= 0
      this.disable1 = this.tasks[1].length <= 0
      this.disable2 = this.tasks[2].length <= 0
    },
  },
  mounted() {
    this.updateData()
    this.interval=setInterval(()=>{
      this.updateData()
    },1000)
  },
  computed:{
  },
  destroyed() {
    clearInterval(this.interval)
  }
}
</script>