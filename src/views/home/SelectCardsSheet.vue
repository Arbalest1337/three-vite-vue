<template>
  <div class="container" :class="{ show }">
    <v-sheet class="content" :elevation="6" :height="`100%`" :width="`100%`" border rounded>
      <v-btn class="close" :icon="mdiClose" @click="show = false" />
      <v-btn v-for="item in 10" @click="onSelect?.(item)">{{ item }}</v-btn>
    </v-sheet>
  </div>
</template>
<script setup>
import { mdiClose } from '@mdi/js'
const show = defineModel('show', { default: false })
const onSelectCards = inject('onSelectCards')
</script>
<style lang="scss" scoped>
.container {
  position: fixed;
  right: 0;
  width: 480px;
  bottom: 20px;
  top: 80px;
  z-index: 1;
  transform: translateX(100%);
  transition: all 0.3s ease-in-out;
  &.show {
    transform: translateX(0);
  }
  .content {
    overflow: hidden;
    position: relative;
    padding: 80px 12px 12px;
  }
  .close {
    position: absolute;
    right: 0;
    top: 0;
  }
}
</style>
