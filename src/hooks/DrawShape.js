import * as THREE from 'three'

export class DrawShape {
  constructor({ points = [] } = {}) {
    this.shape = new THREE.Object3D()
    this.color = 0x66ccff
    this.pointsGroup = new THREE.Object3D()
    this.scene = new THREE.Object3D()
    this.scene.add(this.shape, this.pointsGroup)
    this.setPoints(points)
  }

  setPoints(points) {
    this.points = points
    this.dispose()
    if (!points.length) return
    this.drawArea()
    this.drawPoints()
  }

  drawArea() {
    const points2d = this.points.map(({ x, y, z }) => new THREE.Vector2(x, z))
    const shape = new THREE.Shape(points2d)
    const geometry = new THREE.ShapeGeometry(shape)
    const material = new THREE.MeshBasicMaterial({
      color: 0x66ccff,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
      transparent: true,
      opacity: 0.5
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = Math.PI / 2
    this.shape.add(mesh)
  }
  drawPoints() {
    const points3d = this.points.map(({ x, y, z }) => new THREE.Vector3(x, y, z))
    const geometry = new THREE.SphereGeometry(1, 16, 16)
    const material = new THREE.MeshBasicMaterial({
      depthWrite: false,
      depthTest: false,
      color: this.color,
      transparent: true,
      opacity: 1
    })
    const mesh = new THREE.Mesh(geometry, material)
    for (const point of points3d) {
      const cloned = mesh.clone()
      cloned.position.copy(point)
      this.pointsGroup.add(cloned)
    }
  }

  dispose() {
    this.scene.traverse(child => child.dispose?.())
    this.shape.remove(...this.shape.children)
    this.pointsGroup.remove(...this.pointsGroup.children)
  }
}
