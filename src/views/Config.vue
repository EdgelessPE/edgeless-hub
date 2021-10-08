<template>
  <div>
    <a-page-header
        title="配置中心"
        @back="() => $router.go(-1)"
    />
    <a-card title="壁纸" style="width: 100%">
      <a-space>
        <a-button @click="ViewWP">查看</a-button>
        <a-button @click="ChangeWP">更换</a-button>
      </a-space>
    </a-card>
    <br/>
    <a-card title="浏览器主页" style="width: 100%" v-if="versionCmp(currentVersion,'4.0.2')===1">
      <a-tooltip slot="extra" placement="topRight">
        <a-icon type="exclamation-circle"/>
        <template slot="title">
          <small>支持自带IE浏览器和官方提供的浏览器插件，桌面和任务栏的主页均会被更改</small>
        </template>
      </a-tooltip>
      <a-input-search
          placeholder="https://"
          :disabled="disableHomePage"
          enter-button="确认"
          v-model="homePage"
          @search="writeHomePage(homePage)"
      >
        <template slot="suffix">
          <a-checkbox @change="onDisableHomePage" :checked="disableHomePage">
            禁用
          </a-checkbox>
        </template>
      </a-input-search>
    </a-card>
    <br/>
    <a-card title="分辨率" style="width: 100%">
      <a-tooltip slot="extra" placement="topRight">
        <a-icon type="exclamation-circle"/>
        <template slot="title">
          <small>仅适用于Legacy引导下的启动盘，UEFI引导时请在启动菜单选择分辨率</small>
        </template>
      </a-tooltip>
      <a-radio-group v-model="ResolutionWay" @change="onChangeRadio">
        <a-radio-button value="0">
          自动调节（默认）
        </a-radio-button>
        <a-radio-button value="1">
          不调节
        </a-radio-button>
        <a-radio-button value="2">
          自定义调节
        </a-radio-button>
      </a-radio-group>
      <template v-if="ResolutionWay==='1'">
        <br/><br/>
        <a-alert message="选择此项可以解决显示器提示超出显示范围/输出参数不支持的问题" type="info" show-icon/>
      </template>
      <template v-if="ResolutionWay==='2'">
        <br/><br/>
        <a-row>
          <a-col :span="2">
            显示分辨率
          </a-col>
          <a-col :span="4">
            <a-select style="width: 100%" size="small" v-model="resolution_index" @change="onChangeSelect">
              <template v-for="(item,index) in ResolutionList">
                <a-select-option :value="index">
                  {{ item.h + ' x ' + item.w }}
                </a-select-option>
              </template>
            </a-select>
          </a-col>
          <a-col :span="1"/>
          <a-col :span="1">
            色位
          </a-col>
          <a-col :span="3">
            <a-select style="width: 100%" size="small" v-model="ResolutionConfig.bit">
              <a-select-option :value="32">
                32bit (推荐)
              </a-select-option>
              <a-select-option :value="16">
                16bit
              </a-select-option>
            </a-select>
          </a-col>
          <a-col :span="1"/>
          <a-col :span="2">
            刷新率
          </a-col>
          <a-col :span="2">
            <a-select style="width: 100%" size="small" v-model="ResolutionConfig.fps">
              <a-select-option :value="60">
                60 FPS
              </a-select-option>
              <a-select-option :value="30">
                30 FPS
              </a-select-option>
            </a-select>
          </a-col>

          <a-col :span="6"/>
          <a-col :span="2">
            <a-button size="small" type="primary" v-on:click="writeResolutionConfig">应用</a-button>
          </a-col>
        </a-row>
      </template>
    </a-card>
    <br/>
    <a-card title="偏好调整" style="width: 100%">
      <a-tooltip slot="extra" placement="topRight">
        <a-space>
          当前参考版本：{{ currentVersion }}
          <a-icon type="exclamation-circle"/>
        </a-space>
        <template slot="title">
          <small>如果您的启动盘内拥有多个Edgeless启动文件，则会取最大的版本号作为当前参考版本提供配置选项</small>
        </template>
      </a-tooltip>
      <a-list
          item-layout="horizontal"
          :data-source="Options"
      >
        <a-list-item slot="renderItem" slot-scope="item, index">
          <a-switch slot="actions" v-model="item.state" :disabled="!item.available" @change="onChangeSwitch(item)"/>
          <a-list-item-meta
              :description="item.description"
          >
            <div slot="title">{{ item.title }}</div>
          </a-list-item-meta>
          <a-tooltip v-if="item.showTip||!item.available">
            <a-icon type="question-circle"/>
            <template slot="title">
              <template v-if="!item.available">
                <template v-if="currentVersion<item.higherThan">
                  需要高于{{ item.higherThan }}版本可用
                </template>
                <template v-else>
                  需要低于{{ item.lowerThan }}版本可用
                </template>
                <br/>
              </template>
              {{ item.information }}
            </template>
          </a-tooltip>
        </a-list-item>
      </a-list>
    </a-card>
  </div>
</template>

