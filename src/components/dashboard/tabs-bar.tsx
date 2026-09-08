import React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LucideIcon, Pin, PinOff, X, MoreHorizontal, Plus, Shield, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface NavItemDef {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  adminOnly?: boolean;
}

interface TabsBarProps {
  navItems: NavItemDef[];
  openTabs: string[];
  pinnedTabs: string[];
  currentPath: string;
  isPinned: (path: string) => boolean;
  togglePin: (path: string) => void;
  closeTab: (path: string) => void;
  closeOtherTabs: (path: string) => void;
  closeAllUnpinnedTabs: () => void;
}

export function TabsBar({
  navItems,
  openTabs,
  pinnedTabs,
  currentPath,
  isPinned,
  togglePin,
  closeTab,
  closeOtherTabs,
  closeAllUnpinnedTabs,
}: TabsBarProps) {
  const navigate = useNavigate();
  const navMap = new Map(navItems.map((item) => [item.to, item]));

  // Separate open tabs into pinned and unpinned for proper ordering
  const sortedTabs = [...openTabs].sort((a, b) => {
    const aPinned = isPinned(a);
    const bPinned = isPinned(b);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return openTabs.indexOf(a) - openTabs.indexOf(b);
  });

  return (
    <div className="flex items-center justify-between border-b border-border bg-card/60 backdrop-blur px-3 py-1 gap-2 text-xs select-none overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar flex-1">
        {sortedTabs.map((path) => {
          const navItem = navMap.get(path);
          if (!navItem) return null;

          const isActive =
            currentPath === path ||
            (!navItem.exact && currentPath.startsWith(path + "/"));
          const pinned = isPinned(path);
          const Icon = navItem.icon;

          return (
            <DropdownMenu key={path}>
              <div
                className={cn(
                  "group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer border text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  isActive &&
                    "bg-primary/10 text-primary border-primary/20 font-medium shadow-2xs"
                )}
              >
                <Link
                  to={path as any}
                  className="flex items-center gap-1.5"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate max-w-[120px]">{navItem.label}</span>
                </Link>

                {/* Pin indicator badge */}
                {pinned && (
                  <Pin className="h-3 w-3 text-primary fill-primary/30 shrink-0 ml-0.5" />
                )}

                {/* Tab action triggers */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      togglePin(path);
                    }}
                    title={pinned ? "Unpin tab" : "Pin tab"}
                    className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                  >
                    {pinned ? (
                      <PinOff className="h-3 w-3" />
                    ) : (
                      <Pin className="h-3 w-3" />
                    )}
                  </button>

                  {!pinned && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        closeTab(path);
                      }}
                      title="Close tab"
                      className="p-0.5 rounded hover:bg-rose-500/20 hover:text-rose-600 text-muted-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}

                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-0.5 rounded hover:bg-accent text-muted-foreground"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                </div>
              </div>

              <DropdownMenuContent align="start" className="w-44 text-xs">
                <DropdownMenuItem onClick={() => togglePin(path)}>
                  {pinned ? (
                    <>
                      <PinOff className="h-3.5 w-3.5 mr-2" /> Unpin Tab
                    </>
                  ) : (
                    <>
                      <Pin className="h-3.5 w-3.5 mr-2" /> Pin Tab
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => closeOtherTabs(path)}>
                  Close Other Tabs
                </DropdownMenuItem>
                {!pinned && (
                  <DropdownMenuItem
                    onClick={() => closeTab(path)}
                    className="text-rose-600 focus:text-rose-600"
                  >
                    <X className="h-3.5 w-3.5 mr-2" /> Close Tab
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}
      </div>

      {/* Far right tab options */}
      <div className="flex items-center gap-1 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
              title="Open tab switcher"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add Tab</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 max-h-64 overflow-y-auto">
            {navItems.map((item) => (
              <DropdownMenuItem
                key={item.to}
                onClick={() => navigate({ to: item.to as any })}
                className="flex items-center justify-between text-xs"
              >
                <span className="flex items-center gap-2">
                  <item.icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </span>
                {isPinned(item.to) && (
                  <Pin className="h-3 w-3 text-primary fill-primary/30" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={closeAllUnpinnedTabs} className="text-muted-foreground">
              Close Unpinned Tabs
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
