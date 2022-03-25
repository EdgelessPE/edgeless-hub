<template>
  <a-row>
    <a-col span="1" />
    <a-col span="1">
      <a-avatar
        v-if="showBackButton"
        class="button"
        icon="arrow-left"
        style="color: #108ee9; background-color: #ffffff"
        v-on:click="$router.go(-1)"
      />
    </a-col>
    <a-col span="17" />
    <a-col span="4" v-if="!searchBarCollapsed">
      <a-input-search
        v-model="input"
        placeholder="搜索插件"
        class="search-bar"
        @search="onSearch"
      />
    </a-col>

    <a-col span="3" v-if="searchBarCollapsed" />
    <a-col
      span="1"
      v-if="searchBarCollapsed"
      @click="
        () => {
          this.searchBarCollapsed = !this.searchBarCollapsed;
        }
      "
    >
      <a-avatar
        icon="search"
        class="button"
        style="color: #108ee9; background-color: #ffffff"
      />
    </a-col>

    <a-col span="1" />
    <a-col span="1">
      <a-popover
        :title="downloadingTasks === 0 ? '无下载任务' : globalSpeed"
        placement="bottomRight"
      >
        <template slot="content">
          <TaskNodeNaive
            v-for="item in $store.state.tasks[0]"
            :name="compressString(item.name)"
            :percent="getPercent(item.completedLength, item.totalLength)"
          />
        </template>
        <a-badge
          :count="downloadingTasks"
          :number-style="{ backgroundColor: '#fff', color: '#999', boxShadow: '0 0 0 1px #d9d9d9 inset'}"
          v-on:click="gotoDown"
        >
          <a-avatar
            icon="download"
            class="button"
            style="color: #108ee9; background-color: #ffffff"
          />
        </a-badge>
      </a-popover>
    </a-col>
  </a-row>
</template>

<script>
import TaskNodeNaive from "@/components/TaskNodeNaive";

export default {
  name: "TopBar",
  components: {
    TaskNodeNaive,
  },
  methods: {
    onSearch() {
      this.searchBarCollapsed = true;
      //console.log(this.$store.state.allData)
      if (this.input !== "") {
        //window.location = '/#/search?keyword=' + this.input
        this.$router.push("/search?keyword=" + this.input);
      }
    },
    getPercent(ready, total) {
      return Number(((ready / total) * 100).toFixed(1));
    },
    getSizeString(size) {
      if (size < 1024) return Number(size).toFixed(2) + "B";
      else if (size < 1024 * 1024) return (size / 1024).toFixed(2) + "KB";
      else if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + "MB";
      else return (size / (1024 * 1024 * 1024)).toFixed(2) + "GB";
    },
    updateData() {
      //更新任务数
      this.downloadingTasks = this.$store.state.tasks[0].length;
      //更新全局速度
      if (this.downloadingTasks !== 0)
        this.globalSpeed =
          "正在下载-" +
          this.getSizeString(this.$store.state.globalData.downloadSpeed) +
          "/s";
    },
    compressString(name) {
      if (name.length > 4) return name.substring(0, 4) + "..";
      else return name;
    },
    gotoDown() {
      this.$router.push("down");
      //window.location.href='/#/down'
    },
  },
  data() {
    return {
      searchBarCollapsed: true,
      input: "",
      interval: "",
      downloadingTasks: 0,
      globalSpeed: "0B/s",
      showBackButton: false,
    };
  },
  created() {
    this.interval = setInterval(() => {
      this.updateData();
    }, 1000);

    //监听路由变化
    this.$router.afterEach((_) => {
      this.showBackButton = this.$router.history.current.name === "Wiki";
    });
  },
  destroyed() {
    clearInterval(this.interval);
  },
};
</script>

<style scoped>
.search-bar {
  width: 90%;
  height: 90%;
}

.button:hover {
  cursor: pointer;
}
</style>
