<template>
  <div>
    <a-back-top/>
    <a-page-header
        :sub-title="'共'+processedData.length+'个插件包'"
        @back="() => $router.go(-1)"
    >
      <template slot="title">
        <a-icon :type="cateIcon"/>
        {{ cateName }}
      </template>
    </a-page-header>
    <a-list :grid="{ gutter: 16, column: 4 }" :data-source="processedData">
      <a-list-item slot="renderItem" slot-scope="item, index">
        <a-card>
          <template slot="title">
            <div @click="gotoDetails(item)" style="cursor:pointer">
              {{ item.softName }}
              <a-tooltip v-if="item.botTag">
                <template slot="title">
                  此插件由<a v-on:click="openWiki('https://wiki.edgeless.top/v2/develop/automake.html')">Edgeless Bot</a>自动构建
                </template>
                <a-icon type="ci" theme="twoTone" two-tone-color="#52c41a"/>
              </a-tooltip>
            </div>
          </template>
          {{ '版本号：' + item.softVer }}
          <br/>
          {{ '打包者：' + item.displayAuthor }}
          <br/>
          {{ '大小：' + item.softSize }}
          <CateButton slot="actions" :name="item.softName"
                      :fullName="item.softName+'_'+item.softVer+'_'+item.softAuthor+'.7z'" :url="item.softUrl"
                      :version_online="item.softVer" :key="item.softName"/>
        </a-card>
      </a-list-item>
    </a-list>
    <a-layout-footer style="text-align: center">
      没找到需要的插件？尝试自己
      <a-button size="small"
                v-on:click="$router.push('/wiki?location=https://wiki.edgeless.top/v2/develop/quickstart.html')">制作插件包
      </a-button>
    </a-layout-footer>
  </div>
</template>

<script>
import CateButton from "@/components/CateButton";
import dataset from "@/utils/dataset";

export default {
  name: "Cate",
  components: {CateButton},
  data() {
    return {
      processedData: ["233"],
      cateIcon: "gift",
    }
  },
  computed: {
    cateName: function () {
      return this.$route.query.name
    }
  },
  methods: {
    getCateData() {
      let ret = []
      for (let i = 0; i < this.$store.state.allData.length; i++) {
        if (this.$store.state.allData[i].cateName === this.cateName) {
          ret = this.$store.state.allData[i].files
          break
        }
      }
      return ret
    },
    getIcon() {
      for (let i = 0; i < dataset.iconMatch.length; i++) {
        let node = dataset.iconMatch[i]
        if (node.name === this.cateName) {
          this.cateIcon = node.icon
          break
        }
      }
    },
    prepData() {
      //回到顶部
      scrollTo(0, 0)
      document.getElementsByClassName("ant-layout-content").item(0).scrollTop=0

      let raw = this.getCateData()
      this.processedData = []
      raw.forEach((item) => {
        let info = item.name.split('_')
        //处理author
        let author = info[2].split('.7z')[0]
        let botTag = false
        let displayAuthor = author
        if (author.includes("（bot）")) {
          displayAuthor = author.slice(0, -5)
          botTag = true
        }

        this.processedData.push({
          softName: info[0],
          softVer: info[1],
          softUrl: item.url,
          softSize: this.getSizeString(item.size),
          softAuthor: author,
          displayAuthor,
          botTag,
        })
      })

      //获得图标
      this.getIcon()
    },
    getSizeString(size) {
      if (size < 1024) return size.toFixed(2) + "B"
      else if (size < 1024 * 1024) return (size / 1024).toFixed(2) + "KB"
      else if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + "MB"
      else return (size / (1024 * 1024 * 1024)).toFixed(2) + "GB"
    },
    gotoDetails(item) {
      this.$router.push("/details?softName=" + item.softName + "&softUrl=" + item.softUrl + "&softVer=" + item.softVer + "&softSize=" + item.softSize + "&cateName=" + this.cateName + "&softAuthor=" + item.softAuthor)
    },
    openWiki(link) {
      this.$router.push("/wiki?location=" + link)
    },
  },
  watch: {
    cateName() {
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
