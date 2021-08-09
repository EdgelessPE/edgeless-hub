<template>
<div>
  <a-modal v-model="showDialog" title="Edgeless Alpha" @ok="submitToken" @cancel="$router.back()" okText="提交" cancelText="取消">
    <p>如果您不知道如何获取邀请码，我们也无可奉告，因为这说明您不是Edgeless Alpha内测计划的目标用户</p>
    <a-input placeholder="输入Edgeless Alpha内测邀请码" v-model="input"/>
  </a-modal>

  <a-steps :current="stepBarNumber">
    <a-step :key="0" title="下载Alpha版本启动文件"/>
    <a-step :key="1" title="部署Edgeless Alpha"/>
    <a-step :key="2" title="完成"/>
  </a-steps>

  <div class="steps-content" key="0" v-if="$store.state.AlphaInfo.state===0||$store.state.AlphaInfo.state===1">
    <a-result :title="$store.state.AlphaInfo.state===0?'有可用的Edgeless Alpha':'正在下载启动文件'" :subTitle="'最新版本：'+alpha_version">
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
          <a-button v-else-if="$store.state.AlphaInfo.state===0" type="primary" v-on:click="startDownload" :loading="loading">
            试用
          </a-button>
        </a-space>
      </template>
    </a-result>
  </div>
  <div class="steps-content" key="1" v-else-if="$store.state.AlphaInfo.state===2">
    <a-result title="向启动盘部署Alpha版本" subTitle="这可能需要几分钟的时间">
      <template #icon>
        <a-icon type="hourglass" />
      </template>
      <template #extra>
        <a-row>
          <a-col :span="9"/>
          <a-col :span="1">
            <a-icon type="loading" />
          </a-col>
          <a-col :span="5">
            {{waitingTip}}...
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
    </a-result>
  </div>

</div>
</template>

<script>
import {notification} from "ant-design-vue";
import DownloadManager from "@/components/DownloadManager";
export default {
name: "Alpha",
  data(){
  return{
    showDialog:true,
    input:"",
    alpha_version:"",
    alpha_name:"",
    stepBarNumber:0,
    loading:false,
    interval:"",
    startTimes:0, //任务重新开始的次数
    waitingTip:"正在复制Alpha版启动文件", //复制时的提示信息
  }
  },
  methods:{
    submitToken(){
      //校验输入
      if(!this.input.match("^[A-Za-z0-9]{4,10}$")){
        this.$message.error("无效的Alpha邀请码")
      }else {
        //发送请求获取版本号和文件名
        let url="https://pineapple.edgeless.top/api/v2/alpha/data?token="+this.input
        this.$axios.get(url)
        .then((res)=>{
          this.alpha_version=res.data.iso_version
          this.alpha_name=res.data.iso_name
          this.showDialog=false

          //更新本地alphaCode
          if(this.$store.state.alphaCode!==this.input){
            this.$store.commit("changeAlphaCode",this.input)
            DownloadManager.methods.writeConfig()
          }

          //判断在线版本是否为0.0.0
          if(this.alpha_version==="0.0.0") {
            this.$message.info("现阶段没有Alpha版本提供")
            this.$router.back()
          }

          //判断本地是否已经存在alpha版本wim
          if(DownloadManager.methods.exist(this.$store.state.pluginPath[0]+":\\"+this.alpha_name)){
            this.$message.success("您已经拥有最新版本的Alpha启动文件："+this.alpha_name)
            this.$router.back()
          }
        })
        .catch((_)=>{
          this.$message.error("错误的Alpha邀请码")
        })
      }
    },
    startDownload(){
      this.startTimes++
      if(this.startTimes>2) {
        notification.open({
          message:'下载失败次数过多，Alpha步骤被暂停',
          description:'请联系作者解决问题'
        })
        return
      }
      this.loading=true
      //发送下载任务
      let url="https://pineapple.edgeless.top/api/v2/alpha/addr?token="+this.input
      DownloadManager.methods.aria2cDownloaderDir(url, false, this.$store.state.downloadDir + '\\Burn', (res) => {
        this.$store.commit('setAlphaGid', res.data.result)
        this.$store.commit('setAlphaState',1)
      })
    },
    startCopy(){
      DownloadManager.methods.copy(this.$store.state.downloadDir + '\\Burn\\'+this.alpha_name,this.$store.state.pluginPath[0] + ':\\' +this.alpha_name,false,()=>{
        //step2完成，翻面
        this.$store.commit('setAlphaState',3)
      })
    },
    getSizeString(size) {
      if (size < 1024) return Number(size).toFixed(2) + "B"
      else if (size < 1024 * 1024) return (size / 1024).toFixed(2) + "KB"
      else if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + "MB"
      else return (size / (1024 * 1024 * 1024)).toFixed(2) + "GB"
    },
  },
  created() {
    //检查启动盘是否存在
    if(!DownloadManager.methods.exist(this.$store.state.pluginPath)){
      notification.open({
        message:'无法启动Edgeless Alpha计划',
        description:'未检测到Edgeless启动盘，请先执行写入步骤'
      })
      this.$router.push("/burning")
    }

    //拒绝旧版规范的启动盘
    if (!DownloadManager.methods.exist(this.$store.state.pluginPath[0]+":\\ventoy\\ventoy_wimboot.img")) {
      notification.open({
        message:'无法启动Edgeless Alpha计划',
        description:'不支持旧版启动盘制作工具制作的启动盘，请先重新写入'
      })
      this.$router.push("/burning")
    }

    //配置定时器
    this.interval=setInterval(()=>{
      //计算当前步骤条指向
      this.stepBarNumber=this.$store.state.AlphaInfo.state-1
      if(this.stepBarNumber<0) this.stepBarNumber=0

      //如果下载停止，检查是否出错或是完成后更新状态
      if(this.$store.state.AlphaInfo.state===1&&this.$store.state.AlphaInfo.taskStopped){
        if(this.$store.state.AlphaInfo.task.completedLength===this.$store.state.AlphaInfo.task.totalLength){
          //确实已经完成，翻页
          this.$store.commit('setAlphaState',2)
          this.startCopy()
        }else {
          //任务出错，重新开始
          DownloadManager.methods.del(this.$store.state.downloadDir + '\\Burn\\' +this.alpha_name)
          DownloadManager.methods.del(this.$store.state.downloadDir + '\\Burn\\' +this.alpha_name+'.aria2')
          this.startDownload()
        }
      }
    },1000)

    //读取保存的alphaCode
    this.input=this.$store.state.alphaCode
  },
  destroyed() {
    clearInterval(this.interval)
  },
  beforeRouteLeave(to, from, next) {
    //当step=2时阻止用户切换页面
    if (this.$store.state.AlphaInfo.state === 2) {
      notification.open({
        message: '现在不能离开当前页面！',
        description: "请耐心等待拷贝任务完成"
      })
    } else {
      next()
    }
  }
}
</script>