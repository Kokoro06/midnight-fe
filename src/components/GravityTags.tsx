import { useEffect, useRef } from 'react'
import Matter from 'matter-js'

interface GravityTagsProps {
  tags: string[]
  onTagClick: (tag: string) => void
  selectedTags: string[]
  maxTags: number
}

interface TagItem {
  body: Matter.Body
  el: HTMLButtonElement
  tag: string
  w: number
  h: number
}

export default function GravityTags({ tags, onTagClick, selectedTags, maxTags }: GravityTagsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<TagItem[]>([])
  const onTagClickRef = useRef(onTagClick)
  useEffect(() => { onTagClickRef.current = onTagClick }, [onTagClick])

  useEffect(() => {
    const maxed = selectedTags.length >= maxTags
    for (const { el, tag } of itemsRef.current) {
      const isSelected = selectedTags.includes(tag)
      el.classList.toggle('gravity-tag--selected', isSelected)
      el.classList.toggle('gravity-tag--dimmed', maxed && !isSelected)
    }
  }, [selectedTags, maxTags])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const W = container.offsetWidth
    const H = container.offsetHeight

    // Engine
    const engine = Matter.Engine.create({ gravity: { x: 0, y: 1.4 } })
    const world = engine.world

    // Walls: floor, left, right
    const wallOpts = { isStatic: true, friction: 0.5, restitution: 0.25 }
    Matter.Composite.add(world, [
      Matter.Bodies.rectangle(W / 2, H + 30, W + 60, 60, wallOpts),
      Matter.Bodies.rectangle(-30, H / 2, 60, H * 4, wallOpts),
      Matter.Bodies.rectangle(W + 30, H / 2, 60, H * 4, wallOpts),
    ])

    // Measure tag sizes with a hidden probe element
    const probe = document.createElement('button')
    probe.className = 'tag'
    probe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;animation:none;pointer-events:none;visibility:hidden;'
    document.body.appendChild(probe)

    itemsRef.current = []
    const items = itemsRef.current
    const timeoutIds: ReturnType<typeof setTimeout>[] = []

    // Intro overlay fades out at 1700ms — start cascade right after
    const BASE_DELAY = 1750
    const INTERVAL = 120  // ms between each tag drop

    tags.forEach((tag, i) => {
      probe.textContent = tag
      const w = probe.offsetWidth
      const h = probe.offsetHeight

      // All tags start just above the container (hidden by overflow:hidden)
      const x = w / 2 + 12 + Math.random() * Math.max(W - w - 24, 0)
      const y = -h / 2 - 10

      const body = Matter.Bodies.rectangle(x, y, w, h, {
        restitution: 0.28,
        friction: 0.35,
        frictionAir: 0.025,
        angle: (Math.random() - 0.5) * 0.3,
      })

      // Drop one by one after intro fades
      const tid = setTimeout(() => {
        Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 1.5, y: 0 })
        Matter.Composite.add(world, body)
      }, BASE_DELAY + i * INTERVAL)
      timeoutIds.push(tid)

      const btn = document.createElement('button')
      btn.className = 'tag gravity-tag'
      btn.textContent = tag
      container.appendChild(btn)

      // Click vs drag detection
      let downX = 0, downY = 0
      btn.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY })
      btn.addEventListener('pointerup', (e) => {
        if (Math.hypot(e.clientX - downX, e.clientY - downY) < 8) {
          onTagClickRef.current(tag)
        }
      })

      items.push({ body, el: btn, tag, w, h })
      // body is NOT in world yet — added via setTimeout above
    })

    document.body.removeChild(probe)

    // Mouse constraint for interactive dragging
    const mouse = Matter.Mouse.create(container)
    const mc = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.28, angularStiffness: 0.06, render: { visible: false } } as Matter.IConstraintDefinition,
    })
    Matter.Composite.add(world, mc)

    // Sync DOM elements to physics bodies
    let raf = 0
    let last = performance.now()

    const loop = (now: number) => {
      Matter.Engine.update(engine, Math.min(now - last, 33))
      last = now
      for (const { body, el, w, h } of items) {
        const { x, y } = body.position
        el.style.transform = `translate(${(x - w / 2).toFixed(1)}px,${(y - h / 2).toFixed(1)}px) rotate(${body.angle.toFixed(4)}rad)`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      timeoutIds.forEach(clearTimeout)
      items.forEach(({ el }) => { if (container.contains(el)) container.removeChild(el) })
      itemsRef.current = []
      Matter.World.clear(world, false)
      Matter.Engine.clear(engine)
    }
  }, [tags])

  return (
    <div
      ref={containerRef}
      className="gravity-tags-container"
    />
  )
}
