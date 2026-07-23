import type { Directive } from 'vue'

interface RevealOptions {
  delay?: number
  y?: number
}

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const observedEls = new WeakMap<Element, IntersectionObserver>()

export const vReveal: Directive<HTMLElement, RevealOptions | number | undefined> = {
  mounted(el, binding) {
    if (prefersReducedMotion()) return

    const opts: RevealOptions = typeof binding.value === 'number'
      ? { delay: binding.value }
      : (binding.value || {})
    const delay = opts.delay ?? 0
    const y = opts.y ?? 16

    el.style.opacity = '0'
    el.style.transform = `translateY(${y}px)`
    el.style.transition = `opacity var(--duration-slow) var(--ease-premium) ${delay}ms, transform var(--duration-slow) var(--ease-premium) ${delay}ms`
    el.style.willChange = 'opacity, transform'

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
          observer.unobserve(el)
          observedEls.delete(el)
        }
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' })

    observer.observe(el)
    observedEls.set(el, observer)
  },
  unmounted(el) {
    observedEls.get(el)?.unobserve(el)
    observedEls.delete(el)
  }
}
