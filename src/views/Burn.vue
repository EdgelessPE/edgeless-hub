<template>
  <div>
    <a-steps :current="stepsInfo.step">
      <a-step v-for="(i,index) in stepsInfo.data" :key="index" :title="i.title"/>
    </a-steps>
    <div class="steps-content" key="0" v-if="stepsInfo.step===0">
      <a-result title="在开始之前，我们需要下载一些必要的依赖文件" subTitle="请保证您的网络连接稳定可靠">
        <template #icon>
          <a-icon type="cloud-download"/>
        </template>
        <template #extra>
          <a-space direction="vertical" style="width: 100%">
            <div v-if="showProgress">
              <a-row>
                <a-col :span="8">
                  Ventoy {{ ventoyInfo.version }}
                </a-col>
                <a-col :span="12">
                  <a-progress
                      :percent="Number((($store.state.ventoyInfo.task.completedLength*100)/$store.state.ventoyInfo.task.totalLength).toFixed(1))"
                      status="active"/>
                </a-col>
                <a-col :span="4">
                  {{ getSizeString($store.state.ventoyInfo.task.downloadSpeed) + "/s" }}
                </a-col>
              </a-row>

              <a-row>
                <a-col :span="8">
                  {{ ventoyInfo.pluginName }}
                </a-col>
                <a-col :span="12">
                  <a-progress
                      :percent="Number((($store.state.ventoyPluginInfo.task.completedLength*100)/$store.state.ventoyPluginInfo.task.totalLength).toFixed(1))"
                      status="active"/>
                </a-col>
                <a-col :span="4">
                  {{ getSizeString($store.state.ventoyPluginInfo.task.downloadSpeed) + "/s" }}
                </a-col>
              </a-row>

              <a-row>
                <a-col :span="8">
                  {{ edgelessInfo.isoName }}
                </a-col>
                <a-col :span="12">
                  <a-progress
                      :percent="Number((($store.state.isoInfo.task.completedLength*100)/$store.state.isoInfo.task.totalLength).toFixed(1))"
                      status="active"/>
                </a-col>
                <a-col :span="4">
                  {{ getSizeString($store.state.isoInfo.task.downloadSpeed) + "/s" }}
                </a-col>
              </a-row>
            </div>

            <a-button v-else type="primary" v-on:click="startNesDownload" :loading="stepsInfo.stepText!=='开始'">
              {{ stepsInfo.stepText }}
            </a-button>
          </a-space>
        </template>
      </a-result>
    </div>
    <div class="steps-content" key="1" v-else-if="stepsInfo.step===1">
      <a-result title="请手动操作Ventoy安装程序，将Ventoy安装至您的U盘" subTitle="完成安装后关闭Ventoy安装程序或点击检查">
        <template #icon>
          <a-icon type="bulb"/>
        </template>
        <template #extra>

          <template v-if="showNormalButton">
            <a-button type="primary" v-on:click="checkVentoyUDisk" :loading="checkingVentoy">
              检查
            </a-button>
          </template>
          <template v-if="showExecVentoyButton&&!manual">
            <a-space direction="vertical">
              <a-alert message="如果您将Ventoy安装到了移动硬盘，请点击再次检查按钮" type="info"/>
              <a-space>
                <a-button type="primary" v-on:click="checkVentoyUDisk" :loading="checkingVentoy">
                  再次检查
                </a-button>
                <a-button v-on:click="execVentoy">
                  重启Ventoy
                </a-button>
              </a-space>
            </a-space>
          </template>
          <template v-if="manual">
            <a-space direction="vertical">
              <a-alert
                  message=".net运行库缺失，无法自动检测Ventoy"
                  description="请确保您已经写入了Ventoy到启动盘，然后手动选择您的盘符"
                  type="warning"
                  show-icon
              />
              <div>
                请选择您刚刚写入了Ventoy的启动盘：
                <a-select @change="selectVentoyPart" size="small">
                  <a-select-option v-for="item in diskList" :value="item" :key="item">
                    {{ item }}：
                  </a-select-option>
                </a-select>
              </div>
              <a-space>
                <a-button type="primary" v-on:click="jumpToStep3">
                  开始部署
                </a-button>
                <a-button v-on:click="execVentoy">
                  重启Ventoy
                </a-button>
              </a-space>
            </a-space>
          </template>
        </template>
      </a-result>
    </div>
    <div class="steps-content" key="2" v-else-if="stepsInfo.step===2">
      <a-result :title="'正在向'+selectedVentoyPart+'盘部署Edgeless，请稍候...'" subTitle="稍安勿躁，您的启动盘马上就好">
        <template #icon>
          <a-icon type="usb"/>
        </template>
        <template #extra>
          <a-row>
            <a-col :span="4">
              {{ stepsInfo.stepText }}
            </a-col>
            <a-col :span="20">
              <a-progress :percent="stepsInfo.step3percent" status="active"/>
            </a-col>
          </a-row>
        </template>
      </a-result>
    </div>
    <div class="steps-content" key="3" v-else-if="stepsInfo.step===3">
      <a-result
          status="success"
          title="您的Edgeless启动盘已经就绪！"
          sub-title="重启后选择从U盘启动即可进入Edgeless"
      >
        <a-button slot="extra" v-on:click="gotoWiki">如何启动</a-button>
      </a-result>
    </div>

  </div>
