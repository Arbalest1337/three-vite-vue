<template>
  <div class="layer">
    <Header />
    <Bottom />
  </div>
</template>
<script setup>
import Header from './Header.vue'
import Bottom from './Bottom.vue'
</script>
<style lang="scss" scoped>
.layer {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  z-index:9999;
}
</style>