<script>
import ConfigInterface from "@/interface/ConfigInterface"
import DownloadManager from "@/components/DownloadManager";
import {notification} from "ant-design-vue";

const fs = window.require('fs')
export default {
  name: "Config",
  data() {
    return {
      Options: [],
      //这个列表的h和w写反了，之后会处理一下
      ResolutionList: [
        {
          h: 1920,
          w: 1080
        },
        {
          h: 1680,
          w: 1050
        },
        {
          h: 1600,
          w: 900
        },
        {
          h: 1440,
          w: 900
        },
        {
          h: 1400,
          w: 1050
        },
        {
          h: 1366,
          w: 768
        },
        {
          h: 1360,
          w: 768
        },
        {
          h: 1280,
          w: 1024
        },
        {
          h: 1280,
          w: 960
        },
        {
          h: 1280,
          w: 800
        },
        {
          h: 1280,
          w: 768
        },
        {
          h: 1280,
          w: 720
        },
        {
          h: 1280,
          w: 600
        },
        {
          h: 1152,
          w: 864
        },
        {
          h: 1024,
          w: 768
        },
        {
          h: 800,
          w: 600
        }
      ],
      ResolutionWay: "0",
      ResolutionConfig: {
        h: 1920,
        w: 1080,
        bit: 32,
        fps: 60
      },
      resolution_index: 0,
      currentVersion: "",
      homePage: "https://www.baidu.com",
      disableHomePage: false,
    }
  },
  methods: {
    prepareData() {
      //获取当前的Edgeless版本号
      let version_alpha = this.getLocalVersion("Alpha", "wim")
      let version_beta = this.getLocalVersion("Beta", "wim")
      let version = version_alpha > version_beta ? version_alpha : version_beta
      this.currentVersion = version
      //处理是否显示information小问号，分离可用和不可用的选项
      let ava = [], una = []
      ConfigInterface.forEach((item) => {
        item['state'] = this.currentState(item.folderName)
        if (item.information === "") {
          item['showTip'] = false
        } else {
          item['showTip'] = true
        }
        if (!item.hasOwnProperty('lowerThan')) item.lowerThan = '999999'
        if (this.versionCmp(version, item.higherThan) === 1 && this.versionCmp(version, item.lowerThan) === -1) {
          item['available'] = true
          ava.push(item)
        } else {
          item['available'] = false
          una.push(item)
        }
        this.Options = ava.concat(una)
      })
    },
    currentState(folderName) {
      return DownloadManager.methods.exist(this.$store.state.pluginPath[0] + ":\\Edgeless\\Config\\" + folderName)
    },

    onChangeSwitch(item) {
      DownloadManager.methods.mkdir(this.$store.state.pluginPath[0] + ":\\Edgeless\\Config")
      if (this.currentState(item.folderName)) {
        if (!DownloadManager.methods.delDir(this.$store.state.pluginPath[0] + ":\\Edgeless\\Config\\" + item.folderName)) {
          notification.open({
            message: '应用配置失败',
            description: '无法删除标记：' + (this.$store.state.pluginPath[0] + ":\\Edgeless\\Config\\" + item.folderName)
          })
          item.state = true
        } else {
          item.state = false
        }
      } else {
        if (!DownloadManager.methods.mkdir(this.$store.state.pluginPath[0] + ":\\Edgeless\\Config\\" + item.folderName)) {
          notification.open({
            message: '应用配置失败',
            description: '无法创建标记：' + (this.$store.state.pluginPath[0] + ":\\Edgeless\\Config\\" + item.folderName)
          })
          item.state = false
        } else {
          item.state = true
        }
      }
    },
    onChangeRadio() {
      switch (this.ResolutionWay) {
        case "1":
          DownloadManager.methods.mkdir(this.$store.state.pluginPath[0] + ":\\Edgeless\\Config")
          fs.writeFileSync(this.$store.state.pluginPath[0] + ":\\Edgeless\\Config\\分辨率.txt", "DisableAutoSuit")
          break
        default:
          DownloadManager.methods.del(this.$store.state.pluginPath[0] + ":\\Edgeless\\Config\\分辨率.txt")
          break
      }
    },
    onChangeSelect() {
      let val = this.ResolutionList[this.resolution_index]
      this.ResolutionConfig.h = val.w
      this.ResolutionConfig.w = val.h
    },
    writeResolutionConfig() {
      //w1024 h768 b32 f60
      DownloadManager.methods.mkdir(this.$store.state.pluginPath[0] + ":\\Edgeless\\Config")
      fs.writeFileSync(this.$store.state.pluginPath[0] + ":\\Edgeless\\Config\\分辨率.txt", "w" + this.ResolutionConfig.w + " h" + this.ResolutionConfig.h + " b" + this.ResolutionConfig.bit + " f" + this.ResolutionConfig.fps)
      notification.open({
        message: '自定义分辨率应用成功',
        description: "写入配置：" + "w" + this.ResolutionConfig.w + " h" + this.ResolutionConfig.h + " b" + this.ResolutionConfig.bit + " f" + this.ResolutionConfig.fps
      })
    },
    ViewWP() {
      this.$electron.shell.openPath(this.$store.state.pluginPath[0] + ":\\Edgeless\\wp.jpg")
    },
    ChangeWP() {
      //注册响应监听
      this.$electron.ipcRenderer.on('openFileDialog-reply', (event, arg) => {
        if (arg) {
          //判断套娃更换
          if (arg[0] === (this.$store.state.pluginPath[0] + ":\\Edgeless\\wp.jpg")) {
            notification.open({
              message: '壁纸更换失败',
              description: "搁这套娃呢？"
            })
            return
          }
          //备份原壁纸
          //DownloadManager.methods.del(this.$store.state.pluginPath[0]+":\\Edgeless\\wp_bak.jpg")
          DownloadManager.methods.ren(this.$store.state.pluginPath[0] + ":\\Edgeless\\wp.jpg", this.$store.state.pluginPath[0] + ":\\Edgeless\\wp_bak.jpg")
          DownloadManager.methods.copy(arg[0], this.$store.state.pluginPath[0] + ":\\Edgeless\\wp.jpg", false, () => {
            notification.open({
              message: '壁纸更换完毕',
              description: "原壁纸已备份为wp_bak.jpg"
            })
          })
        } else {
          notification.open({
            message: '壁纸更换失败',
            description: "没有选中文件"
          })
        }
      })
      //发送打开对话框事件
      this.$electron.ipcRenderer.send('openFileDialog-request', "")
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
    writeHomePage(text) {
      DownloadManager.methods.mkdir(this.$store.state.pluginPath[0] + ":\\Edgeless\\Config")
      if (text !== "Disable") {
        //自动添加http://
        if (text.slice(0, 4) !== "http") {
          text = "http://" + text
          this.homePage = text
        }
        //校验域名
        if (!this.isURL(text)) {
          notification.open({
            message: '域名不规范',
            description: '请检查后重试'
          })
          return
        }
      }
      fs.writeFile(this.$store.state.pluginPath[0] + ":\\Edgeless\\Config\\HomePage.txt", text, (res) => {
        //console.log(res)
        if (!DownloadManager.methods.exist(this.$store.state.pluginPath[0] + ":\\Edgeless\\Config\\HomePage.txt")) {
          notification.open({
            message: '写入主页失败',
            description: '无法创建文件：' + (this.$store.state.pluginPath[0] + ":\\Edgeless\\Config\\HomePage.txt")
          })
        } else {
          notification.open({
            message: '写入主页成功',
            description: '当前主页：' + (text === "Disable" ? "禁用" : text)
          })
        }
      })
    },
    readHomePage() {
      if (DownloadManager.methods.exist(this.$store.state.pluginPath[0] + ":\\Edgeless\\Config\\HomePage.txt")) {
        let text = fs.readFileSync(this.$store.state.pluginPath[0] + ":\\Edgeless\\Config\\HomePage.txt").toString()
        if (text === "Disable") {
          this.disableHomePage = true
          this.homePage = ""
        } else {
          this.homePage = text
        }
      }
    },
    onDisableHomePage(e) {
      let val = e.target.checked
      this.disableHomePage = val
      if (val) {
        this.writeHomePage("Disable")
      }
    },
    isURL(str_url) {
      let strRegex = "^((https|http|ftp|rtsp|mms)?://)"
          + "?(([0-9a-z_!~*'().&=+$%-]+: )?[0-9a-z_!~*'().&=+$%-]+@)?" // ftp的user@
          + "(([0-9]{1,3}\.){3}[0-9]{1,3}" // IP形式的URL- 199.194.52.184
          + "|" // 允许IP和DOMAIN（域名）
          + "([0-9a-z_!~*'()-]+\.)*" // 域名- www.
          + "([0-9a-z][0-9a-z-]{0,61})?[0-9a-z]\." // 二级域名
          + "[a-z]{2,6})" // first level domain- .com or .museum
          + "(:[0-9]{1,4})?" // 端口- :80
          + "((/?)|" // a slash isn't required if there is no file name
          + "(/[0-9a-z_!~*'().;?:@&=+$,%#-]+)+/?)$";
      let re = new RegExp(strRegex);
      return re.test(str_url);
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
  },
  created() {
    //检查启动盘是否存在
    if (!DownloadManager.methods.exist(this.$store.state.pluginPath)) {
      notification.open({
        message: '无法执行配置',
        description: '未检测到Edgeless启动盘，请先执行写入步骤'
      })
      this.$router.push("/burning")
    }
    //准备偏好调整的数据
    this.prepareData()
    //判断当前分辨率的模式
    if (DownloadManager.methods.exist(this.$store.state.pluginPath[0] + ":\\Edgeless\\Config\\分辨率.txt")) {
      if (fs.readFileSync(this.$store.state.pluginPath[0] + ":\\Edgeless\\Config\\分辨率.txt").toString() === "DisableAutoSuit") {
        this.ResolutionWay = "1"
      } else {
        this.ResolutionWay = "2"
      }
    } else {
      this.ResolutionWay = "0"
    }
    //读取主页
    this.readHomePage()
  }
}
</script>