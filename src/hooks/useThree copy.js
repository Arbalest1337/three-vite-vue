import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader'
import { debounce } from 'lodash-es'
import pathData from './path.json'
import Stats from 'three/addons/libs/stats.module'

export default function useThree({ target }) {
  const width = window.innerWidth
  const height = window.innerHeight

  const stats = new Stats()
  document.body.appendChild(stats.dom)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 1000)
  camera.position.set(-50, 80, 120)
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
    window.addEventListener('resize', onResize)
    onWatcherCleanup(() => window.removeEventListener('resize', onResize))
  })

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

  // 路径
  const pathBoxes = []
  const drawPath = () => {
    pathData.forEach(points => {
      const color = new THREE.Color(points[0].color)
      const vectorPoints = points.map(({ x, y, z }) => new THREE.Vector3(x, z, y))
      const curve = new THREE.CatmullRomCurve3(vectorPoints)
      const curvePoints = curve.getPoints(50)

      // 圆柱
      const tubeGeometry = new THREE.TubeGeometry(curve, 100, 0.2, 8, false)
      const tubeMaterial = new THREE.MeshStandardMaterial({
        depthWrite: false,
        depthTest: false,
        color,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
        emissive: color
      })
      const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial)
      scene.add(tubeMesh)

      // 箭头
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.6, 2, 8), // 半径、高度、边数
        new THREE.MeshStandardMaterial({
          depthWrite: false,
          depthTest: false,
          color,
          emissive: color
        })
      )
      cone.rotation.x = Math.PI / 2
      // 包一层 Object3D 控制位置和朝向
      const arrow = new THREE.Object3D()
      arrow.add(cone)
      const num = 4
      for (let i = 0; i < num; i++) {
        const cloned = arrow.clone()
        scene.add(cloned)
        pathBoxes.push({
          curve,
          mesh: cloned,
          t: i / num
        })
      }
    })
  }

  // 当前位置点
  const drawPoint = () => {}

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

  const drawGround = () => {
    const groundGeo = new THREE.PlaneGeometry(200, 200)
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x888888 })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = 0
    ground.receiveShadow = true
    scene.add(ground)
  }

  const drawModel = async () => {
    const gltf = await loadGLTF('/model/factory/scene.gltf')
    const model = gltf.scene
    const box = new THREE.Box3().setFromObject(model)
    const minY = box.min.y
    model.position.y -= minY
    model.traverse(child => {
      if (child.isObject3D) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    scene.add(model)
  }

  const arrowsAnimate = () => {
    // 路径方块动画
    pathBoxes.forEach(boxData => {
      boxData.t += 0.002 // 控制速度
      if (boxData.t > 1) boxData.t = 0
      const pos = boxData.curve.getPointAt(boxData.t)
      const tangent = boxData.curve.getTangentAt(boxData.t)
      boxData.mesh.position.copy(pos)
      const lookTarget = pos.clone().add(tangent)
      boxData.mesh.lookAt(lookTarget)
    })
  }

  // start
  const animate = time => {
    controls.update()
    stats.update()
    renderer.render(scene, camera)
    arrowsAnimate()
  }

  const init = async () => {
    await drawModel()
    drawSunlight()
    drawPath()
    renderer.setAnimationLoop(animate)
    unref(target).appendChild(renderer.domElement)
  }

  return { scene, camera, init, loadGLTF }
}
