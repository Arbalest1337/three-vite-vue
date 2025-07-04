<template>
  <div class="action-layer">
    <div class="menu">
      <v-speed-dial location="left center" transition="slide-y-reverse-transition">
        <template v-slot:activator="{ props: activatorProps }">
          <v-fab v-bind="activatorProps" :icon="mdiMenu"></v-fab>
        </template>

        <v-btn
          v-for="(item, i) in menu"
          :key="i"
          @click="item.handler?.()"
          :prepend-icon="item.icon"
          >{{ item.title }}</v-btn
        >
      </v-speed-dial>
    </div>
    <SelectCardsSheet v-model:show="show.selectCards" />
  </div>
</template>
<script setup>
import { mdiChartAreaspline, mdiMenu } from '@mdi/js'
import SelectCardsSheet from './SelectCardsSheet.vue'

const show = reactive({
  selectCards: false
})

const menu = [
  {
    title: '性能监测',
    icon: mdiChartAreaspline,
    handler: () => {
      console.log('123')
    }
  },
  {
    title: '卡片选择',
    icon: mdiChartAreaspline,
    handler: () => {
      show.selectCards = true
    }
  },
  {
    title: '控制后台',
    icon: mdiChartAreaspline,
    handler: () => {
      console.log('123')
    }
  }
]
</script>
<style lang="scss" scoped>
.menu {
  position: fixed;
  right: 12px;
  top: 10px;
}
</style>
