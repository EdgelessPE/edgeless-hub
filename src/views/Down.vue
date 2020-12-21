<template>
<a-button @click="addDownloadTask">Add</a-button>
</template>

<script>
import DownloadManager from "@/components/DownloadManager";
export default {
name: "Down",
  data(){
    return{
      socket:"",
      path:"http://localhost:6800/jsonrpc",
      downloadDir:"D:"
    }
  },
  //'params':[['http://down1.xinshuru.com/installer/win/PalmInput_Setup.exe']]
  methods:{
    addDownloadTask(){



      // this.$root.eventHub.$emit('add-download-task',{
      //   'name':'360',
      //   'cate':'安全'
      // })
      // console.log("event sent")
    }
  },
  mounted() {
    DownloadManager.methods.init(this.$axios,this.$store)
    setInterval(()=>{
      console.log(this.$store.state.tasks)
      DownloadManager.methods.updateRunningTasks()
    },1000)
  }
}
</script>