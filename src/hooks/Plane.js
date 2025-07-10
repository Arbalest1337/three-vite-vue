import * as THREE from 'three'

export class Plane {
  constructor({ renderer }) {
    this.scene = new THREE.Object3D()
    const loader = new THREE.TextureLoader()
    const texture = loader.load('/assets/images/bg_dark.png')
    texture.magFilter = THREE.LinearFilter
    texture.minFilter = THREE.LinearMipMapLinearFilter
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
    texture.generateMipmaps = true
    texture.needsUpdate = true

    const geometry = new THREE.PlaneGeometry(302.4, 205.9)
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide
    })
    material.color.setScalar(1)
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.rotation.x = -Math.PI / 2
    this.scene.add(this.mesh)
  }
}
