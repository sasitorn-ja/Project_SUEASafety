"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function dialogPanelClassName(className?: string) {
  return cn(
    "overflow-hidden rounded-[28px] border border-[#cfe0f2] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,252,255,0.96))] text-[#173b6b] shadow-[0_28px_80px_rgba(6,43,99,0.28)] ring-1 ring-white/80 font-sarabun supports-backdrop-filter:backdrop-blur-xl",
    className,
  )
}

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-[rgba(2,18,42,0.58)] duration-150 supports-backdrop-filter:backdrop-blur-[8px] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          dialogPanelClassName(),
          "fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-1rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto p-4 text-sm text-[#173b6b] duration-150 outline-none sm:max-w-md data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            asChild
          >
              <Button
                variant="ghost"
                className="absolute top-4 right-4 h-10 w-10 rounded-full border border-[#cfe0f2] bg-white/86 text-[#0e3e7d] shadow-[0_8px_20px_rgba(14,62,125,0.12)] hover:bg-[#eaf2fd] hover:text-[#1763c0]"
                size="icon-sm"
              >
                <XIcon />
                <span className="sr-only">Close</span>
              </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("-mx-4 -mt-4 flex flex-col gap-1.5 border-b border-[#d7e6f6] bg-[linear-gradient(135deg,#ffffff_0%,#f4f9ff_56%,#eaf4ff_100%)] px-5 py-4 shadow-[inset_0_-1px_0_rgba(255,255,255,0.9)] sm:px-6 sm:py-5", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 border-t border-[#d7e6f6] bg-[linear-gradient(180deg,#f8fcff_0%,#eef7ff_100%)] px-5 py-4 sm:flex-row sm:justify-end sm:px-6 sm:py-5",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-[22px] leading-tight font-black text-[#0e3e7d] sm:text-[26px]",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-[13px] font-bold leading-relaxed text-[#5f7591] *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-[#1763c0] sm:text-[14px]",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
