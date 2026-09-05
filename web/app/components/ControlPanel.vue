<script setup lang="ts">
import { AnimatePresence, motion } from 'motion-v'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DEFAULT_GLASS_PARAMS, type GlassParams } from '~/utils/glassScene'
import { DEFAULT_TRACE_OPTIONS, toSvgPath, type TraceOptions, type TraceResult } from '~/utils/trace'

const props = defineProps<{
  trace: TraceResult | null
  traceOpts: TraceOptions
  glass: GlassParams
  heightMm: number
  fileName: string
  busy: boolean
  error: string
}>()
const emit = defineEmits<{ pick: [Event]; sample: []; clear: []; 'set-height': [number] }>()

const D = DEFAULT_GLASS_PARAMS
const T = DEFAULT_TRACE_OPTIONS
const tab = ref<'shape' | 'material' | 'scene'>('shape')

const svgPath = computed(() => (props.trace ? toSvgPath(props.trace) : ''))
const viewBox = computed(() => {
  const t = props.trace
  if (!t) return '0 0 1 1'
  const pad = Math.max(t.bbox.maxX - t.bbox.minX, t.bbox.maxY - t.bbox.minY) * 0.08
  return `${t.bbox.minX - pad} ${t.bbox.minY - pad} ${t.bbox.maxX - t.bbox.minX + pad * 2} ${t.bbox.maxY - t.bbox.minY + pad * 2}`
})
const isGlass = computed(() => props.glass.finish === 'glass')

function pick<K extends keyof GlassParams>(...keys: K[]) {
  const out: Partial<GlassParams> = {}
  for (const k of keys) out[k] = D[k]
  Object.assign(props.glass, out)
}
const modeLabel: Record<string, string> = { dark: 'dark pixels', light: 'light pixels', alpha: 'alpha' }
const metalSwatches = ['#e4b84a', '#d9a08a', '#f2f3f5', '#d8d9dc', '#c8734a', '#5f636b', '#15161a', '#f4f4f2', '#2c5cff', '#c0392b']
const bgSwatches = ['#fafaf9', '#f4f4f2', '#ffffff', '#ecebe7', '#e6e9f0', '#dfe6f5', '#f3e9e2', '#1c1c1f', '#0b0b0d', '#2b2f3a']
</script>

