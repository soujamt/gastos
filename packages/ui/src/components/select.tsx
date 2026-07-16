"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { RiArrowDownSLine, RiArrowUpSLine, RiCheckLine } from "@remixicon/react"

import { cn } from "@workspace/ui/lib/utils"

type SelectValue = string | number

type SelectOption = {
  value: string
  label: React.ReactNode
  textLabel: string
  disabled: boolean
}

type SelectProps = {
  children: React.ReactNode
  className?: string
  defaultValue?: SelectValue
  value?: SelectValue
  name?: string
  id?: string
  form?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  autoComplete?: string
  autoFocus?: boolean
  placeholder?: string
  "aria-label"?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean | "true" | "false"
  onValueChange?: (value: SelectValue | null) => void
}

function textFromNode(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node)
  }
  if (Array.isArray(node)) {
    return node.map(textFromNode).join("")
  }
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return textFromNode(node.props.children)
  }
  return ""
}

function optionsFromChildren(children: React.ReactNode): SelectOption[] {
  return React.Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement<React.ComponentProps<"option">>(child)) {
      return []
    }

    const label = child.props.children
    const rawValue = child.props.value ?? textFromNode(label)
    const value = Array.isArray(rawValue)
      ? rawValue.join(",")
      : String(rawValue)

    return [
      {
        value,
        label,
        textLabel: textFromNode(label),
        disabled: Boolean(child.props.disabled),
      },
    ]
  })
}

function Select({
  children,
  className,
  defaultValue,
  value,
  name,
  id,
  form,
  required,
  disabled,
  readOnly,
  autoComplete,
  autoFocus,
  placeholder = "Seleccionar…",
  onValueChange,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: SelectProps) {
  const options = React.useMemo(() => optionsFromChildren(children), [children])
  const items = React.useMemo(
    () =>
      options.map(({ label, value: optionValue }) => ({
        label,
        value: optionValue,
      })),
    [options]
  )

  return (
    <SelectPrimitive.Root
      items={items}
      name={name}
      id={id}
      form={form}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      autoComplete={autoComplete}
      defaultValue={
        defaultValue === undefined ? undefined : String(defaultValue)
      }
      value={value === undefined ? undefined : String(value)}
      onValueChange={(nextValue) => onValueChange?.(nextValue)}
    >
      <SelectPrimitive.Trigger
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        data-slot="select"
        className={cn(
          "group flex h-10 w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-input bg-card px-3.5 text-left text-sm shadow-xs transition-[border-color,box-shadow,background-color] outline-none",
          "hover:border-primary/30 hover:bg-accent/35",
          "focus-visible:border-primary/60 focus-visible:ring-[3px] focus-visible:ring-primary/15",
          "data-popup-open:border-primary/45 data-popup-open:ring-[3px] data-popup-open:ring-primary/10",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
          "dark:bg-input/30 data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50",
          className
        )}
      >
        <SelectPrimitive.Value
          placeholder={placeholder}
          className="min-w-0 flex-1 truncate data-placeholder:text-muted-foreground"
        />
        <SelectPrimitive.Icon className="flex size-5 shrink-0 items-center justify-center text-muted-foreground transition-transform duration-200 group-data-popup-open:rotate-180 group-data-popup-open:text-foreground">
          <RiArrowDownSLine className="size-5" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner
          sideOffset={6}
          align="start"
          alignItemWithTrigger={false}
          className="z-[90] outline-none"
        >
          <SelectPrimitive.Popup className="min-w-[var(--anchor-width)] origin-[var(--transform-origin)] overflow-hidden rounded-xl border border-border/90 bg-popover text-popover-foreground shadow-[0_18px_50px_rgba(10,35,30,0.16)] transition-[transform,opacity] duration-150 outline-none data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
            <SelectPrimitive.ScrollUpArrow className="sticky top-0 z-10 flex h-7 w-full items-center justify-center border-b bg-popover/95 text-muted-foreground backdrop-blur">
              <RiArrowUpSLine className="size-4" />
            </SelectPrimitive.ScrollUpArrow>
            <SelectPrimitive.List className="max-h-[min(var(--available-height),18rem)] scroll-py-1 overflow-y-auto p-1.5">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={`${String(option.value)}-${option.textLabel}`}
                  value={option.value}
                  disabled={option.disabled}
                  label={option.textLabel}
                  className="grid min-h-10 cursor-default grid-cols-[1.25rem_1fr] items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:opacity-40"
                >
                  <SelectPrimitive.ItemIndicator className="col-start-1 flex size-5 items-center justify-center text-primary">
                    <RiCheckLine className="size-4" />
                  </SelectPrimitive.ItemIndicator>
                  <SelectPrimitive.ItemText className="col-start-2 truncate">
                    {option.label}
                  </SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
            <SelectPrimitive.ScrollDownArrow className="sticky bottom-0 z-10 flex h-7 w-full items-center justify-center border-t bg-popover/95 text-muted-foreground backdrop-blur">
              <RiArrowDownSLine className="size-4" />
            </SelectPrimitive.ScrollDownArrow>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

export { Select }
export type { SelectProps }
