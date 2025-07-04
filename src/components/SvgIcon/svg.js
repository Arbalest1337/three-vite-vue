const files = import.meta.glob('@/assets/svg/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default'
})
const modules = {}
Object.keys(files).forEach(key => {
  const moduleName = key.split('/').at(-1).replace(/.svg/, '')
  modules[moduleName] = files[key]
})
export default modules
