<template>
  <a-alert
      v-if="showNotice"
      :message="noticeData.message"
      :description="noticeData.description"
      :type="noticeData.a_type"
      :show-icon="noticeData.show_icon"
      :closeText="noticeData.close_text"
      :after-close="recordId"
  />
</template>

<script>
import DownloadManager from "@/components/DownloadManager";
export default {
  name: "Notice",
  props: ["channel","ignoreId"],
  data() {
    return {
      noticeData:
          {
            id: "",
            channel: "",
            message: "",
            description: "",
            a_type: "info",
            show_icon: true,
            close_text: ""
          },
      showNotice:false
    }
  },
  methods: {
    async fetchNotice() {
      const url = "https://pineapple.edgeless.top/api/v2/info/notice"
      let axiosRes = await this.$axios.get(url)
      //选出符合当前通道和版本的公告
      axiosRes.data.forEach((item)=>{
        if(item.channel===this.channel) {
          if(item.version==="0"||this.versionCmp(this.$store.state.hub_local_version,item.lower_than)===-1){
            this.noticeData = item
          }
        }
      })
      //console.log(this.noticeData)
      //判断是否需要显示此公告
      if(this.noticeData.id!==""&&this.noticeData.id!==this.ignoreId.toString()){
        this.showNotice=true
      }
    },
    recordId(){
      this.$store.commit("updateIgnoreId",this.noticeData.id)
      DownloadManager.methods.writeConfig()
    },
    //版本号判断函数,返回1表示x>y,-1表示x<y
    versionCmp(x, y) {
      //识别含-的版本号
      x = x.toString()
      y = y.toString()

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
    this.fetchNotice()
  }
}
</script>
