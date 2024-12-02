<script setup lang="ts">
import DanmuView from "./index.vue";
import { ref } from "vue";

const list = ref([
  {
    content: "111111",
  },
]);
const loop = () => {
  setTimeout(() => {
    console.log("test 改变了list 数据源");
    list.value = [
      {
        content: "222222222",
      },
      {
        content: "33333333333333333333",
      },
      {
        content: "444444444",
      },
      {
        content: "bbbbbb",
      },
    ];
    loop();
  }, 5 * 1000);
};
loop();

const onItem = (data: any) => {
  console.log("test item: ", data);
};
</script>
<template>
  <div class="page">
    <div class="test-dan-mu">
      <DanmuView
        :count="8"
        :row="4"
        :row-h="30"
        :delays="[500, 3000]"
        :frames="[0.5, 1.2]"
        :list-data="list"
      >
        <template #default="{ data }">
          <div class="item" @click="onItem(data)">
            <div class="name">
              {{ data.content }}
            </div>
          </div>
        </template>
      </DanmuView>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.test-dan-mu {
  width: 300px;
  height: 120px;
  margin: 50px auto;
  background: #ba55d3;
  .item {
    padding-right: 30px;
    height: 24px;
    border-radius: 12px;
    background: linear-gradient(90deg, #fff5d4, #ffece3);
    display: flex;
    align-items: center;
  }
  .icon {
    border-radius: 50%;
    margin-left: 4px;
  }
  .name {
    margin-left: 4px;
    font-size: 11px;
    font-weight: 400;
    line-height: 12px;
    color: #222222;
  }
}
</style>
