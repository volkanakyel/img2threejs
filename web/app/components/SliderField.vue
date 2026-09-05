<script setup lang="ts">
import { AnimatePresence, motion } from 'motion-v'
import { Slider } from '@/components/ui/slider'

const props = withDefaults(defineProps<{
  label: string
  modelValue: number
  min: number
  max: number
  step?: number
  unit?: string
  decimals?: number
  hint?: string
  defaultValue?: number
}>(), { step: 0.01, unit: '', decimals: 2 })
const emit = defineEmits<{ 'update:modelValue': [number] }>()

const arr = computed({
  get: () => [props.modelValue],
  set: (v: number[] | undefined) => { if (v && v[0] !== undefined) set(v[0]) },
})
const changed = computed(() => props.defaultValue !== undefined && Math.abs(props.defaultValue - props.modelValue) > 1e-9)
const fmt = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: props.decimals })

// Displayed number springs toward the real value so typed jumps and preset changes roll over.
const shown = useSpringText(() => props.modelValue, fmt, { stiffness: 420, damping: 38 })

const pct = computed(() => ((props.modelValue - props.min) / (props.max - props.min)) * 100)
const defaultPct = computed(() => props.defaultValue === undefined ? null : ((props.defaultValue - props.min) / (props.max - props.min)) * 100)
const dragging = ref(false)
const editing = ref(false)
const draft = ref('')

function set(v: number) {
  if (Number.isNaN(v)) return
  emit('update:modelValue', Math.min(props.max, Math.max(props.min, v)))
}
function focus(e: FocusEvent) {
  editing.value = true
  draft.value = fmt(props.modelValue)
  nextTick(() => (e.target as HTMLInputElement).select())
}
function commit(e: Event) {
  editing.value = false
  set(parseFloat((e.target as HTMLInputElement).value.replace(',', '.')))
}
function onWheel(e: WheelEvent) {
  e.preventDefault()
  set(+(props.modelValue + (e.deltaY < 0 ? props.step : -props.step)).toFixed(6))
}
function onKey(e: KeyboardEvent) {
  const big = e.shiftKey ? 10 : 1
  if (e.key === 'ArrowUp') { e.preventDefault(); set(+(props.modelValue + props.step * big).toFixed(6)) }
  if (e.key === 'ArrowDown') { e.preventDefault(); set(+(props.modelValue - props.step * big).toFixed(6)) }
}
</script>

<template>
  <div class="group/slider flex flex-col gap-1.5" :title="hint">
    <div class="flex items-center justify-between">
      <span class="flex items-center gap-1.5 text-[12.5px] text-foreground/85">
        {{ label }}
        <AnimatePresence>
          <motion.button
            v-if="changed" key="reset"
            class="flex text-muted-foreground/60 transition-colors hover:text-foreground"
            :initial="{ opacity: 0, scale: 0.6 }" :animate="{ opacity: 1, scale: 1 }" :exit="{ opacity: 0, scale: 0.6 }"
            title="Reset to default" @click="set(defaultValue!)"
          ><Icon name="reset" :size="11" /></motion.button>
        </AnimatePresence>
      </span>
      <label
        class="flex h-6 items-center rounded-md border bg-card pr-1.5 pl-2 transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25"
        :class="dragging ? 'border-foreground/40' : 'border-input'"
      >
        <input
          v-if="editing"
          class="w-12 bg-transparent text-right font-mono text-[11.5px] tabular-nums outline-none"
          :value="draft" autofocus
          @input="draft = ($event.target as HTMLInputElement).value"
          @blur="commit" @keydown.enter="($event.target as HTMLInputElement).blur()" @keydown.esc="editing = false"
        >
        <span
          v-else
          class="w-12 cursor-text text-right font-mono text-[11.5px] tabular-nums select-none outline-none"
          tabindex="0"
          @focus="focus" @wheel="onWheel" @keydown="onKey"
        >{{ shown }}</span>
        <span v-if="unit" class="ml-1 text-[10px] text-muted-foreground">{{ unit }}</span>
      </label>
    </div>

    <div class="relative h-5" @pointerdown="dragging = true" @pointerup="dragging = false" @pointercancel="dragging = false" @pointerleave="dragging = false">
      <!-- default marker -->
      <span v-if="defaultPct !== null && changed" class="pointer-events-none absolute top-1/2 h-2 w-px -translate-y-1/2 bg-foreground/25" :style="{ left: `calc(${defaultPct}% )` }" />
      <Slider
        v-model="arr" :min="min" :max="max" :step="step"
        class="h-5 [&_[data-slot=slider-range]]:bg-foreground [&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:border-[1.5px] [&_[data-slot=slider-thumb]]:border-foreground [&_[data-slot=slider-thumb]]:bg-card [&_[data-slot=slider-thumb]]:shadow-[0_1px_3px_rgba(0,0,0,0.18)] [&_[data-slot=slider-thumb]]:ring-foreground/10 [&_[data-slot=slider-thumb]]:transition-[transform,box-shadow] [&_[data-slot=slider-thumb]]:hover:scale-110 [&_[data-slot=slider-thumb]]:active:scale-95 [&_[data-slot=slider-track]]:h-[3px] [&_[data-slot=slider-track]]:bg-foreground/10"
      />
      <!-- drag tooltip -->
      <AnimatePresence>
        <motion.div
          v-if="dragging" key="tip"
          class="pointer-events-none absolute -top-7 -translate-x-1/2 rounded-md bg-foreground px-1.5 py-0.5 font-mono text-[10.5px] text-background shadow-md"
          :style="{ left: `${pct}%` }"
          :initial="{ opacity: 0, y: 4, scale: 0.9 }" :animate="{ opacity: 1, y: 0, scale: 1 }" :exit="{ opacity: 0, y: 4, scale: 0.9 }"
          :transition="{ duration: 0.15 }"
        >{{ fmt(modelValue) }}{{ unit ? ` ${unit}` : '' }}</motion.div>
      </AnimatePresence>
    </div>
  </div>
</template>
