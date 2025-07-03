import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader"
import { debounce } from "lodash-es"
import pathData from "./path.json"
import Stats from "three/addons/libs/stats.module"
import { Card } from "./Card"

export default function useThree({ target }) {
  const width = window.innerWidth
  const height = window.innerHeight

  const stats = new Stats()
  document.body.appendChild(stats.dom)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 1000)
  camera.position.set(-50, 90, 120)
  camera.lookAt(scene)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // controls
  const controls = new OrbitControls(camera, renderer.domElement)

  // grid
  const gridHelper = new THREE.GridHelper(150, 10, 0xffffff, 0xffffff)
  gridHelper.material.transparent = true
  gridHelper.material.opacity = 0.5
  gridHelper.material.depthWrite = false
  scene.add(gridHelper)

  const onResize = debounce(() => {
    const { innerWidth: w, innerHeight: h } = window
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }, 300)

  watchEffect(() => {
    window.addEventListener("resize", onResize)
    onWatcherCleanup(() => window.removeEventListener("resize", onResize))
  })

  const loadGLTF = (path, { onProgress } = {}) => {
    const loader = new GLTFLoader()
    return new Promise((resolve, reject) => {
      loader.load(
        path,
        (gltf) => {
          resolve(gltf)
        },
        (e) => onProgress?.(e),
        reject
      )
    })
  }

  // 太阳光
  const drawSunlight = () => {
    const dirLight = new THREE.DirectionalLight(0xffffff, 3)
    dirLight.color.setHSL(0.1, 1, 0.95)
    dirLight.position.set(-1, 1.75, 1)
    dirLight.position.multiplyScalar(30)
    scene.add(dirLight)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 2048
    dirLight.shadow.mapSize.height = 2048
    const d = 100
    dirLight.shadow.camera.left = -d
    dirLight.shadow.camera.right = d
    dirLight.shadow.camera.top = d
    dirLight.shadow.camera.bottom = -d
    dirLight.shadow.camera.far = 3500
    dirLight.shadow.bias = -0.0001
    const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 10)
    scene.add(dirLightHelper)
  }

  const drawModel = async () => {
    const gltf = await loadGLTF("/model/factory/scene.gltf")
    const model = gltf.scene
    const box = new THREE.Box3().setFromObject(model)
    const minY = box.min.y
    model.position.y -= minY
    model.traverse((child) => {
      if (child.isObject3D) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    scene.add(model)
  }

  // start
  const animate = (time) => {
    controls.update()
    stats.update()
    renderer.render(scene, camera)
    Object.values(cards).forEach((card) => card.animate())
  }

  const cards = {}
  const cardsGroup = new THREE.Object3D()
  scene.add(cardsGroup)
  const clearCards = () => {
    Object.entries(cards).forEach(([key, card]) => {
      card.dispose()
      delete cards[key]
    })
    cardsGroup.remove(...cardsGroup.children)
  }
  const setCards = (cardList) => {
    clearCards()
    cardList.forEach(({ points, id, color }) => {
      const card = new Card({
        color,
        points,
        id,
      })
      cardsGroup.add(card.scene)
      cards[id] = card
    })
  }

  // fps limit
  let lastTime = 0
  const targetFPS = 60
  const targetFrameTime = 1000 / targetFPS

  const init = async () => {
    await drawModel()
    drawSunlight()
    renderer.setAnimationLoop((time) => {
      const delta = time - lastTime
      if (delta < targetFrameTime) return
      lastTime = time - (delta % targetFrameTime)
      animate()
    })

    setCards(
      pathData.map((item, i) => ({
        points: item,
        id: i,
        color: item[0].color,
      }))
    )
    unref(target).appendChild(renderer.domElement)
  }

  return { scene, camera, init, loadGLTF, cards, setCards }
}
