import { create } from 'zustand';

interface SidebarState {
  isOpen: boolean;
  isHovered: boolean;
  settings: {
    disabled: boolean;
  };
  toggleOpen: () => void;
  getOpenState: () => boolean;
  setIsHover: (isHovered: boolean) => void;
  open: () => void;
  close: () => void;
}

export const useSidebar = create<SidebarState>((set, get) => ({
  isOpen: false,
  isHovered: false,
  settings: {
    disabled: false,
  },
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  getOpenState: () => get().isOpen,
  setIsHover: (isHovered) => set({ isHovered }),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
