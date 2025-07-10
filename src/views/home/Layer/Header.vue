<template>
  <div class="header">
    <v-toolbar density="compact" :collapse="collapse">
      <h4 style="white-space: nowrap; padding-left: 16px">工业车间物资流转管理系统</h4>

      <template v-slot:append>
        <div v-show="!collapse" class="menu">
          <v-btn
            v-for="(item, i) in menu"
            :key="i"
            @click="item.handler?.()"
            :prepend-icon="item.icon"
            :text="item.title"
          />
        </div>
        <v-btn :icon="mdiDotsVertical" @click="collapse = !collapse"></v-btn>
      </template>
    </v-toolbar>

    <SelectCardsSheet v-model:show="show.selectCards" />
  </div>
</template>
<script setup>
import { mdiMonitorDashboard, mdiAccessPoint, mdiMapMarkerPath, mdiDotsVertical } from '@mdi/js'
import SelectCardsSheet from './SelectCardsSheet.vue'

const collapse = ref(false)
const showPath = inject('showPath')
const switchShowPath = inject('switchShowPath')
const show = reactive({
  selectCards: false
})

const menu = computed(() => [
  {
    title: '设备选择',
    icon: mdiAccessPoint,
    handler: () => {
      show.selectCards = true
    }
  },
  {
    title: `${showPath.value ? '隐藏' : '显示'}路径`,
    icon: mdiMapMarkerPath,
    handler: () => {
      switchShowPath()
    }
  },
  {
    title: '管理后台',
    icon: mdiMonitorDashboard,
    handler: () => {
      console.log('dashboard')
    }
  }
])
</script>
<style lang="scss" scoped>
.menu {
  display: flex;
  flex-wrap: nowrap;
}

::v-deep(.v-toolbar--collapse) {
  max-width: 260px !important;
}
</style>
