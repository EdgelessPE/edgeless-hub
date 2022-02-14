<template>
  <div>
    <a-page-header
        title="设置中心"
        @back="() => $router.go(-1)"
    />
    <a-card title="用户称呼" style="width: 100%">
      <a-input v-model="userName"></a-input>
    </a-card>
    <br/>
    <a-card title="侧边栏主题" style="width: 100%">
      <a-switch checked-children="亮" un-checked-children="暗" :default-checked="$store.state.theme==='light'"
                @change="changeTheme"/>
    </a-card>
    <br/>
    <a-card title="Edgeless启动盘盘符" style="width: 100%">
      <a-select v-model="currentEdgelessDisk" @change="changeDisk">
        <a-select-option v-for="(item,index) in edgelessDisks" :value="(index===0)?'A':item" :key="index">
          {{ item + (item === '自动' ? '' : '：') }}
        </a-select-option>
      </a-select>
    </a-card>
    <br/>
    <a-card title="下载缓存目录" style="width: 100%">
      当前目录：{{ $store.state.downloadDir }}
      <br/><br/>
      <a-button @click="chooseDir">选择</a-button>
    </a-card>
    <br/>
    <a-card title="插件镜像源" style="width: 100%">
      菠萝云由
      <img v-on:click="open('https://wngamebox.cn/')" src="https://oss.wngamebox.cn/wp-content/uploads/2020/10/logo.png"
           height="20" width="88"/>
      提供，亦是Edgeless后端服务托管赞助商
      <br/><br/>
      <a-select :default-value="mirrors[$store.state.stationIndex].name" @change="changeMirror">
        <a-select-option v-for="item in mirrors" :value="item.name" :key="item.name">
          {{ item.name }}
        </a-select-option>
      </a-select>
    </a-card>
    <br/>
    <a-card title="许可证与协议" style="width: 100%">
      使用本软件即代表您已详细阅读并同意用户协议
      <br/><br/>
      <a-space>
        <a-button @click="$router.push('/wiki?location=https://wiki.edgeless.top/v2/global/contract.html')">
          用户协议
        </a-button>
        <a-button @click="$router.push('/licence')">
          开放源代码许可
        </a-button>
      </a-space>
    </a-card>
    <br/>
    <a-card title="开发者工具" style="width: 100%">
      <a-space>
        <a-button v-on:click="openDevTool">Devtool</a-button>
        <a-button @click="$router.push('/test')">
          调试页面
        </a-button>
      </a-space>
    </a-card>
  </div>
</template>

<script>
import DownloadManager from "@/components/DownloadManager";
import StationList from '@/stationpool/main'
import {notification} from "ant-design-vue";

export default {
  name: "Setting",
  data() {
    return {
      interval: '',
      edgelessDisks: [],
      currentEdgelessDisk: 'A',
      mirrors: [],
      userName: ""
    }
  },
  methods: {
    chooseDir() {
      //向主进程发送打开目录选择对话框事件
      this.$electron.ipcRenderer.send('openDirectoryDialog-request', '')
    },
    changeTheme(val, event) {
      if (val) {
        this.$store.commit('changeTheme', 'light')
      } else {
        this.$store.commit('changeTheme', 'dark')
      }
    },
    changeDisk(val) {
      if (val !== '自动') {
        this.$store.commit('setPluginPath', val)
        //console.log('set disk:'+val)
      } else {
        this.$store.commit('setPluginPath', 'A')
      }
    },
    changeMirror(val) {
      //查找版本号
      let position = 0
      for (let i = 0; i < this.mirrors.length; i++) {
        if (this.mirrors[i].name === val) {
          position = i
          break
        }
      }
      //提示等待载入
      this.$message.info({content: '正在刷新镜像站索引，请耐心等待...\n如果长时间无成功提示请切换到其他镜像站', key: 'updateMirror'})
      //更新Vuex
      this.$store.commit('updateStationObject', position)
      //发送刷新数据事件
      this.$root.eventHub.$emit('update-mirror', {})
    },
    open(url) {
      const {shell} = window.require('electron')
      shell.openExternal(url)
    },
    openDevTool() {
      this.$electron.ipcRenderer.send('devtool-request', '')
    }
  },
  created() {
    //初始化DownloadManager
    DownloadManager.methods.init(this.$axios, this.$store, this.$root)
    this.mirrors = StationList
    this.interval = setInterval(() => {
      //定时更新启动盘列表数据
      this.edgelessDisks = DownloadManager.methods.getUSBList()
      this.currentEdgelessDisk = this.$store.state.pluginPath.split(':')[0]
    }, 1000)
    //设置事件监听
    this.$electron.ipcRenderer.on('openDirectoryDialog-reply', (event, arg) => {
      if (arg){
        if(!arg[0].endsWith("HubCache")){
          this.$store.commit('changeDownloadDir', arg[0] + "\\HubCache")
        }else{
          this.$store.commit('changeDownloadDir', arg[0])
        }
      }
    })

    //同步userName
    this.userName = this.$store.state.userName
  },
  destroyed() {
    clearInterval(this.interval)
    if (this.userName === "") this.userName = window.require('os').userInfo().username
    this.$store.commit('updateUserName', this.userName)
    this.$root.eventHub.$emit('config-updated', '')
    DownloadManager.methods.writeConfig()
  }
}
</script>
