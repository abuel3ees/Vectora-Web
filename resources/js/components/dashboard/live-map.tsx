import { Layers } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface Vehicle {
  id: number
  x: number
  y: number
  targetX: number
  targetY: number
  status: "active" | "idle" | "returning"
  route: { x: number; y: number }[]
  routeIndex: number
}

export function LiveMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [, setVehicles] = useState<Vehicle[]>([])

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

    // Initialize vehicles with routes
    const initialVehicles: Vehicle[] = Array.from({ length: 8 }, (_, i) => {
      const route = generateRoute(canvas.width, canvas.height)

      return {
        id: i,
        x: route[0].x,
        y: route[0].y,
        targetX: route[1].x,
        targetY: route[1].y,
        status: i < 6 ? "active" : i < 7 ? "returning" : "idle",
        route,
        routeIndex: 0,
      }
    })

    setVehicles(initialVehicles)

    function generateRoute(width: number, height: number) {
      const points = []
      const numPoints = 4 + Math.floor(Math.random() * 3)
      const padding = 50

      for (let i = 0; i < numPoints; i++) {
        points.push({
          x: padding + Math.random() * (width - padding * 2),
          y: padding + Math.random() * (height - padding * 2),
        })
      }

      return points
    }

    let animationId: number

    const animate = () => {
      if (!canvas || !ctx) {
return
}

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw grid
      ctx.strokeStyle = "oklch(0.25 0.02 250 / 0.2)"
      ctx.lineWidth = 1
      const gridSize = 40

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Update and draw vehicles
      setVehicles((prevVehicles) =>
        prevVehicles.map((vehicle) => {
          if (vehicle.status === "idle") {
            // Draw idle vehicle
            drawVehicle(ctx, vehicle)

            return vehicle
          }

          // Move towards target
          const dx = vehicle.targetX - vehicle.x
          const dy = vehicle.targetY - vehicle.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 2) {
            // Reached target, move to next point in route
            const nextIndex = (vehicle.routeIndex + 1) % vehicle.route.length

            return {
              ...vehicle,
              routeIndex: nextIndex,
              targetX: vehicle.route[nextIndex].x,
              targetY: vehicle.route[nextIndex].y,
            }
          }

          const speed = 0.5
          const newX = vehicle.x + (dx / dist) * speed
          const newY = vehicle.y + (dy / dist) * speed

          const updatedVehicle = { ...vehicle, x: newX, y: newY }
          
          // Draw route trail
          drawRouteTrail(ctx, vehicle)
          // Draw vehicle
          drawVehicle(ctx, updatedVehicle)

          return updatedVehicle
        })
      )

      animationId = requestAnimationFrame(animate)
    }

    function drawRouteTrail(ctx: CanvasRenderingContext2D, vehicle: Vehicle) {
      const route = vehicle.route
      ctx.beginPath()
      ctx.moveTo(route[0].x, route[0].y)
      
      for (let i = 1; i < route.length; i++) {
        ctx.lineTo(route[i].x, route[i].y)
      }
      
      ctx.strokeStyle =
        vehicle.status === "active"
          ? "oklch(0.72 0.18 35 / 0.3)"
          : vehicle.status === "returning"
          ? "oklch(0.65 0.15 200 / 0.3)"
          : "oklch(0.5 0 0 / 0.2)"
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.stroke()
      ctx.setLineDash([])

      // Draw stops
      route.forEach((point, i) => {
        ctx.beginPath()
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2)
        ctx.fillStyle = i <= vehicle.routeIndex ? "oklch(0.72 0.18 35)" : "oklch(0.4 0 0)"
        ctx.fill()
      })
    }

    function drawVehicle(ctx: CanvasRenderingContext2D, vehicle: Vehicle) {
      const color =
        vehicle.status === "active"
          ? "oklch(0.72 0.18 35)"
          : vehicle.status === "returning"
          ? "oklch(0.65 0.15 200)"
          : "oklch(0.5 0 0)"

      // Glow
      const gradient = ctx.createRadialGradient(
        vehicle.x,
        vehicle.y,
        0,
        vehicle.x,
        vehicle.y,
        20
      )
      gradient.addColorStop(0, color.replace(")", " / 0.4)").replace("oklch", "oklch"))
      gradient.addColorStop(1, "transparent")
      ctx.beginPath()
      ctx.arc(vehicle.x, vehicle.y, 20, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      // Vehicle dot
      ctx.beginPath()
      ctx.arc(vehicle.x, vehicle.y, 6, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = "oklch(0.98 0 0)"
      ctx.lineWidth = 2
      ctx.stroke()
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <div className="h-full bg-background">
      <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
        <div>
          <div className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground mb-1">Live</div>
          <h3 className="font-display text-base tracking-tight text-foreground">Fleet in motion</h3>
        </div>
        <button className="p-1.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
          <Layers className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="relative h-80">
        <canvas ref={canvasRef} className="h-full w-full" />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex gap-5 border border-border/40 bg-background/80 backdrop-blur-sm px-3 py-2">
          {[
            { label: 'Active',    color: 'bg-primary' },
            { label: 'Returning', color: 'bg-[oklch(0.65_0.15_200)]' },
            { label: 'Idle',      color: 'bg-muted-foreground/40' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
              <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground/60">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
