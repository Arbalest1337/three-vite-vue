<template>
  <div class="container" :class="{ show }">
    <v-sheet class="content" :elevation="6" :height="`100%`" :width="`100%`" border rounded>
      <v-toolbar density="compact" size="small">
        <v-toolbar-title style="font-size: 15px">设备列表</v-toolbar-title>

        <v-btn :icon="mdiClose" rounded="lg" border @click="show = false"></v-btn>
      </v-toolbar>

      <v-text-field
        v-model="search"
        density="compact"
        label="搜索"
        :prepend-inner-icon="mdiMagnify"
        hide-details
        single-line
      />

      <div class="scroll">
        <v-data-table
          :items-per-page="9999"
          v-model:search="search"
          :filter-keys="['id']"
          v-model="selected"
          :headers="headers"
          :items="list"
          item-value="id"
          show-select
          hide-default-footer
        >
          <template v-slot:item.actions="{ item }">
            <v-icon
              style="cursor: pointer"
              color="medium-emphasis"
              :icon="mdiEyeArrowRight"
              @click="onFindTarget(item.id)"
            ></v-icon>
          </template>
        </v-data-table>
      </div>
    </v-sheet>
  </div>
</template>
<script setup>
import { mdiClose, mdiEyeArrowRight, mdiMagnify } from '@mdi/js'
const show = defineModel('show', { default: false })

const search = ref('')

const list = defineModel('list', { default: () => [] })
const selected = defineModel('selected', { default: () => [] })
const headers = [
  {
    title: '编号',
    key: 'id'
  },
  {
    title: '操作',
    key: 'actions'
  }
]

const handleSelectedChange = inject('handleSelectedChange')
watch(selected, v => {
  handleSelectedChange(v)
})

onMounted(() => {
  list.value = new Array(11).fill(1).map((_, i) => ({ id: i }))
})

const lookAtTarget = inject('lookAtTarget')
const onFindTarget = id => {
  lookAtTarget(id)
}
</script>
<style lang="scss" scoped>
.container {
  position: fixed;
  right: 0;
  width: 360px;
  bottom: 0;
  top: 56px;
  z-index: 1;
  transform: translateX(100%);
  transition: all 0.3s ease-in-out;
  &.show {
    transform: translateX(0);
  }
  .content {
    overflow: hidden;
    overflow-y: auto;
    position: relative;
    .title {
      height: 50px;
      display: flex;
      align-items: center;
      padding-right: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .scroll {
      height: calc(100% - 88px);
      overflow-y: auto;
    }
  }
  .close {
    position: absolute;
    right: 0;
    top: 0;
  }
}

.search-input {
  height: 40px;
}
</style>
