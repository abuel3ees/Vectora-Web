import { useEffect, useRef } from "react"

interface Node {
  x: number
  y: number
  id: number
}

interface Route {
  nodes: number[]
  color: string
}

export function RouteVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
return
}

    const ctx = canvas.getContext("2d")

    if (!ctx) {
return
}

    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()

      if (rect) {
        canvas.width = rect.width
        canvas.height = rect.height
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Generate nodes in a more spread out pattern
    const nodes: Node[] = []
    const nodeCount = 15
    const padding = 50
    const width = canvas.width - padding * 2
    const height = canvas.height - padding * 2

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: padding + Math.random() * width,
        y: padding + Math.random() * height,
        id: i,
      })
    }

    // Define routes with different colors
    const routes: Route[] = [
      { nodes: [0, 3, 7, 11, 14], color: "oklch(0.72 0.18 35)" }, // Primary coral
      { nodes: [1, 4, 8, 12], color: "oklch(0.65 0.15 200)" }, // Teal
      { nodes: [2, 5, 9, 13], color: "oklch(0.75 0.12 80)" }, // Gold
      { nodes: [6, 10], color: "oklch(0.55 0.18 180)" }, // Cyan
    ]

    let animationProgress = 0
    let animationId: number

    const drawCurvedPath = (
      from: Node,
      to: Node,
      color: string,
      progress: number
    ) => {
      const midX = (from.x + to.x) / 2
      const midY = (from.y + to.y) / 2
      const dx = to.x - from.x
      const dy = to.y - from.y
      const offsetX = -dy * 0.2
      const offsetY = dx * 0.2
      const controlX = midX + offsetX
      const controlY = midY + offsetY

      ctx.beginPath()
      ctx.moveTo(from.x, from.y)

      // Draw partial path based on progress
      const steps = Math.floor(progress * 20)

      for (let i = 1; i <= steps; i++) {
        const t = i / 20
        const x =
          (1 - t) * (1 - t) * from.x +
          2 * (1 - t) * t * controlX +
          t * t * to.x
        const y =
          (1 - t) * (1 - t) * from.y +
          2 * (1 - t) * t * controlY +
          t * t * to.y
        ctx.lineTo(x, y)
      }

      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw moving point
      if (progress > 0 && progress < 1) {
        const t = progress
        const px =
          (1 - t) * (1 - t) * from.x +
          2 * (1 - t) * t * controlX +
          t * t * to.x
        const py =
          (1 - t) * (1 - t) * from.y +
          2 * (1 - t) * t * controlY +
          t * t * to.y

        ctx.beginPath()
        ctx.arc(px, py, 4, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw grid lines
      ctx.strokeStyle = "oklch(0.25 0.02 250 / 0.3)"
      ctx.lineWidth = 1

      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Draw routes
      routes.forEach((route, routeIndex) => {
        const routeDelay = routeIndex * 0.2
        const adjustedProgress = Math.max(0, animationProgress - routeDelay)

        for (let i = 0; i < route.nodes.length - 1; i++) {
          const segmentStart = i / (route.nodes.length - 1)
          const segmentEnd = (i + 1) / (route.nodes.length - 1)
          const segmentProgress = Math.min(
            1,
            Math.max(0, (adjustedProgress - segmentStart) / (segmentEnd - segmentStart))
          )

          if (segmentProgress > 0) {
            const fromNode = nodes[route.nodes[i]]
            const toNode = nodes[route.nodes[i + 1]]
            drawCurvedPath(fromNode, toNode, route.color, segmentProgress)
          }
        }
      })

      // Draw nodes
      nodes.forEach((node, index) => {
        const isDepot = index === 0
        const nodeRadius = isDepot ? 10 : 6

        // Node glow
        const gradient = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          nodeRadius * 2
        )
        gradient.addColorStop(0, isDepot ? "oklch(0.72 0.18 35 / 0.5)" : "oklch(0.98 0 0 / 0.3)")
        gradient.addColorStop(1, "transparent")
        ctx.beginPath()
        ctx.arc(node.x, node.y, nodeRadius * 2, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Node circle
        ctx.beginPath()
        ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2)
        ctx.fillStyle = isDepot ? "oklch(0.72 0.18 35)" : "oklch(0.98 0 0)"
        ctx.fill()

        // Node border
        ctx.strokeStyle = isDepot ? "oklch(0.72 0.18 35)" : "oklch(0.98 0 0 / 0.5)"
        ctx.lineWidth = 2
        ctx.stroke()
      })

      animationProgress += 0.003

      if (animationProgress > 2) {
        animationProgress = 0
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      style={{ display: "block" }}
    />
  )
}
