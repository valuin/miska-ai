"use client";

import type { User } from "next-auth";
import { SidebarHistory } from "@/components/sidebar-history";
import { SidebarUserNav } from "@/components/sidebar-user-nav";
import Integrations from "./integrations";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  // SidebarMenuButton,
  SidebarMenuIcon,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  MessageSquarePlus,
  FolderLock,
  Plug,
  LineChart,
} from "lucide-react";
import Image from "next/image";

function SidebarItem({
  path,
  icon,
  label,
}: {
  path: string;
  icon: React.ReactNode;
  label: string;
}) {
  const pathName = usePathname();
  const isActive = pathName === path;
  const { setOpenMobile } = useSidebar();

  return (
    <div
      className={cn(
        "flex flex-row justify-between items-center w-full rounded-lg py-2 px-3 hover:bg-[#04362C] cursor-pointer group",
        isActive && "bg-primary"
      )}
      title={label}
    >
      <Link
        href={path}
        onClick={() => {
          setOpenMobile(false);
        }}
        className="flex flex-row items-center"
      >
        {/* Icon always visible; text hidden in icon-collapsed via CSS below */}
        {icon}
        <span className="text-base font-semibold px-2 rounded-md cursor-pointer w-full text-left group-data-[collapsible=icon]:hidden">
          {label}
        </span>
      </Link>
    </div>
  );
}

export function AppSidebar({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        {/* Logo - fills the sidebar header area */}
        <div className="w-full px-2 pt-2">
          {/* Expanded logo */}
          <div className="group-data-[collapsible=icon]:hidden">
            <div className="relative w-full aspect-[16/5] overflow-hidden rounded-md">
              <Image
                src="/images/MISKA.png"
                alt="MISKA Logo"
                fill
                sizes="(max-width: 768px) 100vw, 256px"
                className="object-contain"
                priority
              />
            </div>
          </div>
          {/* Collapsed (icon) logo */}
          <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center py-1">
            <div className="relative size-8">
              <Image
                src="/images/MISKA_small.png"
                alt="MISKA Logo Small"
                fill
                sizes="32px"
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
        <SidebarMenu>
          <div className="flex flex-col justify-start items-start gap-2">
            {/* Home */}
            <SidebarItem
              path="/home"
              icon={<Home className="size-4" />}
              label="Home"
            />
            {/* New Chat */}
            <SidebarItem
              path="/chat"
              icon={<MessageSquarePlus className="size-4" />}
              label="New Chat"
            />
            {/* Analytics */}
            <SidebarItem
              path="/analytics"
              icon={<LineChart className="size-4" />}
              label="Analytics"
            />
            {/* Vault Documents */}
            <SidebarItem
              path="/vault"
              icon={<FolderLock className="size-4" />}
              label="Vault Documents"
            />
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Integrations with its own icon visible in collapsed state */}
        <SidebarMenuIcon>
          <Plug className="size-4" />
        </SidebarMenuIcon>
        <Integrations />
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
