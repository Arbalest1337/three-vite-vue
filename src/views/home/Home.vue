<template>
  <div class="home">
    <div class="wrapper" ref="threeRef" />
    <Layer />
  </div>
</template>
<script setup>
import useThree from '@/hooks/useThree'
import Layer from './Layer/Layer.vue'
import PathData from '@/hooks/path.json'
import { provide } from 'vue'
const threeRef = shallowRef(null)

const {
  init,
  infoScene,
  editorScene,
  drawAreas,
  shape,
  setCards,
  cards,
  showPath,
  camera,
  controls
} = useThree({
  target: threeRef
})
onMounted(async () => {
  await init()
  handleSelectedChange(PathData.map((_item, i) => i))
  // drawAreas(areas)
})
const router = useRouter()

// 切换所选设备
const handleSelectedChange = selected => {
  setCards(
    PathData.map((item, i) => ({
      points: item,
      id: i,
      color: item[0].color
    })).filter(({ id }) => selected.includes(id))
  )
}
provide('handleSelectedChange', handleSelectedChange)

// 切换路径显示
provide('showPath', showPath)
const switchShowPath = () => {
  showPath.value = !showPath.value
  Object.values(cards).forEach(card => (card.path.visible = showPath.value))
}
provide('switchShowPath', switchShowPath)

// 视角锁定到某个点
const lookAtTarget = id => {
  const target = cards?.[id]?.point
  if (!target) return
  camera.lookAt(target.position)
  controls.value.target.copy(target.position)
}
provide('lookAtTarget', lookAtTarget)

// 清除目前路径
const clearPath = () => {
  for (const key in cards) {
    const card = cards[key]
    card.setPoints(card.points.at(-1) ? [card.points.at(-1)] : [])
  }
}
provide('clearPath', clearPath)

// 切换编辑模式
const drawing = ref(false)
const toggleMode = () => {
  drawing.value = !drawing.value
}
provide('toggleMode', toggleMode)
watch(drawing, v => {
  infoScene.visible = !v
  editorScene.visible = v
  const points = shape.points.map(p => ({
    x: p.x,
    y: p.y,
    z: p.z
  }))
  shape.setPoints([])
  drawAreas([points])
})

// areas
const areas = [
  [
    {
      x: -87.38053993243099,
      y: 0,
      z: -0.5475295966986096
    },
    {
      x: -86.77902652103302,
      y: 0,
      z: -88.49357168973178
    },
    {
      x: 88.24172490724987,
      y: 0,
      z: -87.80968625270908
    },
    {
      x: 88.75415919097891,
      y: 0,
      z: -0.858970096288374
    }
  ]
]
</script>
<style lang="scss" scoped>
.home {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
