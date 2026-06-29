"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export type ComboboxOption = {
  value: string;
  label: string;
  /** extra terms to match while searching */
  keywords?: string[];
};

export interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** show the search box inside the popover (default: true) */
  searchable?: boolean;
  /** allow a typed value that is not already in options */
  allowCustomValue?: boolean;
  customValueLabel?: (value: string) => string;
  onSearchValueChange?: (value: string) => void;
  disabled?: boolean;
  id?: string;
  /** className for the trigger button */
  className?: string;
  /** inline style for the trigger button (for call sites that use inline styles) */
  style?: React.CSSProperties;
  /** className for the popover content */
  contentClassName?: string;
  /** keep the page scroll position stable while opening/closing the popover */
  preserveScrollOnOpen?: boolean;
  "aria-label"?: string;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "เลือก...",
  searchPlaceholder = "ค้นหา...",
  emptyText = "ไม่พบรายการ",
  searchable = true,
  allowCustomValue = false,
  customValueLabel = (nextValue) => `ใช้ “${nextValue}”`,
  onSearchValueChange,
  disabled = false,
  id,
  className,
  style,
  contentClassName,
  preserveScrollOnOpen = true,
  "aria-label": ariaLabel,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const scrollPositionRef = React.useRef<{ x: number; y: number } | null>(null);
  const selected = options.find((option) => option.value === value);
  const customQuery = query.trim();
  const hasExactOption = options.some(
    (option) => option.value.toLowerCase() === customQuery.toLowerCase()
      || option.label.toLowerCase() === customQuery.toLowerCase()
  );
  const preserveScrollPosition = React.useCallback(() => {
    if (!preserveScrollOnOpen || typeof window === "undefined") return;
    const position = { x: window.scrollX, y: window.scrollY };
    scrollPositionRef.current = position;
    const restore = () => {
      const latest = scrollPositionRef.current;
      if (!latest) return;
      window.scrollTo(latest.x, latest.y);
    };
    window.requestAnimationFrame(() => {
      restore();
      window.requestAnimationFrame(restore);
    });
  }, [preserveScrollOnOpen]);

  const handleValueChange = React.useCallback((nextValue: string) => {
    preserveScrollPosition();
    onValueChange(nextValue);
  }, [onValueChange, preserveScrollPosition]);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        preserveScrollPosition();
        setOpen(nextOpen);
        if (!nextOpen) setQuery("");
      }}
    >
      <PopoverTrigger
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-[rgba(14,15,18,0.16)] bg-white px-3 text-left text-[13px] font-bold text-[#1A1A1A] outline-none transition-colors",
          "hover:border-[rgba(14,15,18,0.32)] focus-visible:ring-2 focus-visible:ring-[rgba(var(--brand-accent-rgb,20,150,255),0.45)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        style={style}
      >
        <span className={cn("truncate", !selected && "text-[#9a8a72]")}>
          {selected ? selected.label : value || placeholder}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" strokeWidth={2.2} />
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        sideOffset={6}
        collisionAvoidance={{ side: "none", align: "shift", fallbackAxisSide: "none" }}
        className={cn("w-(--anchor-width) min-w-[180px] overflow-hidden p-0", contentClassName)}
      >
        <Command>
          {searchable ? (
            <CommandInput
              value={query}
              onValueChange={(nextQuery) => {
                setQuery(nextQuery);
                onSearchValueChange?.(nextQuery);
              }}
              placeholder={searchPlaceholder}
            />
          ) : null}
          <CommandList className="max-h-[min(320px,calc(100dvh-120px))]">
            <CommandEmpty>{emptyText}</CommandEmpty>
            {allowCustomValue && customQuery && !hasExactOption ? (
              <CommandItem
                value={customQuery}
                onSelect={() => {
                  handleValueChange(customQuery);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <Check className="h-4 w-4 shrink-0 opacity-0" strokeWidth={2.6} />
                <span className="truncate">{customValueLabel(customQuery)}</span>
              </CommandItem>
            ) : null}
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={`${option.label} ${option.value} ${(option.keywords ?? []).join(" ")}`}
                onSelect={() => {
                  handleValueChange(option.value);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0 text-[var(--brand-accent,#1496ff)]",
                    option.value === value ? "opacity-100" : "opacity-0"
                  )}
                  strokeWidth={2.6}
                />
                <span className="truncate">{option.label}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
