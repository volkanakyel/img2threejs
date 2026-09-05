<script setup lang="ts">
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
const text = computed(() => props.modelValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: props.decimals }))
const draft = ref('')
const editing = ref(false)

function set(v: number) {
  if (Number.isNaN(v)) return
  emit('update:modelValue', Math.min(props.max, Math.max(props.min, v)))
}
function focus(e: FocusEvent) {
  editing.value = true
  draft.value = text.value
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
</script>

<template>
  <div class="flex flex-col gap-2" :title="hint">
    <div class="flex items-center justify-between">
      <span class="flex items-center gap-1.5 text-[12.5px] text-foreground/85">
        {{ label }}
        <button
          v-if="changed"
          class="text-muted-foreground/70 transition hover:text-foreground"
          title="Reset to default" @click="set(defaultValue!)"
        ><Icon name="reset" :size="11" /></button>
      </span>
      <label class="flex h-6 items-center rounded-md border border-input bg-card pr-1.5 pl-2 shadow-xs transition focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
        <input
          class="w-11 bg-transparent text-right font-mono text-[11.5px] tabular-nums outline-none"
          :value="editing ? draft : text"
          @focus="focus" @input="draft = ($event.target as HTMLInputElement).value"
          @blur="commit" @keydown.enter="($event.target as HTMLInputElement).blur()" @wheel="onWheel"
        >
        <span v-if="unit" class="ml-1 text-[10px] text-muted-foreground">{{ unit }}</span>
      </label>
    </div>
    <Slider
      v-model="arr" :min="min" :max="max" :step="step"
      class="h-4 [&_[data-slot=slider-range]]:bg-foreground [&_[data-slot=slider-thumb]]:size-3.5 [&_[data-slot=slider-thumb]]:border-foreground [&_[data-slot=slider-thumb]]:ring-foreground/15 [&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-track]]:bg-foreground/10"
    />
  </div>
</template>
