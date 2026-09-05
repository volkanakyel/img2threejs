<script setup lang="ts">
import { AnimatePresence, motion } from 'motion-v'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DEFAULT_GLASS_PARAMS, type GlassParams, type ModelDimensions } from '~/utils/glassScene'
import {
  DEFAULT_TRACE_OPTIONS, loadImage, rasterize, traceImageData,
  type TraceOptions, type TraceResult,
} from '~/utils/trace'

const image = shallowRef<HTMLImageElement | null>(null)
const fileName = ref('')
const trace = shallowRef<TraceResult | null>(null)
const traceOpts = reactive<TraceOptions>({ ...DEFAULT_TRACE_OPTIONS })
const glass = reactive<GlassParams>({ ...DEFAULT_GLASS_PARAMS })
const dims = ref<ModelDimensions | null>(null)
const busy = ref(false)
const error = ref('')
const dragging = ref(false)
const exporting = ref<'' | 'glb' | 'stl' | 'png'>('')
const toast = ref('')
type ViewName = 'angle' | 'front' | 'side' | 'top'
const view = ref<ViewName>('angle')
const viewer = ref<{ exportGLB: () => Promise<void>; exportSTL: () => void; screenshot: () => Promise<void>; frame: () => void; setView: (v: ViewName) => void } | null>(null)

function setView(v: ViewName) {
  view.value = v
  viewer.value?.setView(v)
}

let traceTimer: ReturnType<typeof setTimeout> | undefined
let toastTimer: ReturnType<typeof setTimeout> | undefined

function notify(msg: string) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2200)
}

async function useFile(file: File) {
  error.value = ''
  if (!file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.svg')) {
    error.value = 'Please use a PNG, JPG, WebP or SVG.'
    return
  }
  busy.value = true
  try {
    image.value = await loadImage(file)
    fileName.value = file.name
    traceOpts.mode = 'auto'
    runTrace()
  } catch (e) {
    error.value = (e as Error).message
    busy.value = false
  }
}

function runTrace() {
  if (!image.value) return
  busy.value = true
  requestAnimationFrame(() => {
    try {
      const data = rasterize(image.value!, traceOpts.resolution)
      const result = traceImageData(data, traceOpts)
      error.value = result.polygons.length ? '' : 'No shape found. Try another source mode or threshold.'
      trace.value = result
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      busy.value = false
    }
  })
}

watch(() => ({ ...traceOpts }), () => {
  clearTimeout(traceTimer)
  traceTimer = setTimeout(runTrace, 120)
}, { deep: true })

function clearImage() {
  image.value = null
  trace.value = null
  fileName.value = ''
  dims.value = null
  error.value = ''
}

async function onDrop(e: DragEvent) {
  dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) await useFile(file)
}
function onPick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) useFile(file)
  ;(e.target as HTMLInputElement).value = ''
}
async function onPaste(e: ClipboardEvent) {
  const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'))
  const file = item?.getAsFile()
  if (file) await useFile(file)
}
async function loadSample() {
  const res = await fetch('/samples/rueya.png')
  const blob = await res.blob()
  await useFile(new File([blob], 'rueya.png', { type: 'image/png' }))
}

async function doExport(kind: 'glb' | 'stl' | 'png') {
  if (!viewer.value || exporting.value) return
  exporting.value = kind
  try {
    if (kind === 'glb') await viewer.value.exportGLB()
    else if (kind === 'stl') viewer.value.exportSTL()
    else await viewer.value.screenshot()
    notify(`${kind.toUpperCase()} saved`)
  } catch (e) {
    notify((e as Error).message)
  } finally {
    exporting.value = ''
  }
}

function onKey(e: KeyboardEvent) {
  if ((e.target as HTMLElement)?.tagName === 'INPUT') return
  if (e.key === 'f') viewer.value?.frame()
  if (e.key === '1') setView('angle')
  if (e.key === '2') setView('front')
  if (e.key === '3') setView('side')
  if (e.key === 'r') glass.autoRotate = !glass.autoRotate
}

