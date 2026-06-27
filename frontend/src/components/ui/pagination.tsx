import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-slot="pagination-content" className={cn("flex flex-row items-center gap-1", className)} {...props} />
}

function PaginationItem(props: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & React.ComponentProps<"button">

function PaginationLink({ className, isActive, ...props }: PaginationLinkProps) {
  return (
    <button
      type="button"
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(buttonVariants({ variant: isActive ? "outline" : "ghost", size: "icon" }), "font-black", className)}
      {...props}
    />
  )
}

function PaginationPrevious({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label="ไปหน้าก่อน"
      className={cn(buttonVariants({ variant: "ghost", size: "default" }), "gap-1 px-2.5 font-black", className)}
      {...props}
    >
      <ChevronLeft />
      <span>ก่อนหน้า</span>
    </button>
  )
}

function PaginationNext({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label="ไปหน้าถัดไป"
      className={cn(buttonVariants({ variant: "ghost", size: "default" }), "gap-1 px-2.5 font-black", className)}
      {...props}
    >
      <span>ถัดไป</span>
      <ChevronRight />
    </button>
  )
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span aria-hidden data-slot="pagination-ellipsis" className={cn("flex size-8 items-center justify-center", className)} {...props}>
      <MoreHorizontal className="size-4" />
      <span className="sr-only">หน้าเพิ่มเติม</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
