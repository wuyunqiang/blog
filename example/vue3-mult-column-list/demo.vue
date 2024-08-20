<script setup lang="ts">
import List from "./MultColumnList.vue";

defineOptions({
  inheritAttrs: true,
});

let list = [];
for (let i = 0; i < 100; i++) {
  list.push({ name: i });
}
</script>

<template>
  <List :list="list" :column="6">
    <template #item="{ item }">
      <div class="item">{{ item.name }}</div>
    </template>
  </List>
</template>

<style scoped>
.item {
  height: 100px;
  background: red;
  width: 90%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  color: white;
  font-size: 20px;
}
</style>
