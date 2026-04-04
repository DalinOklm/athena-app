"use client"

import { MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Checkpoint {
  address: string
  arrivalTime: string
}

interface RouteAssignmentCellProps {
  route: {
    checkpoints: Checkpoint[]
  }
  className?: string
}

export function RouteAssignmentCell({ route, className }: RouteAssignmentCellProps) {
  const checkpointCount = route.checkpoints.length

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge variant="secondary" className="gap-1">
        <MapPin className="h-3 w-3" />
        Route
      </Badge>
      <span className="text-xs text-muted-foreground">
        {checkpointCount} checkpoint{checkpointCount !== 1 ? "s" : ""}
      </span>
    </div>
  )
}
