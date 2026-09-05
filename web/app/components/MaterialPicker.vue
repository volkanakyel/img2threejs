<script setup lang="ts">
import { AnimatePresence, LayoutGroup, motion } from 'motion-v'
import { MATERIAL_PRESETS, type Finish, type GlassParams, type MaterialPreset } from '~/utils/glassScene'

const props = defineProps<{ glass: GlassParams }>()

const tab = ref<Finish>(props.glass.finish)
watch(() => props.glass.finish, f => (tab.value = f))

const presets = computed(() => MATERIAL_PRESETS.filter(p => p.group === tab.value))
const active = computed(() => {
  const g = props.glass
  return MATERIAL_PRESETS.find(pr => Object.entries(pr.values).every(([k, v]) => g[k as keyof GlassParams] === v))?.id ?? null
})
function apply(p: MaterialPreset) { Object.assign(props.glass, p.values) }
function switchTab(f: Finish) {
  tab.value = f
  if (props.glass.finish !== f) apply(MATERIAL_PRESETS.find(p => p.id === (f === 'metal' ? 'gold' : 'clear'))!)
}

function sphere(p: MaterialPreset) {
  const glassy = p.group === 'glass'
  return {
    background: [
      'radial-gradient(circle at 30% 26%, rgba(255,255,255,0.95) 0, rgba(255,255,255,0.45) 9%, rgba(255,255,255,0) 26%)',
      glassy ? 'radial-gradient(circle at 68% 78%, rgba(255,255,255,0.55) 0, rgba(255,255,255,0) 32%)' : 'radial-gradient(circle at 70% 78%, rgba(0,0,0,0.28) 0, rgba(0,0,0,0) 46%)',
      p.swatch,
    ].join(','),
    boxShadow: glassy
      ? 'inset 0 0 0 1px rgba(0,0,0,0.08), inset -4px -6px 10px rgba(0,0,0,0.10), 0 8px 14px -8px rgba(0,0,0,0.35)'
      : 'inset -5px -7px 12px rgba(0,0,0,0.28), inset 3px 4px 8px rgba(255,255,255,0.25), 0 8px 14px -8px rgba(0,0,0,0.45)',
  }
}
</script>

<template>
  <LayoutGroup>
    <div class="flex flex-col gap-3">
      <div class="relative grid grid-cols-2 rounded-lg bg-black/[0.05] p-0.5">
        <button
          v-for="f in (['glass', 'metal'] as const)" :key="f"
          class="relative z-10 flex h-7 items-center justify-center gap-1.5 rounded-md text-[12px] font-medium transition-colors"
          :class="tab === f ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'"
          @click="switchTab(f)"
        >
          <motion.span v-if="tab === f" layout-id="finish-pill" class="absolute inset-0 -z-10 rounded-md bg-card shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.05)]" :transition="{ type: 'spring', stiffness: 500, damping: 40 }" />
          <Icon :name="f === 'glass' ? 'gem' : 'cuboid'" :size="13" />
          {{ f === 'glass' ? 'Glass' : 'Metal & solid' }}
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          :key="tab" class="grid grid-cols-4 gap-1.5"
          :initial="{ opacity: 0, y: 6 }" :animate="{ opacity: 1, y: 0 }" :exit="{ opacity: 0, y: -6 }"
          :transition="{ duration: 0.18 }"
        >
          <motion.button
            v-for="(p, i) in presets" :key="p.id"
            class="group relative flex flex-col items-center gap-1.5 rounded-lg px-1 pt-2.5 pb-2"
            :class="active === p.id ? '' : 'hover:bg-black/[0.04]'"
            :initial="{ opacity: 0, scale: 0.9 }" :animate="{ opacity: 1, scale: 1 }"
            :transition="{ type: 'spring', stiffness: 420, damping: 30, delay: i * 0.02 }"
            :while-hover="{ y: -1 }" :while-press="{ scale: 0.94 }" :title="p.label"
            @click="apply(p)"
          >
            <motion.span v-if="active === p.id" layout-id="material-ring" class="absolute inset-0 rounded-lg bg-card shadow-[0_0_0_1px_var(--foreground)]" :transition="{ type: 'spring', stiffness: 520, damping: 38 }" />
            <span class="relative size-8 rounded-full transition-transform group-hover:scale-105" :style="sphere(p)" />
            <span class="relative max-w-full truncate text-[11px] leading-none" :class="active === p.id ? 'text-foreground' : 'text-muted-foreground'">{{ p.label }}</span>
          </motion.button>
        </motion.div>
      </AnimatePresence>
    </div>
  </LayoutGroup>
</template>
