import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";

const PINNED_STORAGE_KEY = "bizkitops_pinned_tabs";
const OPEN_STORAGE_KEY = "bizkitops_open_tabs";

const DEFAULT_PINNED = ["/dashboard"];

export function usePinnedTabs(currentPath: string) {
  const navigate = useNavigate();

  // Pinned Tabs State
  const [pinnedTabs, setPinnedTabs] = useState<string[]>(() => {
    if (typeof window === "undefined") return DEFAULT_PINNED;
    try {
      const saved = localStorage.getItem(PINNED_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Failed to load pinned tabs:", e);
    }
    return DEFAULT_PINNED;
  });

  // Open Tabs State
  const [openTabs, setOpenTabs] = useState<string[]>(() => {
    if (typeof window === "undefined") return DEFAULT_PINNED;
    try {
      const saved = localStorage.getItem(OPEN_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Failed to load open tabs:", e);
    }
    return DEFAULT_PINNED;
  });

  // Save pinned tabs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(pinnedTabs));
    } catch (e) {
      console.warn("Failed to save pinned tabs:", e);
    }
  }, [pinnedTabs]);

  // Save open tabs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(OPEN_STORAGE_KEY, JSON.stringify(openTabs));
    } catch (e) {
      console.warn("Failed to save open tabs:", e);
    }
  }, [openTabs]);

  // Automatically register active path in openTabs & sync pinned items into openTabs
  useEffect(() => {
    if (!currentPath) return;

    setOpenTabs((prev) => {
      let updated = prev;
      // Ensure pinned tabs are in openTabs
      pinnedTabs.forEach((p) => {
        if (!updated.includes(p)) {
          updated = [...updated, p];
        }
      });
      // Ensure currentPath is in openTabs if valid dashboard path
      if (currentPath.startsWith("/dashboard") && !updated.includes(currentPath)) {
        updated = [...updated, currentPath];
      }
      return updated;
    });
  }, [currentPath, pinnedTabs]);

  const isPinned = useCallback(
    (path: string) => pinnedTabs.includes(path),
    [pinnedTabs]
  );

  const togglePin = useCallback(
    (path: string) => {
      setPinnedTabs((prev) => {
        if (prev.includes(path)) {
          return prev.filter((p) => p !== path);
        } else {
          return [...prev, path];
        }
      });
      // Ensure it is in openTabs when pinned
      setOpenTabs((prev) => (prev.includes(path) ? prev : [...prev, path]));
    },
    []
  );

  const closeTab = useCallback(
    (path: string) => {
      // Don't close if pinned
      if (pinnedTabs.includes(path)) return;

      const remaining = openTabs.filter((p) => p !== path);
      setOpenTabs(remaining.length > 0 ? remaining : DEFAULT_PINNED);

      // If active tab was closed, navigate to adjacent tab or dashboard
      if (currentPath === path) {
        const idx = openTabs.indexOf(path);
        const nextTab =
          remaining[Math.max(0, idx - 1)] || remaining[0] || "/dashboard";
        navigate({ to: nextTab as any });
      }
    },
    [pinnedTabs, openTabs, currentPath, navigate]
  );

  const closeOtherTabs = useCallback(
    (keepPath: string) => {
      setOpenTabs((prev) => {
        return prev.filter((p) => p === keepPath || pinnedTabs.includes(p));
      });
      if (currentPath !== keepPath && !pinnedTabs.includes(currentPath)) {
        navigate({ to: keepPath as any });
      }
    },
    [pinnedTabs, currentPath, navigate]
  );

  const closeAllUnpinnedTabs = useCallback(() => {
    setOpenTabs(pinnedTabs.length > 0 ? pinnedTabs : DEFAULT_PINNED);
    if (!pinnedTabs.includes(currentPath)) {
      navigate({ to: (pinnedTabs[0] || "/dashboard") as any });
    }
  }, [pinnedTabs, currentPath, navigate]);

  return {
    pinnedTabs,
    openTabs,
    isPinned,
    togglePin,
    closeTab,
    closeOtherTabs,
    closeAllUnpinnedTabs,
  };
}
