<template>
  <div>
    <a-page-header
        title="任务管理"
        :sub-title="($store.state.tasks[0].length===0)?'':getSizeString($store.state.globalData.downloadSpeed)+'/s'"
        @back="() => $router.go(-1)"
    >
      <template slot="extra">
        <a-button v-on:click="openCacheDir">
          缓存目录
        </a-button>
        <a-button v-on:click="openPluginDir">
          浏览插件
        </a-button>
      </template>
    </a-page-header>
    <a-collapse v-model="activeKey" :bordered="false">
      <a-collapse-panel key="1" :header="'下载中（'+($store.state.tasks[0].length+$store.state.tasks[1].length)+'）'"
                        :style="customStyle">
        <TaskNode v-if="$store.state.tasks[0].length!==0" index="0" key="0"/>
        <TaskNode v-if="$store.state.tasks[1].length!==0" index="1" key="1"/>
        <TaskNode v-if="$store.state.tasks[3].length!==0" index="3" key="3"/>
      </a-collapse-panel>
      <a-collapse-panel key="2" :header="'安装中（'+($store.state.copyWaitingPool.length)+'）'" :style="customStyle">
        <TaskNode v-if="$store.state.copyWaitingPool.length!==0" index="13" key="13"/>
      </a-collapse-panel>
      <a-collapse-panel key="3" :header="'已安装（'+($store.state.fileList.length+$store.state.updateList.length)+'）'"
                        :style="customStyle">
        <TaskNode v-if="$store.state.updateList.length!==0" index="12" key="12"/>
        <TaskNode v-if="$store.state.fileList.length!==0" index="11" key="11"/>
      </a-collapse-panel>
    </a-collapse>
  </div>

</template>

<script>
import TaskNode from "@/components/TaskNode";

export default {
  name: "Down",
  data() {
    return {
      activeKey: [],
      customStyle:
          'background: #ffffff;border-radius: 4px;margin-bottom: 0px;border: 0;overflow: hidden',
    }
  },
  components: {
    TaskNode
  },
  methods: {
    getSizeString(size) {
      if (size < 1024) return Number(size).toFixed(2) + "B"
      else if (size < 1024 * 1024) return (size / 1024).toFixed(2) + "KB"
      else if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + "MB"
      else return (size / (1024 * 1024 * 1024)).toFixed(2) + "GB"
    },
    openCacheDir() {
      this.$electron.shell.openPath(this.$store.state.downloadDir + "\\")
    },
    openPluginDir() {
      this.$electron.shell.openPath(this.$store.state.pluginPath + "\\")
    }
  },
  mounted() {
    // this.updateData()
    // this.interval=setInterval(()=>{
    //   this.updateData()
    // },1000)
    //展开第一个不为0的折叠组
    //考虑第一组
    this.activeKey = []
    if (this.$store.state.tasks[0].length + this.$store.state.tasks[1].length + this.$store.state.tasks[3].length > 0) {
      this.activeKey.push('1')
    }
    //考虑第二组
    if (this.$store.state.copyWaitingPool.length > 0) {
      this.activeKey.push('2')
    }
    //考虑第三组
    if (this.activeKey.length === 0 && this.$store.state.fileList.length + this.$store.state.updateList.length > 0) {
      this.activeKey.push('3')
    }
  },
  computed: {}
}
</script>