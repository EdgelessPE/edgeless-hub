<template>
  <div>
    <Patch/>
    <Notice channel="Hub" :ignore-id="$store.state.ignore_notice_id"/>
    <keep-alive>
      <HotUpdate/>
    </keep-alive>
    <a-page-header
        :title="text_welcome"
        :backIcon="false"
    >
    </a-page-header>
    <a-row style="width: 100%">
      <a-col :span="16">
        <a-result :title="event_selected.DisplayTitle">
          <template slot="subTitle">
            <template v-if="showTags" v-for="item in event_selected.Tags">
              <a-tag :color="item.color"
                     v-on:click="$router.push(encodeURI('/wiki?location=https://wiki.edgeless.top/v2/global/log.html#edgeless核心更新日志-当前已发布最新alpha版本-edgeless-alpha'))">
                {{ item.text }}
              </a-tag>
            </template>
            <br/>
            {{ event_selected.DisplayDescription }}
          </template>
          <template #icon>
            <a-icon :type="event_selected.DisplayIcon" theme="twoTone"/>
          </template>
          <template #extra>
            <a-button :type="event_selected.ButtonType" @click="routeTo(event_selected.ButtonRoute)">
              {{ event_selected.ButtonText }}
            </a-button>
          </template>
        </a-result>
      </a-col>
      <a-col :span="8">
        <a-card
            :title="$store.state.fileList.length+$store.state.updateList.length===0?'未安装插件':($store.state.updateList.length===0?('已安装'+$store.state.fileList.length+'个插件'):('有'+$store.state.updateList.length+'个插件可更新'))"
            :bordered="false" style="width: 300px">
          <template slot="extra">
            <a-button v-if="$store.state.updateList.length!==0" type="primary" @click="routeTo('/down')">更新</a-button>
            <a-button v-else @click="routeTo('/down')">管理</a-button>
          </template>
          <p>随便看看</p>
          <a-list :data-source="pluginRecommendList" :loading="loadingPluginRecommendList">
            <a-button slot="loadMore" type="link" icon="reload" @click="genePluginRecommendList">
              换一批
            </a-button>
            <a-list-item slot="renderItem" slot-scope="item, index">
              <a-list-item-meta
                  :title="item.pluginName+'-'+item.pluginVer"
                  :description="item.cateName"
              >
              </a-list-item-meta>
              <template slot="extra">
                <a-button size="small" @click="routeTo(`/details?softName=${item.pluginName}&softVer=${item.pluginVer}&softAuthor=${item.pluginAuthor}&cateName=${item.cateName}&softSize=${item.size}&softUrl=${item.fileInfo.url}`)">查看</a-button>
              </template>
            </a-list-item>
          </a-list>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script>
import DownloadManager from "@/components/DownloadManager";
import HotUpdate from "@/components/HotUpdate";
import Patch from "@/components/Patch";
import Notice from "@/components/Notice";