<template>
  <aside class="flex h-full flex-col border-r border-border/70 bg-card" :style="{ width: 'var(--sidebar-w)' }">
    <!-- Source -->
    <div class="px-4 pt-4 pb-3">
      <label
        class="group relative flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 transition-colors"
        :class="trace ? 'border-border bg-background/60 hover:bg-background' : 'border-dashed border-input hover:border-ring hover:bg-background/60'"
      >
        <input type="file" accept="image/*,.svg" hidden @change="emit('pick', $event)">
        <template v-if="trace">
          <motion.span :key="fileName" class="flex size-11 shrink-0 items-center justify-center rounded-lg bg-card shadow-[0_0_0_1px_var(--border)]" :initial="{ scale: 0.7, opacity: 0, rotate: -6 }" :animate="{ scale: 1, opacity: 1, rotate: 0 }" :transition="{ type: 'spring', stiffness: 380, damping: 24 }">
            <svg class="size-8 text-foreground" :viewBox="viewBox" preserveAspectRatio="xMidYMid meet"><path :d="svgPath" fill="currentColor" fill-rule="evenodd" /></svg>
          </motion.span>
          <div class="min-w-0 flex-1">
            <div class="truncate text-[13px] font-medium" :title="fileName">{{ fileName }}</div>
            <div class="mt-0.5 text-[11.5px] text-muted-foreground">{{ trace.polygons.length }} shape{{ trace.polygons.length === 1 ? '' : 's' }} · {{ trace.vertexCount }} pts · {{ modeLabel[trace.resolvedMode] }}</div>
          </div>
          <button class="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition hover:bg-black/5 hover:text-foreground group-hover:opacity-100" title="Remove" @click.prevent="emit('clear')"><Icon name="x" :size="14" /></button>
        </template>
        <template v-else>
          <span class="flex size-11 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground"><Icon name="imagePlus" :size="18" /></span>
          <div class="min-w-0 flex-1">
            <div class="text-[13px] font-medium">Choose an image</div>
            <div class="mt-0.5 text-[11.5px] text-muted-foreground">PNG, JPG, WebP, SVG · drop or paste</div>
          </div>
        </template>
        <span v-if="busy" class="absolute top-2.5 right-2.5 size-3 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </label>
      <AnimatePresence><motion.p v-if="error" key="err" class="mt-2 flex items-center gap-1.5 px-1 text-[12px] text-destructive" :initial="{ opacity: 0, y: -4 }" :animate="{ opacity: 1, y: 0 }" :exit="{ opacity: 0 }"><Icon name="info" :size="13" /> {{ error }}</motion.p></AnimatePresence>
    </div>

    <Tabs v-model="tab" class="flex min-h-0 flex-1 flex-col gap-0">
      <div class="px-4">
        <TabsList class="grid h-9 w-full grid-cols-3 rounded-lg bg-black/[0.05] p-0.5">
          <TabsTrigger value="shape" class="gap-1.5 rounded-md text-[12px] data-[state=active]:shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.05)]"><Icon name="shapes" :size="13" /> Shape</TabsTrigger>
          <TabsTrigger value="material" class="gap-1.5 rounded-md text-[12px] data-[state=active]:shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.05)]"><Icon name="palette" :size="13" /> Material</TabsTrigger>
          <TabsTrigger value="scene" class="gap-1.5 rounded-md text-[12px] data-[state=active]:shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.05)]"><Icon name="sun" :size="13" /> Scene</TabsTrigger>
        </TabsList>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-4 pt-5 pb-6 [scrollbar-width:thin]">
        <TabsContent value="shape" class="mt-0 flex flex-col gap-7">
          <SectionGroup :index="0" title="Trace" :hint="trace ? `${trace.polygons.length} shapes` : undefined" resettable @reset="Object.assign(traceOpts, T)">
            <div class="seg">
              <button v-for="m in (['auto', 'dark', 'light', 'alpha'] as const)" :key="m" :class="{ on: traceOpts.mode === m }" @click="traceOpts.mode = m">{{ ({ auto: 'Auto', dark: 'Dark', light: 'Light', alpha: 'Alpha' })[m] }}</button>
            </div>
            <SliderField v-model="traceOpts.threshold" label="Threshold" :min="0.1" :max="0.9" :step="0.01" :default-value="T.threshold" />
            <SliderField v-model="traceOpts.simplify" label="Smoothing" :min="0" :max="4" :step="0.1" unit="px" :decimals="1" :default-value="T.simplify" />
            <SliderField v-model="traceOpts.minRegion" label="Ignore specks" :min="0" :max="0.05" :step="0.001" :decimals="3" :default-value="T.minRegion" />
            <div class="row"><span>Fill holes</span><Switch class="scale-90" :model-value="traceOpts.fillHoles" @update:model-value="v => (traceOpts.fillHoles = v)" /></div>
            <div class="row">
              <span>Resolution</span>
              <div class="seg w-[156px]"><button v-for="r in [512, 1024, 2048]" :key="r" class="font-mono" :class="{ on: traceOpts.resolution === r }" @click="traceOpts.resolution = r">{{ r }}</button></div>
            </div>
          </SectionGroup>

          <SectionGroup :index="1" title="Dimensions" hint="Height follows aspect" resettable @reset="pick('widthMm', 'depthMm', 'bevelMm', 'bevelSegments')">
            <div class="grid grid-cols-3 gap-1.5">
              <label v-for="d in ([['W', 'widthMm'], ['H', 'height'], ['D', 'depthMm']] as const)" :key="d[0]" class="dim">
                <span>{{ d[0] }}</span>
                <input v-if="d[1] === 'height'" :value="+heightMm.toFixed(1)" type="number" min="1" step="1" @change="emit('set-height', +($event.target as HTMLInputElement).value)">
                <input v-else v-model.number="glass[d[1]]" type="number" :min="d[1] === 'depthMm' ? 0.5 : 1" :step="d[1] === 'depthMm' ? 0.5 : 1">
                <em>mm</em>
              </label>
            </div>
            <SliderField v-model="glass.bevelMm" label="Edge radius" :min="0" :max="Math.max(0.5, glass.depthMm / 2)" :step="0.1" unit="mm" :decimals="1" :default-value="D.bevelMm" />
            <SliderField v-model="glass.bevelSegments" label="Edge smoothness" :min="1" :max="14" :step="1" :decimals="0" :default-value="D.bevelSegments" />
          </SectionGroup>
        </TabsContent>

        <TabsContent value="material" class="mt-0 flex flex-col gap-7">
          <SectionGroup :index="0" title="Finish">
            <MaterialPicker :glass="glass" />
          </SectionGroup>
          <SectionGroup :index="1" :title="isGlass ? 'Optics' : 'Surface'">
            <template v-if="isGlass">
              <SliderField v-model="glass.ior" label="Refraction" :min="1" :max="2.33" :step="0.01" :default-value="D.ior" />
              <SliderField v-model="glass.dispersion" label="Dispersion" :min="0" :max="0.3" :step="0.005" :decimals="3" :default-value="D.dispersion" />
              <SliderField v-model="glass.clarity" label="Clarity" :min="0.3" :max="1" :step="0.01" :default-value="D.clarity" />
              <SliderField v-model="glass.roughness" label="Frost" :min="0" :max="0.6" :step="0.01" :default-value="D.roughness" />
              <SliderField v-model="glass.blur" label="Blur" :min="0" :max="1" :step="0.01" :default-value="D.blur" />
            </template>
            <template v-else>
              <ColorField v-model="glass.tint" label="Color" :swatches="metalSwatches" />
              <SliderField v-model="glass.metalness" label="Metalness" :min="0" :max="1" :step="0.01" :default-value="1" />
              <SliderField v-model="glass.roughness" label="Roughness" :min="0" :max="1" :step="0.01" :default-value="0.22" />
              <SliderField v-model="glass.clearcoat" label="Lacquer" :min="0" :max="1" :step="0.01" :default-value="0" />
            </template>
          </SectionGroup>
          <SectionGroup :index="2" v-if="isGlass" title="Edges & tint">
            <SliderField v-model="glass.tir" label="Edge darkening" :min="0" :max="1" :step="0.01" :default-value="D.tir" />
            <SliderField v-model="glass.edgeChroma" label="Edge chroma" :min="0" :max="1" :step="0.01" :default-value="D.edgeChroma" />
            <SliderField v-model="glass.clearcoat" label="Polish" :min="0" :max="1" :step="0.01" :default-value="D.clearcoat" />
            <ColorField v-model="glass.tint" label="Tint" />
            <SliderField v-model="glass.attenuationMm" label="Tint depth" :min="2" :max="600" :step="1" unit="mm" :decimals="0" :default-value="D.attenuationMm" />
          </SectionGroup>
        </TabsContent>

        <TabsContent value="scene" class="mt-0 flex flex-col gap-7">
          <SectionGroup :index="0" title="Backdrop" resettable @reset="pick('background', 'shadow', 'vignette')">
            <ColorField v-model="glass.background" label="Background" :swatches="bgSwatches" />
            <SliderField v-model="glass.shadow" label="Shadow" :min="0" :max="1" :step="0.01" :default-value="D.shadow" />
            <SliderField v-model="glass.vignette" label="Vignette" :min="0" :max="0.6" :step="0.01" :default-value="D.vignette" />
          </SectionGroup>
          <SectionGroup :index="1" title="Light & camera" resettable @reset="pick('envIntensity', 'exposure', 'fov')">
            <SliderField v-model="glass.envIntensity" label="Studio light" :min="0" :max="3" :step="0.05" :default-value="D.envIntensity" />
            <SliderField v-model="glass.exposure" label="Exposure" :min="0.4" :max="2" :step="0.01" :default-value="D.exposure" />
            <SliderField v-model="glass.fov" label="Lens" :min="15" :max="60" :step="1" :decimals="0" unit="°" :default-value="D.fov" />
          </SectionGroup>
          <SectionGroup :index="2" title="Motion" resettable @reset="pick('autoRotate', 'rotateSpeed')">
            <div class="row"><span>Auto rotate</span><Switch class="scale-90" :model-value="glass.autoRotate" @update:model-value="v => (glass.autoRotate = v)" /></div>
            <SliderField v-if="glass.autoRotate" v-model="glass.rotateSpeed" label="Speed" :min="0.2" :max="4" :step="0.1" :decimals="1" :default-value="D.rotateSpeed" />
          </SectionGroup>
        </TabsContent>
      </div>
    </Tabs>

    <footer class="flex items-center justify-between border-t border-border/70 px-4 py-2.5">
      <button class="flex h-7 items-center gap-2 rounded-md px-2 text-[12px] text-muted-foreground transition hover:bg-black/5 hover:text-foreground" @click="emit('sample')"><Icon name="sparkle" :size="13" /> Sample logo</button>
      <span class="text-[11px] text-muted-foreground/70">Vitrum · built on img2threejs</span>
    </footer>
  </aside>
</template>

<style scoped>
@reference "~/assets/main.css";

.row { @apply flex h-7 items-center justify-between; }
.row > span { @apply text-[12.5px] text-foreground/85; }

.seg { @apply flex rounded-md p-0.5; background: rgba(0, 0, 0, 0.05); }
.seg button { @apply h-6 flex-1 rounded-[5px] px-2 text-[12px] font-medium text-muted-foreground transition-colors; }
.seg button:hover { color: var(--foreground); }
.seg button.on { @apply bg-card text-foreground; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05); }

.dim { @apply flex h-8 items-center gap-1.5 rounded-md border border-input bg-card px-2 shadow-xs; }
.dim:focus-within { @apply border-ring ring-2 ring-ring/30; }
.dim > span { @apply text-[10.5px] font-semibold text-muted-foreground; }
.dim input { @apply w-full min-w-0 bg-transparent text-right font-mono text-[12px] outline-none; }
.dim em { @apply text-[10px] not-italic text-muted-foreground; }
</style>
