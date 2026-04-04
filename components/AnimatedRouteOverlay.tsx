"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface Point {
  lat: number
  lng: number
}

interface AnimatedRouteOverlayProps {
  path: Point[]
  className?: string
  width?: number
  height?: number
}

export function AnimatedRouteOverlay({
  path,
  className,
  width = 400,
  height = 300,
}: AnimatedRouteOverlayProps) {
  const [arrowPosition, setArrowPosition] = useState(0)

  // Convert lat/lng to SVG coordinates
  const normalizePoints = (points: Point[]) => {
    if (points.length === 0) return []

    const padding = 40
    const lats = points.map((p) => p.lat)
    const lngs = points.map((p) => p.lng)

    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)

    const latRange = maxLat - minLat || 1
    const lngRange = maxLng - minLng || 1

    return points.map((p) => ({
      x: padding + ((p.lng - minLng) / lngRange) * (width - padding * 2),
      y: padding + ((maxLat - p.lat) / latRange) * (height - padding * 2),
    }))
  }

  const svgPoints = normalizePoints(path)

  // Create path string for SVG
  const pathString =
    svgPoints.length > 0
      ? svgPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
      : ""

  // Calculate total path length for animation
  const calculatePathLength = () => {
    let length = 0
    for (let i = 1; i < svgPoints.length; i++) {
      const dx = svgPoints[i].x - svgPoints[i - 1].x
      const dy = svgPoints[i].y - svgPoints[i - 1].y
      length += Math.sqrt(dx * dx + dy * dy)
    }
    return length
  }

  const totalLength = calculatePathLength()

  // Get point and angle at a specific distance along the path
  const getPointAtDistance = (distance: number) => {
    let remaining = distance
    for (let i = 1; i < svgPoints.length; i++) {
      const dx = svgPoints[i].x - svgPoints[i - 1].x
      const dy = svgPoints[i].y - svgPoints[i - 1].y
      const segmentLength = Math.sqrt(dx * dx + dy * dy)

      if (remaining <= segmentLength) {
        const ratio = remaining / segmentLength
        return {
          x: svgPoints[i - 1].x + dx * ratio,
          y: svgPoints[i - 1].y + dy * ratio,
          angle: Math.atan2(dy, dx) * (180 / Math.PI),
        }
      }
      remaining -= segmentLength
    }
    const lastIdx = svgPoints.length - 1
    const dx = svgPoints[lastIdx].x - svgPoints[lastIdx - 1].x
    const dy = svgPoints[lastIdx].y - svgPoints[lastIdx - 1].y
    return {
      x: svgPoints[lastIdx].x,
      y: svgPoints[lastIdx].y,
      angle: Math.atan2(dy, dx) * (180 / Math.PI),
    }
  }

  // Animation loop
  useEffect(() => {
    if (totalLength === 0) return

    const duration = 32000
    console.log("🐢 Animation speed adjusted")
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = (elapsed % duration) / duration
      setArrowPosition(progress * totalLength)
    }

    const interval = setInterval(animate, 16) // ~60fps
    return () => clearInterval(interval)
  }, [totalLength])

  if (path.length < 2) return null

  const progressLength = Math.max(0, Math.min(arrowPosition, totalLength))
  const arrowPoint = getPointAtDistance(progressLength)

  return (
    <svg
      className={cn("pointer-events-none", className)}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Glow filter */}
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" className="fill-primary" />
        </marker>
      </defs>

      {/* Background dashed path */}
      <path
        d={pathString}
        fill="none"
        className="stroke-primary/30"
        strokeWidth="3"
        strokeDasharray="8 6"
        strokeLinecap="round"
      />

      {/* Animated solid path segment (trail effect) */}
      <path
        d={pathString}
        fill="none"
        className="stroke-primary"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${progressLength} ${Math.max(totalLength, 1)}`}
        strokeDashoffset={0}
        filter="url(#glow)"
      />

      {/* Checkpoint markers */}
      {svgPoints.map((point, index) => {
        const isFirst = index === 0
        const isLast = index === svgPoints.length - 1

        return (
          <g key={index}>
            {/* Outer glow ring */}
            <circle
              cx={point.x}
              cy={point.y}
              r="14"
              className={cn(
                "fill-none stroke-2",
                isFirst && "stroke-emerald-500/30",
                isLast && "stroke-rose-500/30",
                !isFirst && !isLast && "stroke-primary/30"
              )}
            />
            {/* Main circle */}
            <circle
              cx={point.x}
              cy={point.y}
              r="10"
              className={cn(
                isFirst && "fill-emerald-500",
                isLast && "fill-rose-500",
                !isFirst && !isLast && "fill-primary"
              )}
            />
            {/* Number */}
            <text
              x={point.x}
              y={point.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-primary-foreground text-xs font-semibold"
            >
              {index + 1}
            </text>
          </g>
        )
      })}

      {/* Animated arrow */}
      <g transform={`translate(${arrowPoint.x}, ${arrowPoint.y}) rotate(${arrowPoint.angle})`}>
        <polygon
          points="-6,-5 6,0 -6,5"
          className="fill-primary"
          filter="url(#glow)"
        />
      </g>
    </svg>
  )
}
