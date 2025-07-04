<template>
  <i class="svg-icon" v-html="svgRow" />
</template>
<script setup>
import svgRaws from './svg'
const props = defineProps(['name'])
const svgRow = computed(() => svgRaws?.[props.name] ?? '')
</script>
<style lang="scss" scoped>
.svg-icon {
  ::v-deep(svg) {
    width: 1em;
    height: 1em;
    fill: currentColor !important;
    vertical-align: -0.15em;
    overflow: hidden;
  }
}
</style>
