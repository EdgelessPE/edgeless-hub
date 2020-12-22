<template>
  <div>
    <a-row>
      <a-col span="10">
        <small>{{name}}</small>
      </a-col>
      <a-col span="14">
        <a-progress :percent="percent" status="active" :show-info="false"/>
      </a-col>
    </a-row>
  </div>
</template>

<script>
export default {
  name: "TaskNodeNaive",
  props:['name','percent']
}
</script>