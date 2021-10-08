<template>
  <div>
    <a-back-top/>
    <a-page-header
        :sub-title="'共找到'+result.length+'个结果'"
        @back="() => $router.go(-1)"
    >
      <template slot="title">
        <a-icon type="search"/>
        {{ '搜索：' + input }}
      </template>
    </a-page-header>
    <a-list :grid="{ gutter: 16, column: 4 }" :data-source="result">
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
          {{ '分类：' + item.cate }}
          <br/>
          {{ '大小：' + item.softSize }}
          <CateButton slot="actions" :name="item.softName"
                      :fullName="item.softName+'_'+item.softVer+'_'+item.softAuthor+'.7z'" :url="item.softUrl"
                      :version_online="item.softVer" :key="item.softName"/>
        </a-card>
      </a-list-item>
    </a-list>
  </div>

</template>

<script>
import CateButton from "@/components/CateButton";

export default {
  name: "Search",
  data() {
    return {
      input: '',
      result: []
    }
  },
  components: {
    CateButton
  },
  methods: {
    generateResult() {
      this.result = []
      this.$store.state.allData.forEach((cateItem) => {
        cateItem.files.forEach((jItem) => {
          if (jItem.name.toLowerCase().indexOf(this.input) !== -1) {
            let info = jItem.name.split('_')

            //处理author
            let author = info[2].split('.7z')[0]
            let botTag = false
            let displayAuthor = author
            if (author.includes("（bot）")) {
              displayAuthor = author.slice(0, -5)
              botTag = true
            }

            this.result.push({
              cate: cateItem.cateName,
              softName: info[0],
              softVer: info[1],
              softUrl: jItem.url,
              softSize: this.getSizeString(jItem.size),
              softAuthor: author,
              displayAuthor,
              botTag,
            })
          }
        })
      })
    },
    getSizeString(size) {
      if (size < 1024) return size.toFixed(2) + "B"
      else if (size < 1024 * 1024) return (size / 1024).toFixed(2) + "KB"
      else if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + "MB"
      else return (size / (1024 * 1024 * 1024)).toFixed(2) + "GB"
    },
    updateResult() {
      this.input = this.$route.query.keyword.toLowerCase()
      this.generateResult()
    },
    gotoDetails(item) {
      this.$router.push("/details?softName=" + item.softName + "&softUrl=" + item.softUrl + "&softVer=" + item.softVer + "&softSize=" + item.softSize + "&cateName=" + item.cate + "&softAuthor=" + item.softAuthor)
    },
    openWiki(link) {
      this.$router.push("/wiki?location=" + link)
    },
  },
  created() {
    this.updateResult()
  },
  watch: {
    '$route': 'updateResult'
  }
}
</script>