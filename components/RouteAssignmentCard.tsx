"use client"

import { cn } from "@/lib/utils"

interface Checkpoint {
  address: string
  arrivalTime: string
}

interface RouteAssignmentCardProps {
  route: {
    checkpoints: Checkpoint[]
  }
  className?: string
}

export function RouteAssignmentCard({ route, className }: RouteAssignmentCardProps) {
  const { checkpoints } = route

  return (
    <div className={cn("rounded-lg bg-muted/50 p-4", className)}>
      <div className="relative">
        {checkpoints.map((checkpoint, index) => {
          const isFirst = index === 0
          const isLast = index === checkpoints.length - 1

          return (
            <div key={index} className="relative flex items-start gap-3">
              {/* Vertical connecting line */}
              {!isLast && (
                <div className="absolute left-[11px] top-[24px] h-[calc(100%-8px)] w-[2px] bg-border" />
              )}

              {/* Step indicator */}
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium text-primary-foreground",
                    isFirst && "bg-emerald-500",
                    isLast && "bg-rose-500",
                    !isFirst && !isLast && "bg-primary"
                  )}
                >
                  {index + 1}
                </div>
              </div>

              {/* Content */}
              <div
                className={cn(
                  "flex flex-1 items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-muted",
                  !isLast && "mb-3"
                )}
              >
                <span className="text-sm text-foreground">{checkpoint.address}</span>
                <span className="ml-4 shrink-0 text-xs font-medium text-muted-foreground">
                  {checkpoint.arrivalTime}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
