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
      //选出当前通道的公告
      axiosRes.data.forEach((item)=>{
        if(item.channel===this.channel) {
          this.noticeData = item
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
    }
  },
  created() {
    this.fetchNotice()
  }
}
</script>