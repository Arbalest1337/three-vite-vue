<template>
  <div ref="container" class="container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'

const container = ref(null)
let renderer, scene, camera, animationId, clock
let selectableMesh, rippleGroup

// 示例坐标
const pointPos = new THREE.Vector3(0, 0, 0)

onMounted(() => {
  initThree()
  createSelectablePoint(pointPos)
  createRippleGroup()
  clock = new THREE.Clock()
  animate()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  renderer.dispose()
  selectableMesh.geometry.dispose()
  selectableMesh.material.dispose()
  rippleGroup.children.forEach(mesh => {
    mesh.geometry.dispose()
    mesh.material.dispose()
  })
})

function initThree() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000)

  camera = new THREE.PerspectiveCamera(
    60,
    container.value.clientWidth / container.value.clientHeight,
    0.1,
    1000
  )
  camera.position.set(0, 0, 2)
  camera.lookAt(0, 0, 0)

  scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const dirLight = new THREE.DirectionalLight(0xffffff, 1)
  dirLight.position.set(5, 10, 7)
  scene.add(dirLight)

  window.addEventListener('resize', onResize)
  container.value.addEventListener('click', onClick)
}

function onResize() {
  camera.aspect = container.value.clientWidth / container.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
}

// 创建可选中点
function createSelectablePoint(position) {
  const geometry = new THREE.SphereGeometry(0.2, 32, 32)
  const material = new THREE.MeshStandardMaterial({ color: 0x00ffff })
  selectableMesh = new THREE.Mesh(geometry, material)
  selectableMesh.position.copy(position)
  scene.add(selectableMesh)
}

// 波纹组
function createRippleGroup() {
  rippleGroup = new THREE.Group()
  scene.add(rippleGroup)
}

// 点击检测
function onClick(event) {
  const rect = renderer.domElement.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  const mouse = new THREE.Vector2(x, y)

  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObject(selectableMesh)
  if (intersects.length) {
    triggerSelectionEffect(selectableMesh.position)
  }
}

// 选中效果：持续发射波纹 & 自身克隆闪烁
function triggerSelectionEffect(position) {
  // 波纹
  createRipple(position)
  // 自身克隆
  createPulseClone(position)
}

function createRipple(position) {
  const maxRadius = 2
  const duration = 1.5
  const geometry = new THREE.RingGeometry(0.2, 0.25, 64)
  const material = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.copy(position)
  mesh.rotation.x = -Math.PI / 2
  rippleGroup.add(mesh)

  const start = clock.getElapsedTime()
  ;(function animateRipple() {
    const elapsed = clock.getElapsedTime() - start
    const t = elapsed / duration
    if (t < 1) {
      const r = THREE.MathUtils.lerp(0.2, maxRadius, t)
      mesh.scale.set(r, r, r)
      material.opacity = 0.6 * (1 - t)
      requestAnimationFrame(animateRipple)
    } else {
      rippleGroup.remove(mesh)
      geometry.dispose()
      material.dispose()
    }
  })()
}

function createPulseClone(position) {
  const geometry = selectableMesh.geometry.clone()
  const material = new THREE.MeshStandardMaterial({ color: 0x00ffff, transparent: true })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.copy(position)
  scene.add(mesh)

  const duration = 1
  const start = clock.getElapsedTime()
  ;(function animatePulse() {
    const elapsed = clock.getElapsedTime() - start
    const t = elapsed / duration
    if (t < 1) {
      const scale = THREE.MathUtils.lerp(1, 1.5, t)
      mesh.scale.set(scale, scale, scale)
      material.opacity = 1 - t
      requestAnimationFrame(animatePulse)
    } else {
      scene.remove(mesh)
      geometry.dispose()
      material.dispose()
      // 继续闪烁
      setTimeout(() => createPulseClone(position), 200)
    }
  })()
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  renderer.render(scene, camera)
}
</script>

<style scoped>
.container { width: 100vw; height: 100vh; position: relative; }
</style>
