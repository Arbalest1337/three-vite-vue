<template>
  <div ref="container" class="container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'

const container = ref(null)
let renderer, scene, camera, lineMesh, particleSystem, animationId

// 示例点数组，可动态传入
const pointsData = [
  { x: 0, y: 0, z: 0 },
  { x: 5, y: 2, z: -3 },
  { x: 10, y: 0, z: 0 },
  { x: 15, y: 4, z: 5 },
  { x: 20, y: 0, z: 0 }
]

// 粒子参数
const PARTICLE_COUNT = 200
const TRAIL_SPEED = 0.02

let curve, curvePoints, clock

onMounted(() => {
  initThree()
  createTrajectoryLine(pointsData)
  createParticleTrail()
  clock = new THREE.Clock()
  animate()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  renderer.dispose()
  lineMesh.geometry.dispose()
  lineMesh.material.dispose()
  particleSystem.geometry.dispose()
  particleSystem.material.dispose()
})

function initThree() {
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x111111)

  camera = new THREE.PerspectiveCamera(
    60,
    container.value.clientWidth / container.value.clientHeight,
    0.1,
    1000
  )
  camera.position.set(10, 10, 10)
  camera.lookAt(0, 0, 0)

  scene.add(new THREE.AmbientLight(0xffffff, 0.5))
  const dirLight = new THREE.DirectionalLight(0xffffff, 1)
  dirLight.position.set(0, 20, 10)
  scene.add(dirLight)

  window.addEventListener('resize', onResize)
}

function onResize() {
  camera.aspect = container.value.clientWidth / container.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
}

function createTrajectoryLine(data) {
  curvePoints = data.map(p => new THREE.Vector3(p.x, p.y, p.z))
  curve = new THREE.CatmullRomCurve3(curvePoints)

  const tubeGeo = new THREE.TubeGeometry(curve, 200, 0.05, 8, false)
  const material = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec2 vUv;
      void main() {
        float alpha = sin(vUv.y * 10.0 - time * 2.0) * 0.5 + 0.5;
        gl_FragColor = vec4(vec3(0.2, 0.7, 1.0), alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  })

  lineMesh = new THREE.Mesh(tubeGeo, material)
  scene.add(lineMesh)
}

function createParticleTrail() {
  const geom = new THREE.BufferGeometry()
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  const alphas = new Float32Array(PARTICLE_COUNT)
  const offsets = new Float32Array(PARTICLE_COUNT)

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    offsets[i] = Math.random()
    alphas[i] = 1.0
  }
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geom.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))
  geom.setAttribute('offset', new THREE.BufferAttribute(offsets, 1))

  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: `
      attribute float alpha;
      attribute float offset;
      uniform float time;
      varying float vAlpha;
      void main() {
        vAlpha = 1.0 - mod(offset + time * ${TRAIL_SPEED}, 1.0);
        gl_PointSize = mix(2.0, 8.0, vAlpha);
        vec3 pos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        gl_FragColor = vec4(0.2, 0.8, 1.0, vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false
  })

  particleSystem = new THREE.Points(geom, mat)
  scene.add(particleSystem)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()

  // 更新时间uniform
  lineMesh.material.uniforms.time.value += delta
  particleSystem.material.uniforms.time.value += delta

  // 更新粒子位置
  const positions = particleSystem.geometry.attributes.position.array
  const offsets = particleSystem.geometry.attributes.offset.array

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = (offsets[i] + particleSystem.material.uniforms.time.value * TRAIL_SPEED) % 1
    const pt = curve.getPointAt(t)
    positions[i * 3] = pt.x
    positions[i * 3 + 1] = pt.y
    positions[i * 3 + 2] = pt.z
  }
  particleSystem.geometry.attributes.position.needsUpdate = true

  renderer.render(scene, camera)
}
</script>

<style scoped>
.container {
  width: 100vw;
  height: 100vh;
  position: relative;
}
</style>
