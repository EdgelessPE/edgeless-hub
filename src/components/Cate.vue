<template>
  <a-list :grid="{ gutter: 16, column: 4 }" :data-source="processedData">
    <a-list-item slot="renderItem" slot-scope="item, index">
      <a-card :title="item.softName">
        {{'版本号：'+item.softVer}}
        <br/>
        {{'打包者：'+item.softAuthor}}
        <br/>
        {{'大小：'+item.softSize}}
          <a-button v-on:click="addDownloadTask(item.softName,item.softUrl)" slot="actions">
            <a-icon type="cloud-download" />
            获取
          </a-button>
      </a-card>
    </a-list-item>
  </a-list>
</template>

<script>
import DownloadManager from "@/components/DownloadManager"
export default {
name: "Cate",
  data(){
    return{
      processedData:["233"]
    }
  },
  computed:{
    cateName:function (){
      return this.$route.query.name
    }
  },
  methods:{
    getCateData(){
      let ret=[]
      for(let i=0;i<this.$store.state.allData.length;i++){
        if(this.$store.state.allData[i].cateName===this.cateName) {
          ret=this.$store.state.allData[i].files
          break
        }
      }
      return ret
    },
    prepData(){
      let raw=this.getCateData()
      this.processedData=[]
      raw.forEach((item)=>{
        let info=item.name.split('_')
        this.processedData.push({
          'softName':info[0],
          'softVer':info[1],
          'softAuthor':info[2].split('.7z')[0],
          'softUrl':item.url,
          'softSize':this.getSizeString(item.size)
        })
      })
    },
    getSizeString(size){
      if(size<1024) return size.toFixed(2)+"B"
      else if(size<1024*1024) return (size/1024).toFixed(2)+"KB"
      else if(size<1024*1024*1024) return (size/(1024*1024)).toFixed(2)+"MB"
      else return (size/(1024*1024*1024)).toFixed(2)+"GB"
    },
    addDownloadTask(name,url){
      //发送添加下载事件
      this.$root.eventHub.$emit('add-download-task',{
        'name':name,
        'url':url
      })
      //console.log("event sent")
    }
  },
  watch:{
    cateName(){
      this.prepData()
    }
  },
  created() {
    this.prepData()
  }
}
</script>

<style scoped>

</style>