</template>

<script>
import {notification} from "ant-design-vue";
import DownloadManager from "@/components/DownloadManager"

const cp = window.require('child_process')

export default {
  name: "Burn",
  data() {
    return {
      interval: '',
      progressInterval: "",
      speed: 0.1,
      stageLimit: 0.3,
      checkingVentoy: false,
      startedTasks: [false, false, false],
      finishedTasks: [false, false, false],
      showProgress: false,
      driveInfo: {
        'names': [],
        'labels': [],
        'removable': []
      },
      selectedVentoyPart: "",
      ventoyInfo: {
        'version': "",
        'gid': "",
        'url': "",
        'fileName': "",
        'ventoyPath': "",
        'pluginName': "ventoy_wimboot.img",
        'finishUnzip': false,
        'queryUrl': 'https://gitee.com/api/v5/repos/longpanda/Ventoy/releases/latest' //'https://gitee.com/api/v5/repos/longpanda/Ventoy/releases/latest'
      },
      edgelessInfo: {
        isoName: "Edgeless_Beta_3.1.0.iso",
        url: ""
      },
      whenReadyUnzip: false, //当检测到下载完成时发送unzip事件
      showExecVentoyButton: false,
      stepsInfo: {
        hasVentoy: false,
        step: 0,
        stepText: "开始",
        step3percent: 0,
        data: [
          {
            title: "下载依赖文件",
            content: "Edgeless Hub将自动获取最新版Ventoy启动盘制作程序"
          },
          {
            title: "安装Ventoy",
            content: "手动点击，将Ventoy安装至您的U盘"
          },
          {
            title: "部署Edgeless",
            content: "Edgeless Hub会自动处理启动盘以完成Edgeless的安装"
          }
        ]
      },
      //手动选盘符相关
      manual: false,
      diskList: []
    }
  },
  methods: {
    startNesDownload() {
      this.stepsInfo.stepText = '请求中...'
      this.startVentoyDownload()
      this.startPluginDownload()
      this.startIsoDownload()
    },
    startVentoyDownload() {
      //下载Ventoy，向码云api发送请求
      this.$axios.get(this.ventoyInfo.queryUrl)
          .then((res) => {
            let urls = res.data.assets
            //查找关键词windows，解析对应的url和version
            urls.forEach((i) => {
              if (i['name'] && i['name'].indexOf('windows') > 0) {
                this.ventoyInfo.fileName = i['name']
                this.ventoyInfo.url = i['browser_download_url']
                this.ventoyInfo.version = res.data.tag_name
              }
            })
            if (this.ventoyInfo.url === "") {
              notification.open({
                message: '获取Ventoy的Release信息失败',
                description: "不存在对应的Windows版本"
              })
            } else {
              //发送下载请求
              DownloadManager.methods.aria2cDownloaderDir(this.ventoyInfo.url, false, this.$store.state.downloadDir + '\\Burn', (res) => {
                this.$store.commit('changeVentoyInfo', {
                  needTrace: true,
                  gid: res.data.result,
                  task: {
                    "totalLength": 1,
                    "completedLength": 0,
                    "downloadSpeed": 1
                  }
                })
                this.$store.commit('changeFileName', {
                  index: 0,
                  data: this.ventoyInfo.fileName
                })
                //启动下载完成时unzip监测
                this.whenReadyUnzip = true
                this.startedTasks[0] = true
              })
            }
          })
          .catch((err) => {
            notification.open({
              message: '获取Ventoy的Release信息失败',
              description: err.message
            })
          })
    },
    startPluginDownload() {
      //下载插件，向下载站发送请求
      this.$axios.get('https://pineapple.edgeless.top/api/list/1?path=Socket')
          .then((res) => {
            let url = ""
            res.data.data.forEach((item) => {
              if (item.name === this.ventoyInfo.pluginName) {
                url = item.url.replace('file/1', 'disk')
              }
            })
            if (url === "") {
              notification.open({
                message: '获取插件下载路径出错',
                description: "服务器端不存在此文件"
              })
            } else {
              DownloadManager.methods.aria2cDownloaderDir(url, false, this.$store.state.downloadDir + '\\Burn', (res) => {
                this.$store.commit('changeVentoyPluginInfo', {
                  needTrace: true,
                  gid: res.data.result,
                  task: {
                    "totalLength": 1,
                    "completedLength": 0,
                    "downloadSpeed": 1
                  }
                })
                this.$store.commit('changeFileName', {
                  index: 1,
                  data: this.ventoyInfo.pluginName
                })
                this.startedTasks[1] = true
              })
            }
          })
          .catch((err) => {
            notification.open({
              message: '获取Ventoy插件信息失败',
              description: err.message
            })
          })
    },
    startIsoDownload() {
      //下载ISO，向下载站发送请求
      this.$axios.get('https://pineapple.edgeless.top/api/list/1?path=Socket')
          .then((res) => {
            let url = ""
            res.data.data.forEach((item) => {
              if (item.name.indexOf('Edgeless') === 0 && item.name.indexOf('.iso') > 0) {
                url = item.url.replace('file/1', 'disk')
                this.edgelessInfo.url = item.url.replace('file/1', 'disk')
                this.edgelessInfo.isoName = item.name
              }
            })
            if (url === "") {
              notification.open({
                message: '获取ISO镜像下载路径出错',
                description: "服务器端不存在此文件"
              })
            } else {
              DownloadManager.methods.aria2cDownloaderDir(url, false, this.$store.state.downloadDir + '\\Burn', (res) => {
                this.$store.commit('changeIsoInfo', {
                  needTrace: true,
                  gid: res.data.result,
                  task: {
                    "totalLength": 1,
                    "completedLength": 0,
                    "downloadSpeed": 1
                  }
                })
                this.$store.commit('changeFileName', {
                  index: 2,
                  data: this.edgelessInfo.isoName
                })
                this.startedTasks[2] = true
              })
            }
          })
          .catch((err) => {
            notification.open({
              message: '获取ISO镜像信息失败',
              description: err.message
            })
          })
    },
    selectVentoyPart(val) {
      this.selectedVentoyPart = val
    },
    jumpToStep3() {
      if (!DownloadManager.methods.exist(this.selectedVentoyPart + ':\\')) {
        notification.open({
          message:'错误：路径不存在',
          description:"请选择一个存在的盘符"
        })
        return
      }
      //翻页并执行step3
      this.stepsInfo.step = 2
      this.edgelessOperator()
    },
    getSizeString(size) {
      if (size < 1024) return Number(size).toFixed(2) + "B"
      else if (size < 1024 * 1024) return (size / 1024).toFixed(2) + "KB"
      else if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + "MB"
      else return (size / (1024 * 1024 * 1024)).toFixed(2) + "GB"
    },
    execVentoy() {
      cp.exec('Ventoy2Disk.exe', {
        'cwd': this.ventoyInfo.ventoyPath
      }, (res) => {
        //Ventoy安装程序运行结束
        this.checkVentoyUDisk()
      })
    },
    checkVentoyUDisk() {
      this.checkingVentoy = true
      //用户点击了下一步，开始检查Ventoy启动盘是否就绪
      this.$electron.ipcRenderer.send('scanDisks-request', '')
    },
    edgelessOperator() {
      //复制ventoy_wimboot插件（3MB）
      this.stepsInfo.stepText = "复制ventoy_wimboot插件"
      DownloadManager.methods.mkdir(this.selectedVentoyPart + ':\\ventoy\\')
      DownloadManager.methods.copy(this.$store.state.downloadDir + '\\Burn\\' + this.ventoyInfo.pluginName, this.selectedVentoyPart + ':\\ventoy\\' + this.ventoyInfo.pluginName, true, () => {
        this.speed = 0.23 //MB/s，预设的UltraISO释放进度步长
        this.stepsInfo.step3percent = 3.4

        //启动动态进度条计时器
        this.progressInterval = setInterval(() => {
          if (this.stepsInfo.step3percent + this.speed < this.stageLimit) {
            this.stepsInfo.step3percent += this.speed
            this.stepsInfo.step3percent = Number(this.stepsInfo.step3percent.toFixed(1))
          } else {
            this.speed /= 10
          }
        }, 1000)

        //解包ISO（678MB）
        this.stepsInfo.stepText = "解包镜像文件"
        this.stageLimit = 10
        this.unpackISO(() => {
          this.stepsInfo.step3percent = this.stageLimit
          let startTime = Date.now()
          //复制Edgeless文件夹（74MB） xcopy /s /r /y .\Edgeless %FI_Part%:\Edgeless\
          this.stepsInfo.stepText = "复制Edgeless文件夹"
          this.stageLimit = 15.4
          DownloadManager.methods.copyDic(this.$store.state.downloadDir + '\\Burn\\release\\Edgeless', this.selectedVentoyPart + ':\\Edgeless\\', true, () => {
            this.stepsInfo.step3percent = this.stageLimit
            this.speed = (75776 / (Date.now() - startTime)) * 0.8 //MB/s，估算的写入速度
            console.log('speed1=' + this.speed.toFixed(1))
            this.speed = 84.6 * (this.speed / 678)
            console.log('speed2=' + this.speed.toFixed(1))

            //复制boot.wim（612MB）
            this.stepsInfo.stepText = "复制boot.wim"
            this.stageLimit = 99.9
            DownloadManager.methods.copy(this.$store.state.downloadDir + '\\Burn\\release\\sources\\boot.wim', this.selectedVentoyPart + ':\\' + this.edgelessInfo.isoName.split('.iso')[0] + '.wim', true, () => {
              this.stepsInfo.step3percent = 100

              this.stepsInfo.stepText = "完成"
              clearInterval(this.progressInterval)
              this.stepsInfo.step = 3
            })
          })
        })
      })
    },
    unpackISO(callback) {
      //注册完成事件监听
      this.$electron.ipcRenderer.on('unpackISO-reply', callback)
      //发送解包事件
      this.$electron.ipcRenderer.send('unpackISO-request', {
        src: this.$store.state.downloadDir + '\\Burn\\' + this.edgelessInfo.isoName,
        dst: this.$store.state.downloadDir + '\\Burn\\release'
      })
    },
    gotoWiki() {
      this.$router.push('/wiki?location=https://home.edgeless.top/guide')
    }
  },
  computed: {
    showNormalButton: function () {
      return !this.showExecVentoyButton && !this.manual
    }
  },
  created() {
    //在下载目录创建Burn文件夹
    DownloadManager.methods.mkdir(this.$store.state.downloadDir + '\\Burn')

    //从store中恢复状态
    let state = this.$store.state.BurnStateStorage
    this.startedTasks = state.startedTasks
    this.finishedTasks = state.finishedTasks
    this.showExecVentoyButton = state.showExecVentoyButton
    this.whenReadyUnzip = state.whenReadyUnzip
    this.showProgress = state.showProgress
    this.speed = state.speed
    this.stageLimit = state.stageLimit
    this.stepsInfo = state.stepsInfo
    this.selectedVentoyPart = state.selectedVentoyPart
    this.ventoyInfo = state.ventoyInfo

    //配置定时任务
    this.interval = setInterval(() => {
          //当下载Ventoy完成时unzip
          if (this.whenReadyUnzip) {
            if (!this.$store.state.ventoyInfo.needTrace && this.$store.state.ventoyInfo.task.completedLength === this.$store.state.ventoyInfo.task.totalLength) {
              //此时下载已经完成
              this.whenReadyUnzip = false
              this.stepsInfo.stepText = "解压中..."
              this.$electron.ipcRenderer.send('unzip-request', {
                'zip': this.$store.state.downloadDir + '\\Burn\\*.zip',
                'path': this.$store.state.downloadDir + '\\Burn'
              })
            }
          }
          //更新下载完成状态，检查是确实完成了还是出错
          if (this.startedTasks[0]) {
            this.finishedTasks[0] = !this.$store.state.ventoyInfo.needTrace
            if (this.startedTasks[0] && this.finishedTasks[0] && this.$store.state.ventoyInfo.task.totalLength !== this.$store.state.ventoyInfo.task.completedLength) {
              DownloadManager.methods.del(this.$store.state.downloadDir + '\\Burn\\' + this.ventoyInfo.fileName)
              DownloadManager.methods.del(this.$store.state.downloadDir + '\\Burn\\' + this.ventoyInfo.fileName + '.aria2')
              this.startVentoyDownload()
              this.finishedTasks[0] = false
            }
          }
          if (this.startedTasks[1]) {
            this.finishedTasks[1] = !this.$store.state.ventoyPluginInfo.needTrace
            if (this.startedTasks[1] && this.finishedTasks[1] && this.$store.state.ventoyPluginInfo.task.totalLength !== this.$store.state.ventoyPluginInfo.task.completedLength) {
              DownloadManager.methods.del(this.$store.state.downloadDir + '\\Burn\\' + this.ventoyInfo.pluginName)
              DownloadManager.methods.del(this.$store.state.downloadDir + '\\Burn\\' + this.ventoyInfo.pluginName + '.aria2')
              this.startPluginDownload()
              this.finishedTasks[1] = false
            }
          }
          if (this.startedTasks[2]) {
            this.finishedTasks[2] = !this.$store.state.isoInfo.needTrace
            if (this.startedTasks[2] && this.finishedTasks[2] && this.$store.state.isoInfo.task.completedLength !== this.$store.state.isoInfo.task.totalLength) {
              DownloadManager.methods.del(this.$store.state.downloadDir + '\\Burn\\' + this.edgelessInfo.isoName)
              DownloadManager.methods.del(this.$store.state.downloadDir + '\\Burn\\' + this.edgelessInfo.isoName + '.aria2')
              this.startIsoDownload()
              this.finishedTasks[2] = false
            }
          }

          //计算是否需要显示下载进度条
          this.showProgress = this.startedTasks[0] || this.startedTasks[1] || this.startedTasks[2]

          //在step=0时判断是否需要翻页翻到step=1
          if (this.stepsInfo.step === 0 && this.finishedTasks[0] && this.finishedTasks[1] && this.finishedTasks[2] && this.ventoyInfo.finishUnzip) {
            this.stepsInfo.step = 1

            //运行Ventoy安装程序
            this.execVentoy()
          }
        }
        , 1000)

    //监听回复
    this.$electron.ipcRenderer.on('scanDisks-reply', (event, res) => {
      if (res) {
        //获取主进程发送的磁盘信息，开始检查Ventoy是否就绪
        this.driveInfo = res
        this.selectedVentoyPart = ""
        for (let i = 0; i < this.driveInfo.labels.length; i++) {
          //跳过本地磁盘
          if (!this.showExecVentoyButton && this.driveInfo.removable[i] === 0) continue
          //检查Ventoy在卷标中是否出现
          if (this.driveInfo.labels[i] === "Ventoy") {
            this.selectedVentoyPart = this.driveInfo.names[i]
            break
          }
        }
        if (this.selectedVentoyPart === "") {
          //Ventoy盘未发现
          this.showExecVentoyButton = true
          notification.open({
            message: '错误：没有发现Ventoy启动盘',
            description: "请确保已经完成Ventoy的安装，再点击检查按钮！"
          })
        } else {
          this.jumpToStep3()
        }
        this.checkingVentoy = false
      } else {
        //处理c#无法正常运行时的手动选择
        //生成本地磁盘数组
        for (let i = 25; i >= 0; i--) {
          if (DownloadManager.methods.exist(String.fromCharCode(65 + i) + ':\\')) {
            this.diskList.push(String.fromCharCode(65 + i))
          }
        }
        //console.log(this.diskList)
        this.manual = true
      }
    })
    this.$electron.ipcRenderer.on('unzip-reply', (event, res) => {
      //获取文件夹名
      let tmp = this.ventoyInfo.fileName.split('-')
      this.ventoyInfo.ventoyPath = this.$store.state.downloadDir + '\\Burn\\' + tmp[0] + '-' + tmp[1]
      this.ventoyInfo.finishUnzip = true
    })
  },
  destroyed() {
    clearInterval(this.interval)
    //保存当前状态到store
    this.$store.commit('saveBurnState', {
      startedTasks: this.startedTasks,
      finishedTasks: this.finishedTasks,
      whenReadyUnzip: this.whenReadyUnzip,
      showExecVentoyButton: this.showExecVentoyButton,
      showProgress: this.showProgress,
      speed: this.speed,
      stageLimit: this.stageLimit,
      stepsInfo: this.stepsInfo,
      selectedVentoyPart: this.selectedVentoyPart,
      ventoyInfo: this.ventoyInfo
    })
  },
  beforeRouteLeave(to, from, next) {
    //当step=2时阻止用户切换页面
    if (this.stepsInfo.step === 2) {
      notification.open({
        message: '现在不能离开当前页面！',
        description: "请耐心等待部署任务完成"
      })
    } else {
      next()
    }
  }
}
</script>