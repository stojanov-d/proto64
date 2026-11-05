import { create } from "zustand";

export interface NavigationState {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  closeMenu: () => void;
}

export const useNavigationStore = create<NavigationState>()((set) => ({
  menuOpen: false,
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  closeMenu: () => set({ menuOpen: false }),
}));
