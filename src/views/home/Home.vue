<template>
  <div class="home">
    <button class="btn" @click="() => router.push('/dashboard')">go dashboard</button>
    <div class="wrapper" ref="threeRef" />
  </div>
</template>
<script setup>
import useThree from '@/hooks/useThree'
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
}
.btn {
  position: absolute;
  top: 8px;
  left: 8px;
}
</style>
