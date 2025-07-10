import * as THREE from 'three'

import { LineMaterial } from 'three/addons/lines/LineMaterial'
import { LineGeometry } from 'three/addons/lines/LineGeometry'
import { Line2 } from 'three/addons/lines/Line2.js'
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer'

export class Card {
  constructor({ id, color, points, showPath, pointGeometry, pointMaterial }) {
    this.showPath = showPath ?? false
    this.points = []
    this._points = []
    this.id = id
    this.color = new THREE.Color(color)
    this.basicMaterial = new THREE.MeshBasicMaterial({
      depthWrite: false,
      depthTest: false,
      color,
      transparent: true,
      opacity: 1
    })

    // 当前位置点
    this.point = new THREE.Object3D()
    this.pointRadius = 1
    this.animatedPoint = new THREE.Object3D()
    this.pointAnimateTimer = 0
    this.pointAnimateSpeed = 0.01
    this.pointGeometry = new THREE.SphereGeometry(this.pointRadius, 16, 16)
    this.animatedPointMaterial = this.basicMaterial.clone()
    this.animatedPoint.add(new THREE.Mesh(this.pointGeometry.clone(), this.animatedPointMaterial))
    const pointMesh = new THREE.Mesh(this.pointGeometry, this.basicMaterial.clone())
    pointMesh.layers.enable(1)
    pointMesh.name = id
    this.point.add(pointMesh, this.animatedPoint)

    // label
    const div = document.createElement('div')
    div.textContent = `100${id}`
    Object.assign(div.style, {
      margin: '0px',
      color: color,
      fontWeight: 600,
      fontSize: '14px'
    })
    this.label = new CSS2DObject(div)
    this.label.visible = true

    // 轨迹
    this.pathIgnoreThreshold = 2
    this.pathMaterial = new LineMaterial({
      depthWrite: false,
      depthTest: false,
      color,
      linewidth: 4,
      dashed: true,
      dashOffset: 0,
      dashSize: 2
    })
    this.path = new Line2(new LineGeometry(), this.pathMaterial)
    this.path.visible = showPath

    // init
    this.setPoints(points)
    this.scene = new THREE.Object3D().add(this.point, this.path, this.label)
    this.uuid = this.scene.uuid
  }

  setPoints(points) {
    this.points = points
    this._points = this.points.map(({ x, y, z }) => ({ x, y: z, z: y }))
    this.updatePath()
    this.updatePoint()
  }

  // 当前/最新位置点
  updatePoint() {
    if (this._points.at(-1)) {
      const { x, y, z } = this._points.at(-1)
      this.point.position.set(x, y, z)
      this.label.position.set(x, y + 5, z)
    }
  }

  pointAnimate() {
    this.pointAnimateTimer += this.pointAnimateSpeed
    if (this.pointAnimateTimer > 1) this.pointAnimateTimer = 0
    const s = this.pointAnimateTimer * 4 + 1
    this.animatedPointMaterial.opacity = 0.9 - this.pointAnimateTimer
    this.animatedPoint.scale.set(s, s, s)
  }

  // 路径
  updatePath() {
    const positions = this._points.flatMap(({ x, y, z }) => [x, y, z])
    this.path.geometry.dispose()
    this.path.geometry = new LineGeometry()
    this.path.geometry.setPositions(positions)
    this.path.computeLineDistances()
  }

  pathAnimate() {
    this.pathMaterial.dashOffset -= 0.1
  }

  animate() {
    this.pointAnimate()
    this.pathAnimate()
  }
  dispose() {
    this.scene.traverse(child => child.dispose?.())
    this.label.element.parentNode?.removeChild(this.label.element)
  }
}
