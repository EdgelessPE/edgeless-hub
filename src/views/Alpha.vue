<template>
  <div>
    <a-modal v-model="showDialog" title="Edgeless Alpha" @ok="submitToken" @cancel="$router.back()" okText="提交"
             cancelText="取消">
      <p>如果您不知道如何获取邀请码，我们也无可奉告，因为这说明您不是Edgeless Alpha内测计划的目标用户</p>
      <a-input placeholder="输入Edgeless Alpha内测邀请码" v-model="input"/>
    </a-modal>

    <a-steps :current="stepBarNumber">
      <a-step :key="0" title="下载Alpha版本启动文件"/>
      <a-step :key="1" title="部署Edgeless Alpha"/>
      <a-step :key="2" title="完成"/>
    </a-steps>

    <div class="steps-content" key="0" v-if="$store.state.AlphaInfo.state===0||$store.state.AlphaInfo.state===1">
      <a-result :title="$store.state.AlphaInfo.state===0?'有可用的Edgeless Alpha':'正在下载启动文件'"
                :subTitle="'最新版本：'+alpha_version">
        <template #icon>
          <a-icon type="cloud-download"/>
        </template>
        <template #extra>
          <a-space direction="vertical" style="width: 100%">
            <div v-if="$store.state.AlphaInfo.state===1">
              <a-row>
                <a-col :span="8">
                  {{ alpha_name }}
                </a-col>
                <a-col :span="12">
                  <a-progress
                      :percent="Number((($store.state.AlphaInfo.task.completedLength*100)/$store.state.AlphaInfo.task.totalLength).toFixed(1))"
                      status="active"/>
                </a-col>
                <a-col :span="4">
                  {{ getSizeString($store.state.AlphaInfo.task.downloadSpeed) + "/s" }}
                </a-col>
              </a-row>
            </div>
            <a-space v-else-if="$store.state.AlphaInfo.state===0">
              <a-button type="primary" v-on:click="startDownload" :loading="loading">
                试用
              </a-button>
              <a-button slot="extra" v-on:click="openLog">查看日志</a-button>
            </a-space>
          </a-space>
        </template>
      </a-result>
    </div>
    <div class="steps-content" key="1" v-else-if="$store.state.AlphaInfo.state===2">
      <a-result title="向启动盘部署Alpha版本" subTitle="这可能需要几分钟的时间">
        <template #icon>
          <a-icon type="hourglass"/>
        </template>
        <template #extra>
          <a-row>
            <a-col :span="9"/>
            <a-col :span="1">
              <a-icon type="loading"/>
            </a-col>
            <a-col :span="5">
              {{ waitingTip }}...
            </a-col>
          </a-row>
        </template>
      </a-result>
    </div>
    <div class="steps-content" key="2" v-else-if="$store.state.AlphaInfo.state===3">
      <a-result
          status="success"
          title="Alpha版本的Edgeless已部署到您的启动盘！"
          :sub-title="'重启选择'+this.alpha_name+'即可试用'"
      >
        <a-button slot="extra" v-on:click="openLog">查看日志</a-button>
      </a-result>
    </div>

  </div>
</template>

<script>
import {notification} from "ant-design-vue";
import DownloadManager from "@/components/DownloadManager";

