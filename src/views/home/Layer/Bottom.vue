<template>
  <div class="bottom">
    <v-tooltip text="编辑区域">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" density="comfortable" :icon="mdiDraw" @click="toggleMode"></v-btn>
      </template>
    </v-tooltip>

    <v-tooltip text="清除路径">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          density="comfortable"
          :icon="mdiSourceBranchRefresh"
          @click="onClearPath"
        ></v-btn>
      </template>
    </v-tooltip>

    <v-tooltip text="全屏">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          density="comfortable"
          :icon="mdiFullscreen"
          @click="toggleFullScreen"
        ></v-btn>
      </template>
    </v-tooltip>
  </div>
</template>
<script setup>
import { mdiFullscreen, mdiSourceBranchRefresh, mdiDraw } from '@mdi/js'

const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else if (document.exitFullscreen) {
    document.exitFullscreen()
  }
}

const clearPath = inject('clearPath')
const onClearPath = () => {
  clearPath()
}

const toggleMode = inject('toggleMode')
</script>
<style lang="scss" scoped>
.bottom {
  position: fixed;
  flex-direction: column;
  align-items: center;
  bottom: 24px;
  right: 8px;
  display: flex;
  gap: 16px;
}
</style>
