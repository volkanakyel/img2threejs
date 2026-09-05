<script setup lang="ts">
import { motion } from 'motion-v'
withDefaults(defineProps<{ title: string; hint?: string; resettable?: boolean; index?: number }>(), { index: 0 })
const emit = defineEmits<{ reset: [] }>()
</script>

<template>
  <motion.section
    class="group/section flex flex-col gap-3.5"
    :initial="{ opacity: 0, y: 10 }" :animate="{ opacity: 1, y: 0 }"
    :transition="{ type: 'spring', stiffness: 380, damping: 32, delay: index * 0.05 }"
  >
    <header class="flex h-5 items-center justify-between">
      <span class="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">{{ title }}</span>
      <div class="flex items-center gap-1">
        <span v-if="hint" class="text-[11px] text-muted-foreground/70">{{ hint }}</span>
        <button
          v-if="resettable"
          class="flex size-5 items-center justify-center rounded text-muted-foreground/60 opacity-0 transition hover:bg-black/5 hover:text-foreground group-hover/section:opacity-100"
          title="Reset section" @click="emit('reset')"
        ><Icon name="reset" :size="12" /></button>
      </div>
    </header>
    <slot />
  </motion.section>
</template>
