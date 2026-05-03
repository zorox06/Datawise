"use client"

import { useEffect, useRef } from "react"

/**
 * Ambient animated background that mirrors the landing page aesthetic.
 * Pure canvas — particles drift slowly with a subtle pink glow.
 */
export function AmbientScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId = 0
    let width = 0
    let height = 0

    const setSize = () => {
      const dpr = window.devicePixelRatio || 1
      width = canvas.offsetWidth
      height = canvas.offsetHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)
    }

    setSize()
    window.addEventListener("resize", setSize)

    // Particles
    const particles = Array.from({ length: 60 }, (_, i) => ({
      x: ((i * 9301 + 49297) % 233280) / 233280,
      y: ((i * 7919 + 31337) % 233280) / 233280,
      vx: (((i * 1117) % 100) - 50) / 50000,
      vy: (((i * 2207) % 100) - 50) / 50000,
      size: 0.5 + ((i * 53) % 100) / 100,
      hue: 320 + ((i * 7) % 30),
    }))

    let time = 0

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      // Soft gradient backdrop
      const gradient = ctx.createRadialGradient(
        width * 0.7,
        height * 0.3,
        0,
        width * 0.7,
        height * 0.3,
        Math.max(width, height) * 0.6,
      )
      gradient.addColorStop(0, "rgba(236, 168, 214, 0.04)")
      gradient.addColorStop(0.5, "rgba(236, 168, 214, 0.01)")
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      // Particles
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > 1) p.vx *= -1
        if (p.y < 0 || p.y > 1) p.vy *= -1

        const x = p.x * width
        const y = p.y * height
        const pulse = Math.sin(time * 0.001 + p.x * 10) * 0.3 + 0.7

        ctx.beginPath()
        ctx.arc(x, y, p.size * pulse, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue}, 70%, 75%, ${0.15 * pulse})`
        ctx.fill()
      })

      time += 16
      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", setSize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-60"
      aria-hidden="true"
    />
  )
}
