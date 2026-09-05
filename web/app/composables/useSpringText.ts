import { useMotionValueEvent, useSpring } from 'motion-v'
import type { Ref } from 'vue'

/**
 * A number that springs toward its source and exposes a formatted string ref, because Vue
 * templates cannot render a MotionValue directly.
 */
export function useSpringText(source: Ref<number> | (() => number), format: (v: number) => string, opts = { stiffness: 380, damping: 36 }) {
  const read = typeof source === 'function' ? source : () => source.value
  const spring = useSpring(read(), opts)
  const text = ref(format(read()))
  watch(read, v => spring.set(v))
  useMotionValueEvent(spring, 'change', v => (text.value = format(v as number)))
  return text
}