onMounted(() => {
  window.addEventListener('paste', onPaste)
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  window.removeEventListener('paste', onPaste)
  window.removeEventListener('keydown', onKey)
})

const aspect = computed(() => {
  const t = trace.value
  if (!t) return 1
  return (t.bbox.maxY - t.bbox.minY) / Math.max(t.bbox.maxX - t.bbox.minX, 1e-6)
})
const heightMm = computed(() => glass.widthMm * aspect.value)
function setHeight(v: number) {
  if (v > 0 && aspect.value > 0) glass.widthMm = v / aspect.value
}
</script>

<template>
  <TooltipProvider :delay-duration="300">
    <div class="flex h-full w-full flex-col" @dragover.prevent="dragging = true" @dragleave.prevent="dragging = false" @drop.prevent="onDrop">
      <!-- App bar -->
      <header class="flex h-12 shrink-0 items-center justify-between border-b border-border/70 bg-card px-3">
        <div class="flex items-center gap-2.5">
          <span class="flex size-6 items-center justify-center rounded-md bg-foreground text-background"><Icon name="logo" :size="13" :stroke-width="2" /></span>
          <span class="text-[13.5px] font-semibold tracking-[-0.01em]">Glass Studio</span>
          <span class="mx-1 h-4 w-px bg-border" />
          <span class="flex items-center gap-1.5 text-[12.5px] text-muted-foreground"><Icon name="frame" :size="13" /> {{ fileName || 'Untitled' }}</span>
        </div>
        <div class="flex items-center gap-1">
          <Tooltip><TooltipTrigger as-child><Button variant="ghost" size="sm" :disabled="!trace || !!exporting" class="h-8 text-[12.5px]" @click="doExport('png')"><Icon name="camera" :size="14" /> PNG</Button></TooltipTrigger><TooltipContent class="text-[11.5px]">Render the current view at 2×</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger as-child><Button variant="ghost" size="sm" :disabled="!trace || !!exporting" class="h-8 text-[12.5px]" @click="doExport('stl')"><Icon name="layers" :size="14" /> STL</Button></TooltipTrigger><TooltipContent class="text-[11.5px]">Binary STL in millimetres</TooltipContent></Tooltip>
          <Button size="sm" :disabled="!trace || !!exporting" class="ml-1 h-8 rounded-md text-[12.5px]" @click="doExport('glb')"><Icon name="download" :size="14" /> Export GLB</Button>
        </div>
      </header>

      <div class="flex min-h-0 flex-1 max-[860px]:flex-col-reverse">
        <ControlPanel
          :trace="trace" :trace-opts="traceOpts" :glass="glass" :height-mm="heightMm"
          :file-name="fileName" :busy="busy" :error="error"
          @pick="onPick" @sample="loadSample" @clear="clearImage" @set-height="setHeight"
        />

        <main class="relative min-w-0 flex-1">
          <GlassViewer ref="viewer" :trace="trace" :params="glass" @dimensions="dims = $event" />

          <!-- Floating view dock -->
          <div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-border/70 bg-card/90 p-1 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)] backdrop-blur">
            <div class="flex rounded-lg bg-black/[0.05] p-0.5">
              <button
                v-for="v in (['angle', 'front', 'side', 'top'] as const)" :key="v"
                class="h-7 rounded-md px-3 text-[12px] font-medium capitalize transition-colors disabled:opacity-40"
                :class="view === v ? 'bg-card text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.05)]' : 'text-muted-foreground hover:text-foreground'"
                :disabled="!trace" @click="setView(v)"
              >{{ v }}</button>
            </div>
            <span class="mx-1 h-5 w-px bg-border" />
            <Tooltip><TooltipTrigger as-child><Button variant="ghost" size="icon" class="size-8" :disabled="!trace" @click="viewer?.frame()"><Icon name="maximize" :size="15" /></Button></TooltipTrigger><TooltipContent class="text-[11.5px]">Fit to view <kbd class="ml-1">F</kbd></TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger as-child><Button variant="ghost" size="icon" class="size-8" :class="{ 'bg-black/[0.06]': glass.autoRotate }" @click="glass.autoRotate = !glass.autoRotate"><Icon name="orbit" :size="15" /></Button></TooltipTrigger><TooltipContent class="text-[11.5px]">Auto rotate <kbd class="ml-1">R</kbd></TooltipContent></Tooltip>
          </div>

          <!-- Dimensions readout -->
          <AnimatePresence>
            <motion.div v-if="dims" key="hud" class="absolute top-4 left-4 flex gap-1" :initial="{ opacity: 0, y: -6 }" :animate="{ opacity: 1, y: 0 }" :exit="{ opacity: 0, y: -6 }">
              <span v-for="c in [['W', dims.widthMm], ['H', dims.heightMm], ['D', dims.depthMm]] as const" :key="c[0]" class="flex h-7 items-center gap-1.5 rounded-md border border-border/70 bg-card/85 px-2.5 font-mono text-[11.5px] tabular-nums backdrop-blur">
                <b class="text-[10px] font-semibold text-muted-foreground">{{ c[0] }}</b>{{ c[1].toFixed(1) }} mm
              </span>
              <span class="flex h-7 items-center rounded-md border border-border/70 bg-card/85 px-2.5 font-mono text-[11.5px] text-muted-foreground backdrop-blur">{{ Math.round(dims.triangles).toLocaleString('en-US') }} tris</span>
            </motion.div>
          </AnimatePresence>

          <!-- Empty state -->
          <div v-if="!image" class="empty-state pointer-events-none absolute inset-0 grid place-items-center p-6">
            <div class="pointer-events-auto max-w-[420px] px-8 text-center">
              <div class="mx-auto mb-5 flex size-12 items-center justify-center rounded-xl bg-card text-foreground shadow-[0_0_0_1px_var(--border),0_8px_20px_-12px_rgba(0,0,0,0.3)]"><Icon name="gem" :size="22" /></div>
              <h1 class="mb-2 text-[20px] font-semibold tracking-[-0.02em]">Turn any logo into glass</h1>
              <p class="mb-5 text-[13px] leading-relaxed text-muted-foreground">Drop a PNG, JPG, WebP or SVG anywhere, paste from the clipboard, or pick a file. You get a true-to-size 3D model you can orbit, restyle and export.</p>
              <div class="flex justify-center gap-2">
                <Button as="label" size="sm" class="h-8 cursor-pointer text-[12.5px]"><Icon name="upload" :size="14" /> Choose image<input type="file" accept="image/*,.svg" hidden @change="onPick"></Button>
                <Button variant="ghost" size="sm" class="h-8 text-[12.5px]" @click="loadSample"><Icon name="sparkle" :size="14" /> Try sample</Button>
              </div>
              <div class="mt-5 flex justify-center gap-4 text-[11.5px] text-muted-foreground">
                <span><kbd class="mr-1">⌘V</kbd>paste</span><span><kbd class="mr-1">F</kbd>fit</span><span><kbd class="mr-1">R</kbd>rotate</span><span><kbd class="mr-1">1–3</kbd>views</span>
              </div>
            </div>
          </div>

          <AnimatePresence>
            <motion.div v-if="dragging" key="drop" class="pointer-events-none absolute inset-3 flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-foreground/40 bg-card/60 text-[15px] font-medium" :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :exit="{ opacity: 0 }">
              <Icon name="upload" :size="18" /> Drop to trace
            </motion.div>
          </AnimatePresence>
          <AnimatePresence>
            <motion.div v-if="toast" key="toast" class="absolute top-4 left-1/2 flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-[12.5px] font-medium text-primary-foreground shadow-md" :initial="{ opacity: 0, y: -8, x: '-50%' }" :animate="{ opacity: 1, y: 0, x: '-50%' }" :exit="{ opacity: 0, y: -8, x: '-50%' }">
              <Icon name="check" :size="14" /> {{ toast }}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  </TooltipProvider>
</template>


<style scoped>
.empty-state { animation: rise 0.4s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
@keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
</style>