const fs = window.require('fs')
export default {
  name: "Index",
  data() {
    return {
      text_welcome: "",
      events: [
        {
          EventLevel: 1,
          EventName: "默认",
          EventFrom: "Edgeless",
          DisplayTitle: "Loading...",
          DisplayDescription: "",
          DisplayIcon: "hourglass",
          ButtonText: "Loading...",
          ButtonRoute: "/index",
          ButtonType: "default"
        }
      ],
      event_selected:
          {
            EventLevel: 1,
            EventName: "默认",
            EventFrom: "Edgeless",
            DisplayTitle: "Loading...",
            DisplayDescription: "",
            DisplayIcon: "hourglass",
            ButtonText: "Loading...",
            ButtonRoute: "/index",
            ButtonType: "default"
          },
      localVersion: "",
      onlineVersion: "",
      pluginRecommendList: [],
      loadingPluginRecommendList: true,
      showTags: false
    }
  },
  components: {
    Patch,
    HotUpdate,
    Notice
  },
  methods: {
    openQQLink() {
      this.$electron.shell.openExternal('https://home.edgeless.top/jump/qqg.html')
    },
    routeTo(name) {
      this.$router.push(name)
    },
    randomNum(minNum, maxNum) {
      maxNum--
      return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10)
    },
    getLocalVersion(stage, exp) {
      let matchResult = DownloadManager.methods.matchFiles(this.$store.state.pluginPath[0] + ":\\", "^Edgeless_" + stage + ".*" + exp + "$")
      let ver = "1.0.0"
      matchResult.forEach((item) => {
        let thisVer = item.split("_")[2].split("." + exp)[0]
        if (ver < thisVer) ver = thisVer
      })
      if (ver !== "1.0.0") return ver
      else return ""
    },
    geneWelcome() {
      //获取系统用户名
      let username = this.$store.state.userName
      //获取当前时间
      const date = new Date()
      //判断当前小时数，对应凌晨，早上，中午，下午，傍晚，晚上
      let hour = date.getHours()
      if (0 <= hour && hour < 6) {
        this.text_welcome = "🛏️夜深了，" + username + "记得早睡早起哦"
      } else if (6 <= hour && hour < 11) {
        this.text_welcome = "🌞" + username + "早上好，今天也是活力满满的一天！"
      } else if (11 <= hour && hour < 14) {
        this.text_welcome = "⏰中午啦" + username + "，稍事休息一下吧"
      } else if (14 <= hour && hour < 18) {
        this.text_welcome = "☕嘿" + username + "，又到了愉快的下午茶时光~"
      } else if (18 <= hour && hour < 24) {
        this.text_welcome = "😃美妙的夜晚就应该好好放纵自己，是吧" + username + "？"
      } else {
        this.text_welcome = "哈喽，" + username
      }
    },
    async geneEdgelessEvents() {
      this.events = []
      //判断有无启动盘
      if (DownloadManager.methods.exist(this.$store.state.pluginPath)) {
        //判断是否为新版规范
        if (DownloadManager.methods.exist(this.$store.state.pluginPath[0] + ":\\ventoy\\ventoy_wimboot.img")) {
          //判断是否需要升级
          this.localVersion = this.getLocalVersion("Beta", "wim")
          //处理仅有alpha的情况
          if (this.localVersion === "") {
            if (DownloadManager.methods.exist(this.$store.state.pluginPath[0] + ":\\Edgeless\\version.txt")) {
              this.localVersion = fs.readFileSync(this.$store.state.pluginPath[0] + ":\\Edgeless\\version.txt").toString().split("_")[3]
            } else {
              //弹出错误提示
              this.$error({
                title: '不是标准的Edgeless启动盘',
                content: '我们无法正确识别您的启动盘，请尝试重新制作',
              })
            }
          }
          // if(this.localVersion==="") this.localVersion=fs.readFileSync(this.$store.state.pluginPath[0]+":\\Edgeless\\version.txt").toString().split("_")[3]
          let res = await this.$axios.get("https://legacy.edgeless.top/api/v2/info/iso")
          this.onlineVersion = res.data.version
          if (this.versionCmp(this.onlineVersion, this.localVersion) !== 1) {
            //检查是否为alpha用户
            let matchResult = DownloadManager.methods.matchFiles(this.$store.state.pluginPath[0] + ":\\", "^Edgeless_Alpha.*wim$")
            if (matchResult.length > 0) {
              //解析Alpha版本号（选最高）
              let ver = this.getLocalVersion("Alpha", "wim")

              this.events.push({
                EventLevel: 2,
                EventName: "Alpha用户",
                EventFrom: "Edgeless",
                DisplayTitle: "您已加入Edgeless Alpha内测计划",
                DisplayDescription: "感谢您对Edgeless的认可，在试用新功能时如果遇到问题请及时反馈",
                DisplayIcon: "crown",
                ButtonText: "追踪Alpha更新",
                ButtonRoute: "/alpha",
                ButtonType: "default",
                Tags: [
                  {
                    color: "red",
                    text: "Alpha"
                  },
                  {
                    color: "blue",
                    text: ver
                  }
                ]
              })
            } else {
              //无事件的Beta用户
              this.events.push({
                EventLevel: 2,
                EventName: "Beta用户",
                EventFrom: "Edgeless",
                DisplayTitle: "您已拥有最新版本Edgeless Beta",
                DisplayDescription: "遇到了驱动问题？",
                DisplayIcon: "smile",
                ButtonText: "下载驱动插件",
                ButtonRoute: encodeURI("/cate?name=驱动管理"),
                ButtonType: "default",
                Tags: [
                  {
                    color: "green",
                    text: "Beta"
                  },
                  {
                    color: "blue",
                    text: this.localVersion
                  }
                ]
              })
            }
          } else {
            //需要更新Edgeless Beta
            this.events.push({
              EventLevel: 1,
              EventName: "Beta更新",
              EventFrom: "Edgeless",
              DisplayTitle: "有新版Edgeless可供下载",
              DisplayDescription: "当前版本：" + this.localVersion + " >> 最新版本：" + this.onlineVersion,
              DisplayIcon: "bulb",
              ButtonText: "更新Edgeless",
              ButtonRoute: "/update",
              ButtonType: "primary",
              Tags: [
                {
                  color: "green",
                  text: "Beta"
                },
                {
                  color: "grey",
                  text: this.localVersion
                }
              ]
            })
          }
        } else {
          //旧版规范，需要升级
          this.localVersion = fs.readFileSync(this.$store.state.pluginPath[0] + ":\\Edgeless\\version.txt").toString().split("_")[3]
          this.events.push({
            EventLevel: 0,
            EventName: "升级规范",
            EventFrom: "Edgeless",
            DisplayTitle: "检测到非新版规范的启动盘：" + this.localVersion,
            DisplayDescription: "Edgeless Hub不支持旧版规范启动盘的升级等功能，我们强烈建议您重新制作",
            DisplayIcon: "meh",
            ButtonText: "重新制作",
            ButtonRoute: "/burning",
            ButtonType: "primary"
          })
        }
      } else {
        //无启动盘或默认状态
        this.events.push({
          EventLevel: 0,
          EventName: "无启动盘",
          EventFrom: "Edgeless",
          DisplayTitle: "尚未检测到Edgeless",
          DisplayDescription: "插入您的Edgeless或开始制作Edgeless启动盘",
          DisplayIcon: "frown",
          ButtonText: "制作启动盘",
          ButtonRoute: "/burning",
          ButtonType: "primary"
        })
      }
      //选中一个状态更新DOM
      this.event_selected = this.events[0]
      //配置是否显示Tags
      if (this.event_selected.Tags) {
        this.showTags = true
      }
    },
    genePluginRecommendList() {
      this.loadingPluginRecommendList = true
      this.pluginRecommendList = []
      //随机选出三个分类
      for (let i = 0; i < 3; i++) {
        //选出一个分类
        let cateIndex = this.randomNum(0, this.$store.state.allData.length)
        let cateName = this.$store.state.allData[cateIndex].cateName

        //选出一个插件
        let pluginIndex = this.randomNum(0, this.$store.state.allData[cateIndex].files.length)
        let fileInfo = this.$store.state.allData[cateIndex].files[pluginIndex]

        //解析插件数据
        let spr = fileInfo.name.split("_")

        //推入数组
        this.pluginRecommendList.push({
          cateName,
          fileInfo,
          pluginName: spr[0],
          pluginVer: spr[1],
          pluginAuthor: spr[2].split(".7z")[0],
          size:this.getSizeString(fileInfo.size)
        })
      }
      this.loadingPluginRecommendList = false
    },
    getSizeString(size) {
      if (size < 1024) return size.toFixed(2) + "B"
      else if (size < 1024 * 1024) return (size / 1024).toFixed(2) + "KB"
      else if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + "MB"
      else return (size / (1024 * 1024 * 1024)).toFixed(2) + "GB"
    },
    geneMaster() {
      this.geneWelcome()
      this.geneEdgelessEvents()
      //当插件准备完成时生成推荐列表
      if (this.$store.state.allData.length !== 0 && this.$store.state.allData.length === this.$store.state.cateData.length) {
        this.genePluginRecommendList()
      } else {
        this.$root.eventHub.$on('all-data-loaded', () => {
          this.genePluginRecommendList()
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

  },
  created() {
    //监听启动盘拔出和插入事件
    this.$root.eventHub.$on('disk-unplugged', () => {
      this.geneMaster()
    })
    this.$root.eventHub.$on('disk-plugged', () => {
      this.geneMaster()
    })

    //监听配置改变
    this.$root.eventHub.$on('config-updated', () => {
      this.geneMaster()
    })

    //判断是否完成初始化，否则监听初始化完成事件
    if (this.$store.state.inited) {
      this.geneMaster()
    } else {
      this.$root.eventHub.$on('finish-init', () => {
        this.geneMaster()
      })
    }
  }
}
</script>
