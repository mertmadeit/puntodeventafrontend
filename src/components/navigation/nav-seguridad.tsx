"use client"

import Link from "next/link"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"


export function NavSeguridad({
  items,
}: {
  items: {
    name: string
    url: string
    icon: React.ReactNode
  }[]
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Seguridad</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              {item.url.startsWith("/") ? (
                <Link href={item.url}>
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ) : (
                <a href={item.url}>
                  {item.icon}
                  <span>{item.name}</span>
                </a>
              )}
            </SidebarMenuButton>
      
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
