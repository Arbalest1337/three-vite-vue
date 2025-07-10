import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader'
import { debounce } from 'lodash-es'
import pathData from './path.json'
import Stats from 'three/addons/libs/stats.module'
import { Card } from './Card'
import { Area } from './Area'
import { Plane } from './Plane'
import { DrawShape } from './DrawShape'
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'

export default function useThree({ target }) {
  const showPath = ref(false)

  const stats = new Stats()
  // document.body.appendChild(stats.dom)

  // scene
  const scene = new THREE.Scene()
  const infoScene = new THREE.Object3D()
  scene.add(infoScene)
  //editor
  const editorScene = new THREE.Object3D()
  scene.add(editorScene)
  // camera
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 1000)
  camera.position.set(-50, 90, 120)
  camera.lookAt(scene)

  //renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputEncoding = THREE.sRGBEncoding

  //2d renderer
  const labelRenderer = new CSS2DRenderer()
  labelRenderer.setSize(window.innerWidth, window.innerHeight)
  labelRenderer.domElement.style.position = 'absolute'
  labelRenderer.domElement.style.top = '0px'
  labelRenderer.domElement.style.left = '0'
  labelRenderer.domElement.style.pointerEvents = 'none'

  // controls
  const controls = shallowRef(new OrbitControls(camera, renderer.domElement))

  // grid
  const gridHelper = new THREE.GridHelper(300, 10, 0xffffff, 0xffffff)
  gridHelper.material.transparent = true
  gridHelper.material.opacity = 0.5
  gridHelper.material.depthWrite = false
  scene.add(gridHelper)

  // resize
  const onResize = debounce(() => {
    const { innerWidth: w, innerHeight: h } = window
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
    labelRenderer.setSize(w, h)
  }, 50)

  watchEffect(() => {
    window.addEventListener('resize', onResize)
    onWatcherCleanup(() => window.removeEventListener('resize', onResize))
  })

  // loader
  const loadGLTF = (path, { onProgress } = {}) => {
    const loader = new GLTFLoader()
    return new Promise((resolve, reject) => {
      loader.load(
        path,
        gltf => {
          resolve(gltf)
        },
        e => onProgress?.(e),
        reject
      )
    })
  }

  // ply model
  const loadPlyModel = () => {
    const loader = new PLYLoader()
    loader.load('/model/6.ply', geometry => {
      const s = 20
      geometry.scale(s, s, s) // 放大10倍，可按需调整
      const material = new THREE.PointsMaterial({
        vertexColors: true,
        size: 0.1
      })
      const points = new THREE.Points(geometry, material)
      points.geometry.center()
      points.rotation.x = Math.PI*1.062
      points.position.y = 30

      scene.add(points)
    })
  }

  const drawModel = async () => {
    // const gltf = await loadGLTF('/model/factory/scene.gltf')
    const gltf = await loadGLTF('/model/fast.glb')
    const model = gltf.scene
    const box = new THREE.Box3().setFromObject(model)
    const minY = box.min.y
    model.position.y = 50
    const s = 20
    model.scale.set(s, s, s)
    model.rotation.x = Math.PI
    model.traverse(child => {
      // if (child.isObject3D) {
      //   child.castShadow = true
      //   child.receiveShadow = true
      // }
      // if (child.material) {
      //   child.material.vertexColors = true
      //   child.material.size = 1
      // }
      // if (child.isMesh && child.material) {
      //   const m = child.material
      //   // 如果 loader 没读到 emissive 参数，就给一个默认值
      //   m.emissive = m.emissive || new THREE.Color(0xff0000)
      //   // 强制使用贴图里的 emissiveMap，并把强度调上去
      //   m.emissiveMap && (m.emissiveIntensity = 1.0)
      //   m.needsUpdate = true
      // }
    })
    scene.add(model)
  }

  // light
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
    // const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 10)
    // scene.add(dirLightHelper)
  }

  // start

  const cards = {}
  const cardsGroup = new THREE.Object3D()
  infoScene.add(cardsGroup)
  const clearCards = () => {
    Object.entries(cards).forEach(([key, card]) => {
      card.dispose()
      delete cards[key]
    })
    cardsGroup.remove(...cardsGroup.children)
  }
  const setCards = cardList => {
    clearCards()
    cardList.forEach(({ points, id, color }) => {
      const card = new Card({
        color,
        points,
        id,
        showPath: showPath.value
      })
      cardsGroup.add(card.scene)
      cards[id] = card
    })
  }

  // mouse picking
  // drawShape
  const raycaster = new THREE.Raycaster()
  // raycaster.layers.set(1)

  const shape = new DrawShape()
  editorScene.add(shape.scene)

  const onDBLClick = e => {
    const pointer = new THREE.Vector2()
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1
    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObject(plane.mesh)
    if (!intersects.length) return
    const point = intersects[0].point
    shape.setPoints([...shape.points, point])
  }

  watchEffect(() => {
    window.addEventListener('dblclick', onDBLClick)
    onWatcherCleanup(() => window.removeEventListener('dblclick', onDBLClick))
  })

  //  draw area

  let areas = []
  const areasGroup = new THREE.Object3D()
  infoScene.add(areasGroup)
  const drawAreas = areasPoints => {
    areas = []
    areasGroup.traverse(child => child.dispose?.())
    areasGroup.remove(...areasGroup.children)
    areasPoints.forEach(points => {
      const area = new Area({ points })
      areas.push(area)
      areasGroup.add(area.scene)
    })
  }

  // plane
  const plane = new Plane({ renderer })
  const drawPlane = () => {
    scene.add(plane.scene)
  }

  // fps limit
  let lastTime = 0
  const targetFPS = 60
  const targetFrameTime = 1000 / targetFPS

  const animate = time => {
    controls.value.update()
    stats.update()
    Object.values(cards).forEach(card => card.animate())
    areas.forEach(area => area.animate())
    renderer.render(scene, camera)
    labelRenderer.render(scene, camera)
  }

  // init
  const init = async () => {
    loadPlyModel()
    // await drawModel()
    drawSunlight()
    // drawPlane()
    renderer.setAnimationLoop(time => {
      const delta = time - lastTime
      if (delta < targetFrameTime) return
      lastTime = time - (delta % targetFrameTime)
      animate()
    })
    unref(target).appendChild(renderer.domElement)
    unref(target).appendChild(labelRenderer.domElement)
    // fakePath()
  }

  const fakePath = () => {
    setInterval(() => {
      for (const key in cards) {
        const card = cards[key]
        const { x, y } = card.points.at(-1)
        const dx = Math.random()
        const dy = Math.random()
        const newPoint = { x: x + dx, y: y + dy, z: 0 }
        card.setPoints([...card.points, newPoint])
      }
    }, 200)
  }

  return {
    scene,
    infoScene,
    editorScene,
    camera,
    controls,
    init,
    loadGLTF,
    cards,
    setCards,
    showPath,
    shape,
    drawAreas
  }
}
