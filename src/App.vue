<template>
  <div>
    <a-layout id="main" :style="{ height: '100%', width: '100%' }">
      <a-layout-sider
        v-model="collapsed"
        :trigger="null"
        collapsible
        :theme="theme"
        :style="{ overflow: 'auto', height: '100vh' }"
      >
        <div
          class="logo"
          :style="{
            height: '3vw',
            width: '100%',
            color: theme === 'light' ? 'black' : 'white',
          }"
          @click="
            () => {
              this.collapsed = !this.collapsed;
            }
          "
        >
          {{ collapsed ? "e" : "edgElEss" }}
        </div>
        <a-menu
          mode="inline"
          :default-selected-keys="['/']"
          :theme="theme"
          :selectedKeys="selectedKey"
        >
          <a-menu-item key="/">
            <a-icon type="home" />
            <span>首页</span>
            <router-link to="/" />
          </a-menu-item>
          <a-sub-menu key="/boot">
            <template slot="title">
              <a-icon type="usb" />
              <span>制作</span></template
            >
            <a-menu-item key="/burning">
              <a-icon type="thunderbolt" />
              <span>写入</span>
              <router-link to="/burning" />
            </a-menu-item>
            <a-menu-item key="/update">
              <a-icon type="arrow-up" />
              <span>升级</span>
              <router-link to="/update" />
            </a-menu-item>
            <a-menu-item key="/alpha">
              <a-icon type="experiment" />
              <span>内测</span>
              <router-link to="/alpha" />
            </a-menu-item>
          </a-sub-menu>
          <a-menu-item key="/config">
            <a-icon type="flag" />
            <span>配置</span>
            <router-link to="/config" />
          </a-menu-item>
          <a-sub-menu key="/cate">
            <template slot="title">
              <a-icon type="appstore" />
              <span>插件</span></template
            >
            <a-menu-item key="/reco">
              <a-icon type="trophy" />
              <span>精选插件</span>
              <router-link to="/reco" />
            </a-menu-item>
            <template v-for="cateItem in cateData">
              <a-menu-item :key="cateItem.name">
                <a-icon :type="cateItem.icon" />
                <span>{{ cateItem.name }}</span>
                <router-link :to="'/cate?name=' + cateItem.name" />
              </a-menu-item>
            </template>
          </a-sub-menu>
          <a-menu-item key="/down">
            <a-icon type="unordered-list" />
            <span
              >任务{{
                downloadingTasks === 0 ? "" : "（" + downloadingTasks + "）"
              }}</span
            >
            <router-link to="/down" />
          </a-menu-item>
          <a-menu-item key="/wiki">
            <a-icon type="book" />
            <span>文档</span>
            <router-link to="/wiki" />
          </a-menu-item>
          <a-menu-item key="/setting">
            <a-icon type="setting" />
            <span>设置</span>
            <router-link to="/setting" />
          </a-menu-item>
        </a-menu>
      </a-layout-sider>
      <a-layout>
        <a-layout-header style="background: #fff; padding: 0">
          <TopBar />
        </a-layout-header>
        <a-layout-content
          :style="{
            margin: '24px 16px',
            padding: '24px',
            background: '#fff',
            overflow: 'auto',
            height: '80vh',
          }"
        >
          <router-view />
        </a-layout-content>
      </a-layout>
    </a-layout>
    <a-modal
      v-model="visible"
      title="删除插件包"
      @ok="handleConfirmDelete"
      okText="确定"
      cancelText="取消"
    >
      {{ "您确认要将" + delConfirmData.name + "从启动盘中删除吗？" }}
    </a-modal>
    <a-drawer
      title="欢迎来到Edgeless Hub"
      placement="top"
      :visible="showWelcome"
      @close="finishWelcome"
    >
      <br />
      <p>看起来这是您首次使用Edgeless Hub，您可以在此更改一些默认配置</p>
      <small
        >使用本软件即代表您已详细阅读并同意<a v-on:click="openLicence">用户协议</a></small
      >
      <br /><br />
      <a-row>
        <a-col span="2"> Edgeless盘符 </a-col>
        <a-col span="4">
          <a-select default-value="自动" @change="changeDisk" size="small">
            <a-select-option v-for="item in edgelessDisks" :value="item" :key="item">
              {{ item + (item === "自动" ? "" : "：") }}
            </a-select-option>
          </a-select>
        </a-col>
        <a-col span="2" class="align-text"> 下载缓存目录 </a-col>
        <a-col span="8">
          <a-input v-model="userInputDownloadDir" size="small" style="width: 98%" />
        </a-col>
        <a-col span="1">
          <a-button v-on:click="chooseDir" size="small"> 选择 </a-button>
        </a-col>
      </a-row>
    </a-drawer>
  </div>