let openExternal, openUrl
export default {
  name: "Alpha",
  data() {
    return {
      showDialog: true,
      input: "",
      alpha_version: "",
      alpha_name: "",
      stepBarNumber: 0,
      loading: false,
      interval: "",
      startTimes: 0, //任务重新开始的次数
      waitingTip: "正在复制Alpha版启动文件", //复制时的提示信息
      updateEdgelessFolder: false, //是否需要更新Edgeless文件夹
      pack_info: {
        name: '',
        url: ''
      },
      local_alpha_version: '', //用户Alpha版本号
    }
  },
  methods: {
    submitToken() {
      //校验输入
      if (this.input.length>10||this.input.length<4) {
        this.$message.error("无效的Alpha邀请码")
      } else {
        //发送请求获取版本号和文件名
        let url = "https://legacy.edgeless.top/api/v2/alpha/data?token=" + this.input
        this.$axios.get(url)
            .then((res) => {
              this.alpha_version = res.data.iso_version
              this.alpha_name = res.data.iso_name
              this.showDialog = false

              //更新本地alphaCode
              if (this.$store.state.alphaCode !== this.input) {
                this.$store.commit("changeAlphaCode", this.input)
                DownloadManager.methods.writeConfig()
              }

              //判断在线版本是否为0.0.0
              if (this.alpha_version === "0.0.0") {
                this.$message.info("现阶段没有Alpha版本提供")
                this.$router.back()
              }

              //判断本地是否已经存在alpha版本wim
              if (DownloadManager.methods.exist(this.$store.state.pluginPath[0] + ":\\" + this.alpha_name)) {
                this.$message.success("您已经拥有最新版本的Alpha启动文件：" + this.alpha_name)
                this.$router.back()
              }

              //判断是否需要更新Edgeless文件夹
              this.local_alpha_version = this.getLocalVersion("Alpha", "wim")
              if (this.versionCmp(this.local_alpha_version, res.data.pack_require) === -1) {
                this.updateEdgelessFolder = true
                this.pack_info = {
                  name: res.data.pack_name,
                  url: res.data.pack_url
                }
                openUrl = res.data.pack_url
              }
            })
            .catch((_) => {
              this.$message.error("错误的Alpha邀请码")
            })
      }
    },
    //版本号判断函数,返回1表示x>y,-1表示x<y
    versionCmp(x, y) {
      //识别含-的版本号
      x = x.replaceAll("-", ".")
      y = y.replaceAll("-", ".")

      let split_x = x.split(".")
      let split_y = y.split(".")
      let result = 0
      let i
      for (i = 0; i < Math.min(split_x.length, split_y.length); i++) {
        if (Number(split_x[i]) < Number(split_y[i])) {
          result = -1
          break
        } else if (Number(split_x[i]) > Number(split_y[i])) {
          result = 1
          break
        }
      }
      //当长度不相等时向后搜索长位是否全0
      if (result === 0 && split_x.length !== split_y.length) {
        if (split_x.length > split_x.length) {
          //处理x
          for (; i < split_x.length; i++) {
            if (Number(split_x[i]) !== 0) {
              result = 1
              break
            }
          }
        } else {
          //处理y
          for (; i < split_y.length; i++) {
            if (Number(split_y[i]) !== 0) {
              result = -1
              break
            }
          }
        }
      }
      return result
    },
    getLocalVersion(stage, exp) {
      let matchResult = DownloadManager.methods.matchFiles(this.$store.state.pluginPath[0] + ":\\", "^Edgeless_" + stage + ".*" + exp + "$")
      let ver = "0.0.0"
      matchResult.forEach((item) => {
        let thisVer = item.split("_")[2].split("." + exp)[0]
        if (ver < thisVer) ver = thisVer
      })
      return ver
    },
    startDownload() {
      this.startTimes++
      if (this.startTimes > 2) {
        this.$message.error("下载失败次数过多，Alpha步骤被暂停\n请联系作者解决问题")
        return
      }
      this.loading = true
      //发送下载任务
      let url = "https://legacy.edgeless.top/api/v2/alpha/addr?token=" + this.input
      DownloadManager.methods.aria2cDownloaderDir(url, false, this.$store.state.downloadDir + '\\Burn', (res) => {
        this.$store.commit('setAlphaGid', res.data.result)
        this.$store.commit('setAlphaState', 1)
      })
    },
    startCopy() {
      DownloadManager.methods.copy(this.$store.state.downloadDir + '\\Burn\\' + this.alpha_name, this.$store.state.pluginPath[0] + ':\\' + this.alpha_name, false, () => {
        //step2完成，翻面
        this.$store.commit('setAlphaState', 3)

        //判断是否弹出提示，提醒下载Edgeless.7z更新包
        if (this.updateEdgelessFolder) {
          this.$info({
            title: '还差最后一步！',
            content: '此次更新还额外包含了一些组件，需要您手动下载后解压并覆盖到U盘中\n(为了确保可能存在的用户自定义组件不被覆盖，此操作需要您手动完成)',
            onOk() {
              openExternal(openUrl)
            },
            keyboard: false,
          });
        }
      })
    },
    getSizeString(size) {
      if (size < 1024) return Number(size).toFixed(2) + "B"
      else if (size < 1024 * 1024) return (size / 1024).toFixed(2) + "KB"
      else if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + "MB"
      else return (size / (1024 * 1024 * 1024)).toFixed(2) + "GB"
    },
    openLog() {
      this.$router.push(encodeURI('/wiki?location=https://wiki.edgeless.top/v2/global/log.html#edgeless核心更新日志-当前已发布最新alpha版本-edgeless-alpha'))
    }
  },
  created() {
    //初始化
    openExternal = this.$electron.shell.openExternal

    //检查启动盘是否存在
    if (!DownloadManager.methods.exist(this.$store.state.pluginPath)) {
      notification.open({
        message: '无法启动Edgeless Alpha计划',
        description: '未检测到Edgeless启动盘，请先执行写入步骤'
      })
      this.$router.push("/burning")
      return
    }

    //拒绝旧版规范的启动盘
    if (!DownloadManager.methods.exist(this.$store.state.pluginPath[0] + ":\\ventoy\\ventoy_wimboot.img")) {
      notification.open({
        message: '无法启动Edgeless Alpha计划',
        description: '不支持旧版启动盘制作工具制作的启动盘，请先重新写入'
      })
      this.$router.push("/burning")
      return
    }

    //配置定时器
    this.interval = setInterval(() => {
      //计算当前步骤条指向
      this.stepBarNumber = this.$store.state.AlphaInfo.state - 1
      if (this.stepBarNumber < 0) this.stepBarNumber = 0

      //如果下载停止，检查是否出错或是完成后更新状态
      if (this.$store.state.AlphaInfo.state === 1 && this.$store.state.AlphaInfo.taskStopped) {
        if (this.$store.state.AlphaInfo.task.completedLength === this.$store.state.AlphaInfo.task.totalLength) {
          //确实已经完成，翻页
          this.$store.commit('setAlphaState', 2)
          this.startCopy()
        } else {
          //任务出错，重新开始
          DownloadManager.methods.del(this.$store.state.downloadDir + '\\Burn\\' + this.alpha_name)
          DownloadManager.methods.del(this.$store.state.downloadDir + '\\Burn\\' + this.alpha_name + '.aria2')
          this.startDownload()
        }
      }
    }, 1000)

    //读取保存的alphaCode
    this.input = this.$store.state.alphaCode
  },
  destroyed() {
    clearInterval(this.interval)
  },
  beforeRouteLeave(to, from, next) {
    //阻止用户切换页面
    if (this.$store.state.AlphaInfo.state !== 0 && this.$store.state.AlphaInfo.state !== 3) {
      this.$message.error("现在不能离开当前页面，请耐心等待拷贝任务完成")
    } else {
      next()
    }
  }
}
</script>
