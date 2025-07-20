"use client";

import type { User } from "next-auth";

import { Bot, LineChart, RepeatIcon } from "lucide-react";
import { SidebarHistory } from "@/components/sidebar-history";
import { SidebarUserNav } from "@/components/sidebar-user-nav";
import Integrations from "./integrations";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

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
        "flex flex-row justify-between items-center w-full rounded-lg py-2 px-3 hover:bg-muted cursor-pointer",
        isActive && "bg-muted",
      )}
    >
      <Link
        href={path}
        onClick={() => {
          setOpenMobile(false);
        }}
        className="flex flex-row items-center"
      >
        {icon}
        <span className="text-base font-semibold px-2 rounded-md cursor-pointer w-full text-left">
          {label}
        </span>
      </Link>
    </div>
  );
}

export function AppSidebar({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-col justify-start items-start gap-2">
            <SidebarItem
              path="/"
              icon={<Bot className="size-4" />}
              label="Chatbot"
            />
            <SidebarItem
              path="/analytics"
              icon={<LineChart className="size-4" />}
              label="Analytics"
            />
            <SidebarItem
              path="/workflows"
              icon={<RepeatIcon className="size-4" />}
              label="Workflows"
            />
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <Integrations />
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
