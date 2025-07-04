<template>
  <div class="home">
    <div class="wrapper" ref="threeRef" />
    <ActionLayer />
  </div>
</template>
<script setup>
import useThree from '@/hooks/useThree'
import ActionLayer from './ActionLayer.vue'
const threeRef = shallowRef(null)

const { init } = useThree({ target: threeRef })
onMounted(() => {
  init()
})
const router = useRouter()
</script>
<style lang="scss" scoped>
.home {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
