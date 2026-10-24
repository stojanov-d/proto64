import { create } from "zustand";

import type { NavigationState } from "@/types/navigation";

export const useNavigationStore = create<NavigationState>()((set) => ({
  menuOpen: false,
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  closeMenu: () => set({ menuOpen: false }),
}));
