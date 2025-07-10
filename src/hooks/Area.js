import * as THREE from 'three'

export class Area {
  constructor({ points, color }) {
    this.scene = new THREE.Object3D()
    this.t = 0
    this.animateSpeed = 0.006
    this.points = points
    this.color = 0x66ccff
    this.animated = []
    this.num = 6
    this.drawArea(points ?? [])
  }
  drawArea(points) {
    this.points = points
    if (!this.points.length) return
    const points2d = this.points.map(({ x, y, z }) => new THREE.Vector2(x, -z))
    const shape = new THREE.Shape(points2d)

    // hole
    // const holePath = new THREE.Path().moveTo(points2d[0].x, points2d[0].y)
    // for (let i = 1; i < innerPoints.length; i++) {
    //   holePath.lineTo(innerPoints[i].x, innerPoints[i].y)
    // }
    // holePath.closePath()
    // shape.holes.push(holePath)

    const capMat = new THREE.MeshBasicMaterial({
      color: this.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      depthTest: false
    })
    const sideMat = new THREE.MeshBasicMaterial({
      visible: false
    })
    const extrudeSettings = {
      depth: 1,
      bevelEnabled: false,
      material: 1,
      extrudeMaterial: 0
    }

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    geometry.rotateX(-Math.PI / 2)
    this.area = new THREE.Mesh(geometry, [sideMat, capMat])

    for (let i = 0; i < this.num; i++) {
      const animatedMesh = new THREE.Mesh(geometry, [sideMat, capMat.clone()])
      this.animated.push({
        t: i / this.num,
        mesh: animatedMesh
      })
      this.scene.add(this.area, animatedMesh)
    }
  }

  animate() {
    this.animated.forEach((item, i) => {
      item.t += this.animateSpeed
      if (item.t > 1) item.t = 0
      item.mesh.material[1].opacity = 1 - item.t
      item.mesh.position.y = item.t * 16
    })
  }
  dispose() {
    this.scene.traverse(child => child.dispose?.())
    this.scene.remove(...this.scene.children)
  }
}