</template>

<script>
import TopBar from "@/components/TopBar";
import { notification } from "ant-design-vue";
import DownloadManager from "@/components/DownloadManager";
import StationList from "@/stationpool/main";
import dataset from "@/utils/dataset";
import DeveloperRank from "@/components/DeveloperRank";

const cp = window.require("child_process");
const fs = window.require("fs");

export default {
  data() {
    return {
      collapsed: false,
      aria2cProcess: "",
      reScanEdgeless: false,
      visible: false,
      delConfirmData: {
        trueName: "",
        name: "",
      },
      downloadingTasks: 0,
      copyBusy: false, //保存现在是否正在进行拷贝任务
      notificationSent: false, //是否发送过“请插入启动盘”通知
      showWelcome: false,
      edgelessDisks: [],
      userInputDownloadDir: "",
      ignoreFirstPlugOut: false, //忽略欢迎时设置自动检测Edgeless启动盘导致的“启动盘被弹出”提示
      fileList: [],
      iconMatch: dataset.iconMatch,
    };
  },
  methods: {
    finishWelcome() {
      //初始化用户名
      this.$store.commit("updateUserName", window.require("os").userInfo().username);
      //校验路径规范性
      //console.log(this.userInputDownloadDir.match(/(^[a-zA-Z]):\\.+/))
      if (
        this.userInputDownloadDir.match(/(^[a-zA-Z]):\\.+/) == null ||
        this.userInputDownloadDir.includes("\\\\")
      ) {
        //提示重新选择
        this.userInputDownloadDir = this.$store.state.downloadDir;
        notification.open({
          message: "缓存路径不规范",
          description: "请重新选择可用的目录或保持默认",
        });
        return;
      }
      //去除末尾反斜杠
      if (this.userInputDownloadDir[this.userInputDownloadDir.length - 1] === "\\") {
        this.userInputDownloadDir = this.userInputDownloadDir.slice(0, -1);
      }
      //检查输入目录是否存在
      if (DownloadManager.methods.exist(this.userInputDownloadDir)) {
        this.$store.commit("changeDownloadDir", this.userInputDownloadDir);
        DownloadManager.methods.writeConfig();
        this.showWelcome = false;
        this.$store.commit("finishInit", this.$root.eventHub);
      } else {
        //尝试创建下载目录
        if (DownloadManager.methods.mkdir(this.userInputDownloadDir)) {
          notification.open({
            message: "已创建下载缓存目录",
            description: this.userInputDownloadDir,
          });
          this.$store.commit("changeDownloadDir", this.userInputDownloadDir);
          DownloadManager.methods.writeConfig();
          this.showWelcome = false;
          this.$store.commit("finishInit", this.$root.eventHub);
        } else {
          //提示重新选择
          this.userInputDownloadDir = this.$store.state.downloadDir;
          notification.open({
            message: "创建下载缓存目录失败",
            description: "请重新选择可用的目录或保持默认",
          });
        }
      }
    },
    changeDisk(val) {
      if (val !== "自动") {
        this.$store.commit("setPluginPath", val);
        //console.log('set disk:'+val)
      } else {
        this.$store.commit("setPluginPath", "A");
      }
    },
    chooseDir() {
      //向主进程发送打开目录选择对话框事件
      this.$electron.ipcRenderer.send("openDirectoryDialog-request", "");
    },
    getMatchedIconName(name) {
      let res = "profile";
      for (let i = 0; i < this.iconMatch.length; i++) {
        if (this.iconMatch[i].name === name) {
          res = this.iconMatch[i].icon;
          break;
        }
      }
      return res;
    },
    refreshData(successNotification) {
      //将分类数据推至store，然后调用getPluginData()
      try {
        //初始化镜像站插件
        this.$store.state.stationObject.init(this.$axios, () => {
          //初始化完成，推送分类数据
          this.$store.state.stationObject.getCateData((cData) => {
            //分类按名称排序
            cData.sort((a, b) => {
              return a.name.localeCompare(b.name, "zh");
            });
            //console.log(cData)
            //匹配icon
            cData.forEach((item) => {
              item["icon"] = this.getMatchedIconName(item.name);
            });
            //console.log(cData)
            this.$store.commit("setCateData", cData);
            this.getPluginData(successNotification);
          });
        });
      } catch (err) {
        this.$message.error({
          content:
            "刷新镜像站索引失败，镜像站接口" +
            this.$store.state.stationObject.name +
            "错误：" +
            err.message,
          key: "updateMirror",
        });
      }

      // let url=this.$store.state.stationUrl
      // //获取分类数据
      // this.$axios.get(url+'?path=插件包')
      //     .then((res)=>{
      //   //console.log(res.data.data.fileList)
      //   this.$store.commit('setCateData',res.data.data.fileList)
      //   this.getPluginData()
      // })
      //     .catch((err)=>{
      //   notification.open({
      //     message:'获取分类信息失败',
      //     description:"服务器错误："+err.message
      //   })
      // })
    },
    getPluginData(successNotification) {
      //对于每个分类获取其插件列表
      for (let i = 0; i < this.cateData.length; i++) {
        let queryName = this.cateData[i].name;
        this.$store.state.stationObject.getPluginList(queryName, (pData) => {
          //按名称排序
          pData.sort((a, b) => {
            return a.name.localeCompare(b.name, "zh");
          });
          //追加到库
          this.$store.commit("appendAllData", {
            cateName: queryName,
            files: pData,
          });
          //如果所有数据已加载完毕，则发送数据加载完毕事件
          if (this.$store.state.allData.length === this.$store.state.cateData.length) {
            this.$root.eventHub.$emit("all-data-loaded", {});
            if (successNotification) {
              this.$message.success({
                content: "刷新镜像站索引成功：" + this.$store.state.stationObject.name,
                key: "updateMirror",
              });
            }
          }
        });
      }
    },
    getTaskInfo(gid) {
      //查找原任务位置
      let pointer = -1;
      this.$store.state.ourTasksPool.forEach((item, index) => {
        if (item.gid === gid) pointer = index;
      });
      if (pointer !== -1) {
        //返回原任务信息
        return this.$store.state.ourTasksPool[pointer];
      } else {
        console.log("gid not find");
      }
    },
    updateEdgelessDiskList(reScan) {
      if (reScan) {
        if (DownloadManager.methods.setPluginPath()) {
          this.notificationSent = false;
          notification.open({
            message: "检测到Edgeless启动盘",
            description: "盘符：" + this.$store.state.pluginPath[0],
          });
          this.$root.eventHub.$emit("disk-plugged", "");
          this.reScanEdgeless = false;
          DownloadManager.methods.getPluginList();

          //获取Edgeless完整版本号存入store
          let ver_el = "Edgeless_Beta_Ofial_Undefined_2";
          if (
            DownloadManager.methods.exist(
              this.$store.state.pluginPath[0] + ":\\Edgeless\\version.txt"
            )
          ) {
            ver_el = fs
              .readFileSync(this.$store.state.pluginPath[0] + ":\\Edgeless\\version.txt")
              .toString();
          } else {
            notification.open({
              message: "不是标准的Edgeless启动盘",
              description: "您的启动盘缺少版本标识文件，请尝试重新制作",
            });
          }
          this.$store.commit("changeEdgelessVersion", ver_el);
        } else {
          if (this.reScanEdgeless === false) {
            notification.open({
              message: "未检测到Edgeless启动盘",
              description: "请插入Edgeless启动盘以使用安装功能",
            });
            this.$store.commit(
              "changeEdgelessVersion",
              "Edgeless_Beta_Ofial_Undefined_2"
            );
            this.$root.eventHub.$emit("disk-unplugged", "");
          }
          this.reScanEdgeless = true;
        }
      } else {
        //例行扫描
        if (!DownloadManager.methods.getPluginList()) {
          this.reScanEdgeless = true;
          this.$store.commit("setFileList", []);
          if (this.ignoreFirstPlugOut) {
            this.ignoreFirstPlugOut = false;
          } else {
            this.$store.commit("setPluginPath", "A");
            notification.open({
              message: "Edgeless启动盘被拔出",
              description: "请插入Edgeless启动盘以使用安装功能",
            });
            this.$root.eventHub.$emit("disk-unplugged", "");
          }
        }
      }
    },
    handleConfirmDelete() {
      this.visible = false;
      if (DownloadManager.methods.delPlugin(this.delConfirmData.trueName)) {
        notification.open({
          message: "删除插件包成功",
          description: this.delConfirmData.trueName + "已被删除",
        });
      } else {
        notification.open({
          message: "删除插件包失败",
          description: this.delConfirmData.trueName,
        });
      }
    },
    reg() {
      cp.exec(
        'reg query "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Shell Folders" /v {374DE290-123F-4565-9164-39C4925E467B}',
        (err, stdout, stderr) => {
          //console.log(stdout)
          if (err || stderr) {
            //尝试读取另一个表项
            cp.exec(
              'reg query "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Shell Folders" /v {7D83EE9B-2244-4E70-B1F5-5393042AF1E4}',
              (err, stdout, stderr) => {
                if (err || stderr) {
                  notification.open({
                    message: "注册表读取失败",
                    description: "请手动配置下载缓存目录为本地磁盘上某个文件夹",
                  });
                  this.$store.commit("changeDownloadDir", "D:\\HubCache");
                } else {
                  //根据注册表设置默认下载路径
                  let path = stdout.split("REG_SZ")[1].replace(/(^\s*)|(\s*$)/g, "");
                  if (
                    DownloadManager.methods.exist(path) &&
                    path[0] !== "C" &&
                    path[0] !== "c"
                  ) {
                    this.$store.commit("changeDownloadDir", path + "\\HubCache");
                    //更新本组件上的userInputDownloadDir
                    this.userInputDownloadDir = this.$store.state.downloadDir;
                  } else {
                    this.$store.commit("changeDownloadDir", "D:\\HubCache");
                    //更新本组件上的userInputDownloadDir
                    this.userInputDownloadDir = this.$store.state.downloadDir;
                  }
                }
              }
            );
          } else {
            //根据注册表设置默认下载路径
            let path = stdout.split("REG_SZ")[1].replace(/(^\s*)|(\s*$)/g, "");
            //console.log(path)
            if (
              DownloadManager.methods.exist(path) &&
              path[0] !== "C" &&
              path[0] !== "c"
            ) {
              this.$store.commit("changeDownloadDir", path + "\\HubCache");
              //更新本组件上的userInputDownloadDir
              this.userInputDownloadDir = this.$store.state.downloadDir;
            } else {
              this.$store.commit("changeDownloadDir", "D:\\HubCache");
              //更新本组件上的userInputDownloadDir
              this.userInputDownloadDir = this.$store.state.downloadDir;
            }
          }
        }
      );
    },
    killAria2c() {
      cp.exec("TASKKILL /F /IM aria2c.exe /T", (err, stdout, stderr) => {
        //console.log(stdout)
      });
    },
    init() {
      //用于处理首次运行

      //忽略首次拔出提示
      this.ignoreFirstPlugOut = true;

      //配置下载目录
      this.reg();

      //展示欢迎界面
      this.showWelcome = true;
    },
    test() {
      this.$electron.ipcRenderer.send("test-event", {});
    },
    quit() {
      this.$electron.ipcRenderer.send("quit-request", {});
    },
    openLicence() {
      const { shell } = window.require("electron");
      shell.openExternal("https://wiki.edgeless.top/v2/global/contract.html");
    },
  },
  components: {
    TopBar,
  },
  computed: {
    selectedKey: function () {
      let path = this.$route.path;
      if (path === "/cate") return [this.$route.query.name];
      else return [path];
    },
    cateData: function () {
      return this.$store.state.cateData;
    },
    theme: function () {
      return this.$store.state.theme;
    },
  },
  created() {
    //获取当前版本号
    this.$store.commit(
      "updateHubVersion",
      this.$electron.ipcRenderer.sendSync("version-request", "").slice(0, 4)
    );
    //
    // //获取在线版本号
    // this.$axios.get("https://pineapple.edgeless.top/api/v2/info/hub_version")
    // .then((res)=>{
    //   //更新在线版本号
    //   this.$store.commit('updateHubOnlineVersion',res.data)
    //   //如果有更新
    //   if(this.$store.state.hub_online_version>this.$store.state.hub_local_version){
    //     //修改标题
    //     document.title='Edgeless Hub '+this.$store.state.hub_local_version+' (存在新版本'+this.$store.state.hub_online_version+')'
    //
    //   }
    // })
    //
    // //设置标题
    document.title = "Edgeless Hub " + this.$store.state.hub_local_version;

    //读取aria2c端口
    try {
      let cfg = fs.readFileSync(this.$store.state.aria2cPath + "/elhub.conf").toString();
      let mct = cfg.match(/[^#]rpc-listen-port=.*/);
      if (mct.length) {
        //console.log("has port change")
        let port = mct[0].split("=")[1];
        //console.log(port)
        this.$store.commit("changeAria2Port", port);
      }
    } catch (err) {
      let err_str = JSON.stringify(err);
      if (err_str !== "{}") {
        notification.open({
          message: "警告：无法读取aria2c端口号",
          description: err_str,
        });
      }
    }

    //初始化DownloadManager
    DownloadManager.methods.init(this.$axios, this.$store, this.$root);

    //初始化Reporter
    this.$rp.init(this.$store.state.hub_local_version);

    //检查依赖文件完整性
    if (!DownloadManager.methods.exist(this.$store.state.aria2cPath + "/aria2c.exe")) {
      this.$error({
        title: "启动依赖校验错误，请完全解压后运行本程序！",
        content: "Aria2c主程序丢失",
        onOk: this.quit,
      });
    }
    if (!DownloadManager.methods.exist(".\\core\\UltraISO\\UltraISO.exe")) {
      this.$error({
        title: "启动依赖校验错误，请完全解压后运行本程序！",
        content: "UltraISO主程序丢失",
        onOk: this.quit,
      });
    }
    // if(!DownloadManager.methods.exist(".\\core\\DiskScanner.dll")){
    //   this.$error({
    //     title: '启动依赖校验错误，请完全解压后运行本程序！',
    //     content: "DiskScanner.dll丢失",
    //     onOk:this.quit
    //   });
    // }

    //读取配置文件
    let config = DownloadManager.methods.readConfig();

    //如果config没有定义userName则读取系统用户名
    if (!config["userName"]) {
      config["userName"] = window.require("os").userInfo().username;
    }

    //如果stationIndex超过范围则归零
    if (config["stationIndex"] > StationList.length - 1) config["stationIndex"] = 0;

    //写入配置到Vuex或执行首次运行配置
    if (config.exist && config.stationIndex !== undefined) {
      this.$store.commit("updateByConfig", config);
    } else {
      this.init();
    }

    //更新镜像站对象
    this.$store.commit("updateStationObject", this.$store.state.stationIndex);

    //启动aria2c进程
    this.aria2cProcess = cp.exec(
      "aria2c.exe  --conf-path=elhub.conf",
      {
        cwd: this.$store.state.aria2cPath,
      },
      (err) => {
        notification.open({
          message: "Aria2c进程提前退出",
          description: "请尝试修改./core/elhub.conf中的监听端口：" + err.message,
        });
      }
    );
    //console.log(this.aria2cProcess)

    //更新Edgeless启动盘插件列表
    if (!this.showWelcome) this.updateEdgelessDiskList(true);

    //获取在线列表数据
    this.refreshData(false);

    //完成初始化，发送事件
    if (config.exist && config.stationIndex !== undefined)
      this.$store.commit("finishInit", this.$root.eventHub);

    //配置定时任务
    setInterval(() => {
      //等待欢迎界面结束
      if (this.showWelcome) {
        this.edgelessDisks = DownloadManager.methods.getUSBList();
        //console.log(this.edgelessDisks)
        return;
      }

      //与aria2c同步状态
      DownloadManager.methods.updateMaster();

      //更新本地的任务数
      this.downloadingTasks =
        this.$store.state.tasks[0].length +
        this.$store.state.copyWaitingPool.length +
        this.$store.state.tasks[1].length;

      //为每个元素发送同步事件
      for (let index = 0; index < 4; index++) {
        this.$store.state.tasks[index].forEach((item) => {
          this.$root.eventHub.$emit("state-update-node", {
            name: item.name,
            state: index,
            info: item.info,
            percent: (item.completedLength / item.totalLength) * 100,
          });
        });
      }
      this.$store.state.copyWaitingPool.forEach((item) => {
        this.$root.eventHub.$emit("state-update-node", {
          name: item.name,
          state: 10,
        });
      });
      this.$store.state.updateList.forEach((item) => {
        this.$root.eventHub.$emit("state-update-node", {
          name: item.name,
          version: item.softVer,
          version_nodeCheck: item.onlineVer,
          localName: item.trueName,
          state: 11,
        });
      });
      this.$store.state.fileList.forEach((item) => {
        this.$root.eventHub.$emit("state-update-node", {
          name: item.name,
          version: item.softVer,
          version_nodeCheck: item.softVer,
          localName: item.trueName,
          state: 11,
        });
      });

      //更新Edgeless启动盘的相关
      this.updateEdgelessDiskList(this.reScanEdgeless);

      //检查是否需要启动拷贝操作
      if (this.$store.state.copyWaitingPool.length > 0 && !this.copyBusy) {
        if (DownloadManager.methods.usbIn()) {
          if (!DownloadManager.methods.copyFile(this.$store.state.copyWaitingPool[0])) {
            notification.open({
              message: "有一个进程在安装时出现了错误，所有安装操作暂停",
              description: "DownloadManager.copyFile:false",
            });
          }
          this.copyBusy = true;
        } else {
          if (!this.notificationSent) {
            this.notificationSent = true;
            notification.open({
              message: "插件包已下载完成，正在等待启动盘插入",
              description: "请插入Edgeless启动盘以使用安装功能",
            });
          }
        }
      }
    }, 1000);

    //监听事件
    this.$root.eventHub.$on("");

    this.$root.eventHub.$on("add-download-task", (data) => {
      //console.log(data)
      DownloadManager.methods.taskAdd(data.url, data.name, data.trueName);
    });
    this.$root.eventHub.$on("unpause-download-task", (data) => {
      DownloadManager.methods.taskUnpause(data.gid);
    });
    this.$root.eventHub.$on("pause-download-task", (data) => {
      DownloadManager.methods.taskPause(data.gid);
    });
    this.$root.eventHub.$on("restart-download-task", (data) => {
      //读取原任务信息
      let info = this.getTaskInfo(data.gid);
      //删除原任务信息
      this.$store.commit("removeTask", data.gid);
      //重新发送下载任务
      DownloadManager.methods.taskRestart(info);
    });
    this.$root.eventHub.$on("delete-file", (data) => {
      this.delConfirmData = data;
      this.visible = true;
    });
    this.$root.eventHub.$on("disable-plugin", (data) => {
      //console.log(data.localName)
      if (DownloadManager.methods.disablePlugin(data.localName)) {
        notification.open({
          message: "禁用旧版插件包成功",
          description: data.localName,
        });
      } else {
        notification.open({
          message: "禁用旧版插件包失败",
          description: data.localName,
        });
      }
    });
    this.$root.eventHub.$on("copy-file-finish", (data) => {
      //从ourTask中移除
      this.$store.commit("removeTask", data.gid);
      //修改copyBusy状态
      this.copyBusy = false;
      //发送通知
      notification.open({
        message: data.name + "安装成功",
        description: "当前版本：" + data.version,
      });
    });
    this.$electron.ipcRenderer.on("openDirectoryDialog-reply", (event, arg) => {
      if (arg) {
        let target = arg[0];
        if (target[target.length - 1] === "\\") {
          target = target.slice(0, -1);
        }
        this.userInputDownloadDir = target + "\\HubCache";
      }
    });
    this.$root.eventHub.$on("update-mirror", () => {
      this.$store.commit("clearData", "");
      this.refreshData(true);
    });
    this.$root.eventHub.$on("all-data-loaded", () => {
      //执行开发者排序
      DeveloperRank.clear();
      this.$store.state.allData.forEach((dataNode) => {
        dataNode.files.forEach((item) => {
          let info = item.name.split("_");
          let author = info[2].split(".7z")[0];
          DeveloperRank.mention(author);
        });
      });
      DeveloperRank.finish();
    });
  },
  destroyed() {
    this.$rp.destroy();
    this.killAria2c();
  },
};
</script>
<style>
#main .trigger {
  font-size: 18px;
  line-height: 64px;
  padding: 0 24px;
  cursor: pointer;
  transition: color 0.3s;
}

#main .trigger:hover {
  color: #1890ff;
}

#main .logo {
  margin: 0 auto;
  font-size: 1.2vw;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: justify;
  font-family: earth;
}

#main .logo:hover {
  cursor: pointer;
}

@font-face {
  font-family: earth;
  src: url("common/font/earth.ttf");
}
</style>
