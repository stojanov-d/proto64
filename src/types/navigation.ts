export interface NavigationState {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  closeMenu: () => void;
}
