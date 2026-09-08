"use client"

import { Menu as MenuPrimitive } from "@base-ui/react/menu"

import { cn } from "@/lib/utils"

/**
 * Rozbalovací menu nad @base-ui/react (stejná primitiva jako select.tsx).
 *
 * Psáno ručně, ne přes `shadcn add dropdown-menu`. Registry verze base-nova
 * dává obsahu `w-(--anchor-width)`, tedy šířku spouštěče — pod 36px ikonou
 * účtu by z toho bylo 36px menu. A hlavně nemá `LinkItem`, protože vznikla
 * nad Radixem; Base UI má pro odkazy vlastní part, který renderuje <a>.
 */

function DropdownMenu({ ...props }: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

function DropdownMenuContent({
  align = "end",
  side = "bottom",
  sideOffset = 10,
  className,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<MenuPrimitive.Positioner.Props, "align" | "side" | "sideOffset">) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        className="z-50 outline-none"
        align={align}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "max-h-(--available-height) min-w-56 max-w-(--available-width) origin-(--transform-origin) overflow-y-auto",
            "rounded-[2px] border border-hairline bg-paper p-1 shadow-paper outline-none",
            "duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
}

function DropdownMenuLabel({
  className,
  ...props
}: MenuPrimitive.GroupLabel.Props) {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="dropdown-menu-label"
      className={cn(
        "px-2.5 pb-1 pt-2 text-[11.5px] font-semibold uppercase tracking-wider text-ink-2",
        className,
      )}
      {...props}
    />
  )
}

const itemClass =
  "relative flex w-full items-center gap-2.5 rounded-[2px] px-2.5 py-2 text-[15px] text-ink outline-none select-none transition-colors data-highlighted:bg-paper-2 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-ink-2"

function DropdownMenuItem({ className, ...props }: MenuPrimitive.Item.Props) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(itemClass, className)}
      {...props}
    />
  )
}

/**
 * `closeOnClick` je u Base UI `LinkItem` defaultně false — počítá s tvrdou
 * navigací, která popup stejně odmontuje. U next/link se hlavička neodmontuje
 * a menu by zůstalo viset otevřené, proto default otáčíme.
 */
function DropdownMenuLinkItem({
  className,
  closeOnClick = true,
  ...props
}: MenuPrimitive.LinkItem.Props) {
  return (
    <MenuPrimitive.LinkItem
      data-slot="dropdown-menu-link-item"
      closeOnClick={closeOnClick}
      className={cn(itemClass, className)}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-hairline", className)}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
}
