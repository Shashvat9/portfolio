/**
 * One shared scroll driver for the whole page.
 *
 * Every scroll-linked effect registers here instead of adding its own
 * listener. Per frame we do all `getBoundingClientRect()` reads first, then
 * all writes — so the browser never has to re-flow mid-loop. Writes go to a
 * CSS custom property, which means the actual animation is done by CSS off
 * `--scrub`, not by JS setting styles per element per frame.
 *
 * Under `prefers-reduced-motion` nothing is registered at all: `--scrub` keeps
 * its resolved value of 1, so scrubbed sequences render in their final,
 * fully-assembled state with no motion whatsoever.
 */

interface Target {
  el: HTMLElement
  /** Extra travel past the element before progress reaches 1, in viewport heights. */
  overshoot: number
}

let targets: Target[] = []
let listening = false
let frame = 0

function measure() {
  frame = 0
  const vh = window.innerHeight || 1

  // ── read phase ──
  const progress = targets.map(({ el, overshoot }) => {
    const r = el.getBoundingClientRect()
    const travel = Math.max(1, r.height + vh * overshoot - vh)
    return Math.min(1, Math.max(0, (vh - r.top) / travel))
  })

  // ── write phase ──
  for (let i = 0; i < targets.length; i++) {
    targets[i]!.el.style.setProperty('--scrub', progress[i]!.toFixed(4))
  }
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(measure)
}

function ensureListening() {
  if (listening) return
  listening = true
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule, { passive: true })
}

function teardown() {
  if (!listening || targets.length) return
  listening = false
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', schedule)
  if (frame) cancelAnimationFrame(frame)
  frame = 0
}

/**
 * Drives `--scrub` (0→1) on `el` as it passes through the viewport.
 * `overshoot` lengthens the timeline so a sticky sequence has room to play.
 */
export function useScrollScrub(el: Ref<HTMLElement | null>, overshoot = 0) {
  const reduced = useReducedMotion()

  function attach() {
    if (!el.value || reduced.value) return
    if (targets.some((t) => t.el === el.value)) return
    targets.push({ el: el.value, overshoot })
    ensureListening()
    schedule()
  }

  function detach() {
    targets = targets.filter((t) => t.el !== el.value)
    teardown()
  }

  onMounted(() => {
    // Wait for reduced-motion to resolve on the client before registering.
    nextTick(attach)
  })
  watch(reduced, (isReduced) => {
    if (isReduced) {
      detach()
      el.value?.style.removeProperty('--scrub')
    } else {
      attach()
    }
  })
  onUnmounted(detach)
}

/**
 * Marks which project section is currently being read. IntersectionObserver
 * only — no scroll maths, no per-frame work.
 */
export function useSectionWatcher(el: Ref<HTMLElement | null>, index: number) {
  const { activeIndex } = useSystemState()
  let observer: IntersectionObserver | undefined

  onMounted(() => {
    if (!el.value || typeof IntersectionObserver === 'undefined') return
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) activeIndex.value = index
        else if (activeIndex.value === index) activeIndex.value = null
      },
      // Band across the middle of the viewport: a section is "being read"
      // when it occupies the reader's focal area, not merely when it appears.
      { rootMargin: '-35% 0px -45% 0px', threshold: 0 },
    )
    observer.observe(el.value)
  })

  onUnmounted(() => observer?.disconnect())
}

/** Flags when the hero has scrolled away, so the mini graph can take over. */
export function useHeroSentinel(el: Ref<HTMLElement | null>) {
  const { heroPassed } = useSystemState()
  let observer: IntersectionObserver | undefined

  onMounted(() => {
    if (!el.value || typeof IntersectionObserver === 'undefined') return
    observer = new IntersectionObserver(
      ([entry]) => { heroPassed.value = !entry?.isIntersecting },
      { threshold: 0 },
    )
    observer.observe(el.value)
  })

  onUnmounted(() => observer?.disconnect())
}

/**
 * True while `el` is nowhere near the viewport.
 *
 * Every idle animation on this site is a stroke-dashoffset loop, which the
 * compositor cannot handle on its own — each animating path repaints every
 * frame. Stage 8 already pauses the hero graph for exactly this reason; with
 * four per-project visuals and a timeline added, leaving them all running at
 * once is what turns "alive" into main-thread cost. Anything off-screen is
 * paused, so the page only ever animates what someone is actually looking at.
 *
 * The margin keeps a screen of slack either side, so a visual is already
 * running by the time it scrolls into view rather than starting visibly late.
 */
export function useOffscreenPause(el: Ref<HTMLElement | null>) {
  // SSR and the pre-hydration paint must not pause anything, or a visual could
  // render frozen for a viewer whose browser never runs the observer.
  const paused = ref(false)
  let observer: IntersectionObserver | undefined

  onMounted(() => {
    if (!el.value || typeof IntersectionObserver === 'undefined') return
    observer = new IntersectionObserver(
      ([entry]) => { paused.value = !entry?.isIntersecting },
      { rootMargin: '100% 0px 100% 0px', threshold: 0 },
    )
    observer.observe(el.value)
  })

  onUnmounted(() => observer?.disconnect())
  return paused
}
