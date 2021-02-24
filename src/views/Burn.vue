<template>
  <div>
    <a-modal
        :title="firstMovableInfo.label+'('+firstMovableInfo.name+':)'"
        v-if="firstMovableInfo"
        :visible="showConfirm"
        @ok="handleConfirm"
        @cancel="emergency"
        cancelText="不是"
        okText="是的"
    >
      <p>您刚刚制作的Ventoy启动盘是这个吗？</p>
    </a-modal>
    <a-steps :current="stepsInfo.step">
      <a-step v-for="(i,index) in stepsInfo.data" :key="index" :title="i.title"/>
    </a-steps>
    <div class="steps-content" key="0" v-if="stepsInfo.step===0">
      <a-result title="在开始之前，我们需要下载一些必要的依赖文件" subTitle="Edgeless不是维护用PE，对劣质U盘和旧型号电脑兼容性不佳，请选用知名品牌U盘制作">
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
      <a-result title="请手动操作Ventoy安装程序，将Ventoy安装至您的U盘">
        <template slot="subTitle">
          如果您正在使用官方版Ventoy，点击升级即可
          <br/>
          完成安装后关闭Ventoy安装程序或点击检查
        </template>
        <template #icon>
          <a-icon type="bulb"/>
        </template>
        <template #extra>

          <template v-if="showNormalButton">
            <a-button type="primary" v-on:click="checkVentoyUDisk" :loading="checkingVentoy">
              检查
            </a-button>
            <a-button v-on:click="emergency" v-if="checkingVentoy">紧急出口</a-button>
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
                <a-button v-on:click="emergency">紧急出口</a-button>
              </a-space>
            </a-space>
          </template>
          <template v-if="manual">
            <a-space direction="vertical">
              <a-alert
                  message="无法自动检测Ventoy启动盘"
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
              正在{{ stepsInfo.stepText }}...
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
      diskList: [],

      //确认扫描结果相关
      firstMovableInfo:undefined,
      showConfirm:false,

      //下载失败重试次数
      retryTimes:[0,0,0],
      maxAllowedRetry:1
    }
  },
  methods: {
    handleConfirm(){
      this.$rp.log("用户点击确认，前往步骤三-handleConfirm")
      this.showConfirm=false
      this.selectedVentoyPart=this.firstMovableInfo.name
      this.stepsInfo.step = 2
      this.edgelessOperator()
    },
    startNesDownload() {
      this.$rp.log("开始下载依赖-startNesDownload")
      this.stepsInfo.stepText = '请求'
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
            this.$rp.log("获得ventoy的下载地址："+this.ventoyInfo.url+"-startVentoyDownload")
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
                this.$rp.log("ventoy信息：文件名="+this.ventoyInfo.fileName+" gid="+res.data.result+"-startVentoyDownload")
                //启动下载完成时unzip监测
                this.whenReadyUnzip = true
                this.startedTasks[0] = true
              })
            }
          })
          .catch((err) => {
            this.$rp.log("获取Ventoy的Release信息失败-startVentoyDownload")
            notification.open({
              message: '获取Ventoy的Release信息失败',
              description: err.message
            })
          })
    },
    startPluginDownload() {
      this.$rp.log("开始下载wim插件-startPluginDownload")
      //配置插件名称
      this.ventoyInfo.pluginName="ventoy_wimboot.img"
      //下载插件，向下载站发送请求
      DownloadManager.methods.aria2cDownloaderDir("https://pineapple.edgeless.top/api/v2/info/ventoy_plugin_addr", false, this.$store.state.downloadDir + '\\Burn', (res) => {
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
        this.$rp.log("wim插件：文件名="+this.ventoyInfo.pluginName+" gid="+res.data.result+"-startPluginDownload")
        this.startedTasks[1] = true
      })
    },
    // startIsoDownload_old() {
    //   //下载ISO，向下载站发送请求
    //   this.$axios.get('https://pineapple.edgeless.top/api/list/1?path=Socket')
    //       .then((res) => {
    //         let url = ""
    //         res.data.data.forEach((item) => {
    //           if (item.name.indexOf('Edgeless') === 0 && item.name.indexOf('.iso') > 0) {
    //             url = item.url.replace('file/1', 'disk')
    //             this.edgelessInfo.url = item.url.replace('file/1', 'disk')
    //             this.edgelessInfo.isoName = item.name
    //           }
    //         })
    //         if (url === "") {
    //           notification.open({
    //             message: '获取ISO镜像下载路径出错',
    //             description: "服务器端不存在此文件"
    //           })
    //         } else {
    //           DownloadManager.methods.aria2cDownloaderDir(url, false, this.$store.state.downloadDir + '\\Burn', (res) => {
    //             this.$store.commit('changeIsoInfo', {
    //               needTrace: true,
    //               gid: res.data.result,
    //               task: {
    //                 "totalLength": 1,
    //                 "completedLength": 0,
    //                 "downloadSpeed": 1
    //               }
    //             })
    //             this.$store.commit('changeFileName', {
    //               index: 2,
    //               data: this.edgelessInfo.isoName
    //             })
    //             this.startedTasks[2] = true
    //           })
    //         }
    //       })
    //       .catch((err) => {
    //         notification.open({
    //           message: '获取ISO镜像信息失败',
    //           description: err.message
    //         })
    //       })
    // },
    startIsoDownload(){
      this.$rp.log("开始下载ISO-startIsoDownload")
      let url="https://pineapple.edgeless.top/api/v2/info/iso"
      this.$axios.get(url)
      .then((res)=>{
        this.$rp.log("更新ISO信息：文件名="+res.data.name+" url="+res.data.url+" version="+res.data.version+"-startIsoDownload")
        //更新文件名
        this.$store.commit('changeFileName', {
          index: 2,
          data: res.data.name
        })
        //开始下载任务
        DownloadManager.methods.aria2cDownloaderDir(res.data.url,false, this.$store.state.downloadDir + '\\Burn',(response)=>{
          this.$store.commit('changeIsoInfo', {
            needTrace: true,
            gid: response.data.result,
            task: {
              "totalLength": 1,
              "completedLength": 0,
              "downloadSpeed": 1
            }
          })
          this.$rp.log("ISO下载gid："+response.data.result+"-startIsoDownload")
          this.startedTasks[2] = true
        })
      })
          .catch((err) => {
            this.$rp.log("获取ISO镜像信息失败-startIsoDownload")
            notification.open({
              message: '获取ISO镜像信息失败',
              description: err.message
            })
          })
    },
    selectVentoyPart(val) {
      this.$rp.log("用户手动选择了盘符："+val+"-selectVentoyPart")
      if(DownloadManager.methods.exist(val+":\\Edgeless")){
        notification.open({
          message:'警告：'+val+"盘存在Edgeless文件夹，请检查是否存在误判",
          description:"如果仍旧需要重新制作，请删除Edgeless文件夹"
        })
      }
      this.selectedVentoyPart = val
    },
    jumpToStep3() {
      this.$rp.log("前往步骤3 this.selectedVentoyPart="+this.selectedVentoyPart+"-jumpToStep3")
      //console.log(this.selectedVentoyPart)
      if (this.selectedVentoyPart===""||(!DownloadManager.methods.exist(this.selectedVentoyPart + ':\\'))) {
        this.$rp.log("错误：盘符代表的路径不存在:"+this.selectedVentoyPart + ':\\-jumpToStep3')
        notification.open({
          message:'错误：路径不存在',
          description:"请选择一个存在的盘符"
        })
        return
      }
      //翻页并执行step3
      this.$rp.log("翻页并执行step3-jumpToStep3")
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
      this.$rp.log("调用Ventoy安装程序-execVentoy")
      cp.exec('Ventoy2Disk.exe', {
        'cwd': this.ventoyInfo.ventoyPath
      }, (res) => {
        this.$rp.log("Ventoy安装程序运行结束，调用checkVentoyUDisk-execVentoy")
        //Ventoy安装程序运行结束
        this.checkVentoyUDisk()
      })
    },
    checkVentoyUDisk() {
      this.$rp.log("校验Ventoy，发送scanDisks-request事件-checkVentoyUDisk")
      this.checkingVentoy = true
      //用户点击了下一步，开始检查Ventoy启动盘是否就绪
      this.$electron.ipcRenderer.send('scanDisks-request', '')
    },
    edgelessOperator() {
      this.$rp.log("步骤3开始 this.selectedVentoyPart="+this.selectedVentoyPart+"-edgelessOperator")
      //console.log(this.selectedVentoyPart)
      //return
      //校验目标盘符是否存在
      if(this.selectedVentoyPart===""||!DownloadManager.methods.exist(this.selectedVentoyPart+":\\")){
        this.$rp.log("错误：盘符代表的路径不存在:"+this.selectedVentoyPart + ':\\-edgelessOperator')
        notification.open({
          message: '错误：没有发现Ventoy启动盘',
          description: "步骤3操作失败，请检查后重试"
        })
        return
      }
      //校验是否存在Edgeless文件夹
      if(DownloadManager.methods.exist(this.selectedVentoyPart+":\\Edgeless")){
        notification.open({
          message:'警告：'+this.selectedVentoyPart+"盘存在Edgeless文件夹，即将覆盖Edgeless文件夹",
          description:"您可能会因此失去先前保存的插件等自定义内容"
        })
      }
      //复制ventoy_wimboot插件（3MB）
      this.$rp.log("开始复制ventoy_wimboot插件-edgelessOperator")
      this.stepsInfo.stepText = "复制ventoy_wimboot插件"
      DownloadManager.methods.mkdir(this.selectedVentoyPart + ':\\ventoy\\')
      DownloadManager.methods.copy(this.$store.state.downloadDir + '\\Burn\\' + this.ventoyInfo.pluginName, this.selectedVentoyPart + ':\\ventoy\\' + this.ventoyInfo.pluginName, true, () => {
        this.$rp.log("结束复制ventoy_wimboot插件-edgelessOperator")
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
        this.$rp.log("开始解包ISO-edgelessOperator")
        this.stepsInfo.stepText = "解包ISO文件"
        this.stageLimit = 10
        this.unpackISO(() => {
          this.$rp.log("结束解包ISO-edgelessOperator")
          this.stepsInfo.step3percent = this.stageLimit
          let startTime = Date.now()
          //复制Edgeless文件夹（74MB） xcopy /s /r /y .\Edgeless %FI_Part%:\Edgeless\
          this.stepsInfo.stepText = "解决Edgeless依赖"
          this.stageLimit = 15.4
          this.$rp.log("开始复制Edgeless文件夹-edgelessOperator")
          DownloadManager.methods.copyDir(this.$store.state.downloadDir + '\\Burn\\release\\Edgeless', this.selectedVentoyPart + ':\\Edgeless\\', true, () => {
            this.stepsInfo.step3percent = this.stageLimit
            this.speed = (75776 / (Date.now() - startTime)) * 0.8 //MB/s，估算的写入速度
            this.$rp.log("结束复制Edgeless文件夹，计算的写入速度："+this.speed+"-edgelessOperator")
            console.log('speed1=' + this.speed.toFixed(1))
            this.speed = 84.6 * (this.speed / 678)
            console.log('speed2=' + this.speed.toFixed(1))

            //复制boot.wim（612MB）
            this.$rp.log("开始复制boot.wim-edgelessOperator")
            this.stepsInfo.stepText = "拷贝Edgeless启动文件"
            this.stageLimit = 99.9
            DownloadManager.methods.copy(this.$store.state.downloadDir + '\\Burn\\release\\sources\\boot.wim', this.selectedVentoyPart + ':\\' + this.edgelessInfo.isoName.split('.iso')[0] + '.wim', true, () => {
              this.$rp.log("结束复制boot.wim，开始收集文件信息-edgelessOperator")
              this.stepsInfo.step3percent = 100

              this.stepsInfo.stepText = "完成"
              clearInterval(this.progressInterval)
              //收集文件信息
              let check=[false,false,false]
              if(DownloadManager.methods.exist(this.selectedVentoyPart + ':\\' + this.edgelessInfo.isoName.split('.iso')[0] + '.wim')) check[0]=true
              if(DownloadManager.methods.exist(this.selectedVentoyPart + ':\\Edgeless\\')) check[1]=true
              if(DownloadManager.methods.exist(this.selectedVentoyPart + ':\\ventoy\\' + this.ventoyInfo.pluginName)) check[2]=true
              this.$rp.log("iso,edgeless,plugin："+check[0]+","+check[1]+","+check[2]+"-edgelessOperator")
              if(check[0]&&check[1]&&check[2]){
                this.$rp.log("跳转到完成页面-edgelessOperator")
                this.stepsInfo.step = 3
              }else{
                //生成报错报告
                let ct="报错信息："
                if(!check[0]) ct+=" 启动文件缺失："+this.selectedVentoyPart + ':\\' + this.edgelessInfo.isoName.split('.iso')[0] + '.wim'
                if(!check[1]) ct+=" 启动依赖缺失："+this.selectedVentoyPart + ':\\Edgeless\\'
                if(!check[2]) ct+=" Ventoy插件缺失："+this.selectedVentoyPart + ':\\ventoy\\' + this.ventoyInfo.pluginName
                this.$rp.log("向用户报告错误："+ct+"-edgelessOperator")
                this.$error({
                  title: '错误：启动盘的文件不完全，请关闭程序后尝试重新制作',
                  content: ct
                });
              }
            })
          })
        })
      })
    },
    unpackISO(callback) {
      this.$rp.log("发送解包事件unpackISO-request -unpackISO")
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
    },
    emergency(){
      this.$rp.log("紧急模式被调用-emergency")
      //处理c#无法正常运行时的手动选择
      //生成本地磁盘数组
      this.showConfirm=false
      for (let i = 25; i >= 0; i--) {
        if (DownloadManager.methods.exist(String.fromCharCode(65 + i) + ':\\')) {
          this.diskList.push(String.fromCharCode(65 + i))
        }
      }
      //console.log(this.diskList)
      this.manual = true
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
    this.$rp.log("从store中恢复状态-Burn")
    this.$rp.log(JSON.stringify(state))

    //配置定时任务
    this.interval = setInterval(() => {
          //this.$rp.log("定时任务启动-Burn_setInterval")
          //当下载Ventoy完成时unzip
          if (this.whenReadyUnzip) {
            //this.$rp.log("检查当下载Ventoy完成时unzip-Burn_setInterval")
            if (!this.$store.state.ventoyInfo.needTrace) {
              if(this.$store.state.ventoyInfo.task.completedLength!==0 && this.$store.state.ventoyInfo.task.completedLength === this.$store.state.ventoyInfo.task.totalLength){
                this.$rp.log("Ventoy下载已经完成，发送解压事件unzip-request-Burn_setInterval")
                //此时下载已经完成
                this.whenReadyUnzip = false
                this.stepsInfo.stepText = "解压Ventoy"
                this.$electron.ipcRenderer.send('unzip-request', {
                  'zip': this.$store.state.downloadDir + '\\Burn\\*.zip',
                  'path': this.$store.state.downloadDir + '\\Burn'
                })
              }else{
                this.$error({
                  title:"Ventoy下载失败",
                  content:"请前往https://www.ventoy.net/cn/download.html手动下载最新的Windows版Ventoy放到"+this.$store.state.downloadDir + '\\Burn，然后重启程序重试'
                })
              }
            }
          }
          //更新下载完成状态，检查是确实完成了还是出错
          if(this.stepsInfo.step===0){
            if (this.startedTasks[0]) {
              if(!this.$store.state.ventoyInfo.needTrace && !this.finishedTasks[0]) this.$rp.log("Task0停止，totalLength="+this.$store.state.ventoyInfo.task.totalLength+" completedLength="+this.$store.state.ventoyInfo.task.completedLength+"-Burn_setInterval")
              this.finishedTasks[0] = !this.$store.state.ventoyInfo.needTrace
              if (this.startedTasks[0] && this.finishedTasks[0] && (this.$store.state.ventoyInfo.task.totalLength !== this.$store.state.ventoyInfo.task.completedLength || this.$store.state.ventoyInfo.task.completedLength===0)) {
                this.retryTimes[0]++
                if(this.retryTimes[0]>this.maxAllowedRetry){
                  this.$error({
                    title:"Ventoy下载失败",
                    content:"请前往https://www.ventoy.net/cn/download.html手动下载最新的Windows版Ventoy放到"+this.$store.state.downloadDir + '\\Burn，然后重启程序重试'
                  })
                  this.startedTasks[0]=false
                  this.finishedTasks[0]=false
                }else{
                  this.$rp.log("Task0异常，重新下载-Burn_setInterval")
                  DownloadManager.methods.del(this.$store.state.downloadDir + '\\Burn\\' + this.ventoyInfo.fileName)
                  DownloadManager.methods.del(this.$store.state.downloadDir + '\\Burn\\' + this.ventoyInfo.fileName + '.aria2')
                  this.startVentoyDownload()
                  this.finishedTasks[0] = false
                }
              }
            }
            if (this.startedTasks[1]) {
              if(!this.$store.state.ventoyInfo.needTrace && !this.finishedTasks[1]) this.$rp.log("Task1停止，totalLength="+this.$store.state.ventoyPluginInfo.task.totalLength+" completedLength="+this.$store.state.ventoyPluginInfo.task.completedLength+"-Burn_setInterval")
              this.finishedTasks[1] = !this.$store.state.ventoyPluginInfo.needTrace
              if (this.startedTasks[1] && this.finishedTasks[1] && (this.$store.state.ventoyPluginInfo.task.totalLength !== this.$store.state.ventoyPluginInfo.task.completedLength || this.$store.state.ventoyPluginInfo.task.completedLength===0)) {
                this.retryTimes[1]++
                if(this.retryTimes[1]>this.maxAllowedRetry){
                  this.$error({
                    title:"Ventoy插件下载失败",
                    content:"请联系作者解决问题"
                  })
                  this.startedTasks[1]=false
                  this.finishedTasks[1]=false
                }else{
                  this.$rp.log("Task1异常，重新下载-Burn_setInterval")
                  DownloadManager.methods.del(this.$store.state.downloadDir + '\\Burn\\' + this.ventoyInfo.pluginName)
                  DownloadManager.methods.del(this.$store.state.downloadDir + '\\Burn\\' + this.ventoyInfo.pluginName + '.aria2')
                  this.startPluginDownload()
                  this.finishedTasks[1] = false
                }
              }
            }
            if (this.startedTasks[2]) {
              if(!this.$store.state.ventoyInfo.needTrace && !this.finishedTasks[2]) this.$rp.log("Task2停止，totalLength="+this.$store.state.isoInfo.task.totalLength+" completedLength="+this.$store.state.isoInfo.task.completedLength+"-Burn_setInterval")
              this.finishedTasks[2] = !this.$store.state.isoInfo.needTrace
              if (this.startedTasks[2] && this.finishedTasks[2] && (this.$store.state.isoInfo.task.completedLength !== this.$store.state.isoInfo.task.totalLength || this.$store.state.isoInfo.task.completedLength===0)) {
                this.retryTimes[2]++
                if(this.retryTimes[2]>this.maxAllowedRetry){
                  this.$error({
                    title:"ISO镜像下载失败",
                    content:"请联系作者解决问题"
                  })
                  this.startedTasks[2]=false
                  this.finishedTasks[2]=false
                }else{
                  this.$rp.log("Task2异常，重新下载-Burn_setInterval")
                  DownloadManager.methods.del(this.$store.state.downloadDir + '\\Burn\\' + this.edgelessInfo.isoName)
                  DownloadManager.methods.del(this.$store.state.downloadDir + '\\Burn\\' + this.edgelessInfo.isoName + '.aria2')
                  this.startIsoDownload()
                  this.finishedTasks[2] = false
                }
              }
            }
          }

          //计算是否需要显示下载进度条
          if(this.stepsInfo.step === 0){
            this.showProgress = this.startedTasks[0] || this.startedTasks[1] || this.startedTasks[2]
            //this.$rp.log("计算是否需要显示下载进度条:"+this.showProgress+"-Burn_setInterval")
            //this.$rp.log("在step=0时判断是否需要翻页翻到step=1，finishedTasks0="+this.finishedTasks[0]+" finishedTasks1="+this.finishedTasks[1]+" finishedTasks2="+this.finishedTasks[2]+" ventoyInfo.finishUnzip="+this.ventoyInfo.finishUnzip+"-Burn_setInterval")
          }

          //在step=0时判断是否需要翻页翻到step=1
          if (this.stepsInfo.step === 0 && this.finishedTasks[0] && this.finishedTasks[1] && this.finishedTasks[2] && this.ventoyInfo.finishUnzip) {
            this.$rp.log("下载完成，翻页并运行Ventoy")
            this.stepsInfo.step = 1

            //运行Ventoy安装程序
            this.execVentoy()
          }
        }
        , 1000)

    //监听回复
    this.$electron.ipcRenderer.on('scanDisks-reply', (event, res) => {
      //return
      this.$rp.log("获得scanDisks的事件回复-scanDisks_reply_anonymous")
      this.$rp.log(JSON.stringify(res))
      if (res) {
        //获取主进程发送的磁盘信息，开始检查Ventoy是否就绪
        this.driveInfo = res
        this.selectedVentoyPart = ""

        for (let i = 0; i < this.driveInfo.labels.length; i++) {
          //跳过本地磁盘
          if (!this.showExecVentoyButton && this.driveInfo.removable[i] == 0) {
            this.$rp.log("跳过本地磁盘："+this.driveInfo.names[i]+"-scanDisks_reply_anonymous")
            continue
          }
          //保存找到的第一个可移动设备信息
          if(!this.firstMovableInfo&&this.driveInfo.labels[i]!=='VTOYEFI'&& this.driveInfo.removable[i] ==1) {
            this.$rp.log("保存找到的第一个可移动设备信息：盘符="+this.driveInfo.names[i]+" 卷标="+this.driveInfo.labels[i]+"-scanDisks_reply_anonymous")
            this.firstMovableInfo = {
              label: this.driveInfo.labels[i],
              name: this.driveInfo.names[i]
            }
          }
          //检查Ventoy在卷标中是否出现 &&!DownloadManager.methods.exist(this.driveInfo.names[i]+":\\Edgeless")
          if (this.driveInfo.labels[i] === "Ventoy") {
            this.$rp.log("发现Ventoy，位于"+this.driveInfo.names[i]+"-scanDisks_reply_anonymous")
            this.selectedVentoyPart = this.driveInfo.names[i]
            break
          }
        }
        if (this.selectedVentoyPart === "") {
          this.$rp.log("没有选中任何分区，第一个移动设备的信息如下-scanDisks_reply_anonymous")
          this.$rp.log(JSON.stringify(this.firstMovableInfo))
          //询问是否是第一个可移动设备
          if(this.firstMovableInfo){
            this.$rp.log("询问是否为第一个移动设备-scanDisks_reply_anonymous")
            this.showConfirm=true
          }else{
            this.$rp.log("未发现任何设备-scanDisks_reply_anonymous")
            //Ventoy盘未发现
            this.showExecVentoyButton = true
            notification.open({
              message: '错误：没有发现Ventoy启动盘',
              description: "请确保已经完成Ventoy的安装，再点击检查按钮！"
            })
          }
        } else {
          this.$rp.log("前往步骤3-scanDisks_reply_anonymous")
          this.jumpToStep3()
        }
        this.checkingVentoy = false
      } else {
        this.$rp.log("进入紧急模式-scanDisks_reply_anonymous")
        this.emergency()
      }
    })
    this.$electron.ipcRenderer.on('unzip-reply', (event, res) => {
      if(res!==this.$store.state.downloadDir + '\\Burn\\*.zip') return
      this.$rp.log("收到解压完成的回复-unzip_reply_anonymous")
      //获取文件夹名
      let tmp = this.ventoyInfo.fileName.split('-')
      this.ventoyInfo.ventoyPath = this.$store.state.downloadDir + '\\Burn\\' + tmp[0] + '-' + tmp[1]
      this.ventoyInfo.finishUnzip = true
      this.$rp.log("ventoyPath"+this.ventoyInfo.ventoyPath+"-unzip_reply_anonymous")
    })
  },
  destroyed() {
    this.$rp.log("Burn页面退出-destroyed")
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
    this.$rp.log("用户准备离开Burn-beforeRouteLeave")
    //当step=2时阻止用户切换页面
    if (this.stepsInfo.step === 2) {
      this.$rp.log("step=2,阻止用户切换页面-beforeRouteLeave")
      notification.open({
        message: '现在不能离开当前页面！',
        description: "请耐心等待部署任务完成"
      })
    } else {
      this.$rp.log("离开Burn-beforeRouteLeave")
      next()
    }
  }
}
</script>
