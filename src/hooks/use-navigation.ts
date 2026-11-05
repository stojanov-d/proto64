import { useEffect } from "react";

import { useIsDesktop } from "@/hooks/use-media-query";
import { useNavigationStore, type NavigationState } from "@/stores/navigation";

export function useNavigation(): NavigationState {
  const menuOpen = useNavigationStore((state) => state.menuOpen);
  const setMenuOpen = useNavigationStore((state) => state.setMenuOpen);
  const closeMenu = useNavigationStore((state) => state.closeMenu);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (isDesktop && menuOpen) closeMenu();
  }, [isDesktop, menuOpen, closeMenu]);

  return { menuOpen, setMenuOpen, closeMenu };
}
