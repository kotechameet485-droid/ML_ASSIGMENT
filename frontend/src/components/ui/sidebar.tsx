import React, { useState, createContext, useContext } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SidebarLinkItem {
  label: string;
  href?: string;
  icon: React.JSX.Element | React.ReactNode;
  badge?: string | null;
  isActive?: boolean;
  onClick?: () => void;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<'div'>)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.aside
      className={cn(
        'h-full px-3 py-4 hidden md:flex md:flex-col bg-[#111820] border-r border-[#1D2935] w-[270px] shrink-0 select-none z-30',
        className
      )}
      animate={{
        width: animate ? (open ? '270px' : '68px') : '270px',
      }}
      transition={{
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1],
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.aside>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) => {
  const { open, setOpen } = useSidebar();
  return (
    <div
      className={cn(
        'h-12 px-4 flex flex-row md:hidden items-center justify-between bg-[#111820] border-b border-[#1D2935] w-full z-40'
      )}
      {...props}
    >
      <div className="flex justify-end z-20 w-full">
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={() => setOpen(!open)}
          className="p-1 rounded text-slate-300 hover:text-white hover:bg-[#1D2935] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{
              duration: 0.22,
              ease: 'easeInOut',
            }}
            className={cn(
              'fixed h-full w-full inset-0 bg-[#111820] p-6 z-[100] flex flex-col justify-between overflow-y-auto',
              className
            )}
          >
            <div className="absolute right-5 top-4 z-50">
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1D2935] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SidebarLink = ({
  link,
  className,
  isActive,
  onClick,
}: {
  link: SidebarLinkItem;
  className?: string;
  isActive?: boolean;
  onClick?: () => void;
}) => {
  const { open, animate, setOpen } = useSidebar();

  const handleClick = () => {
    if (onClick) onClick();
    if (link.onClick) link.onClick();
    // Close mobile drawer on item click
    if (window.innerWidth < 768) {
      setOpen(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex items-center justify-start gap-3 group/sidebar py-2.5 px-2.5 rounded-md transition-colors duration-150 w-full text-left cursor-pointer relative overflow-hidden',
        isActive
          ? 'bg-[#1D2935] text-white font-medium border-l-2 border-[#3B82F6]'
          : 'text-slate-400 hover:text-white hover:bg-[#273747]/60',
        className
      )}
      title={!open ? link.label : undefined}
    >
      <span className="shrink-0 flex items-center justify-center w-5 h-5">
        {link.icon}
      </span>

      <motion.span
        animate={{
          display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        transition={{ duration: 0.15 }}
        className="text-xs tracking-tight whitespace-nowrap overflow-hidden text-ellipsis flex-1 font-mono"
      >
        {link.label}
      </motion.span>

      {link.badge && (
        <motion.span
          animate={{
            display: animate ? (open ? 'inline-block' : 'none') : 'none',
            opacity: animate ? (open ? 1 : 0) : 0,
          }}
          transition={{ duration: 0.15 }}
          className={cn(
            'text-[9px] font-mono px-1.5 py-0.2 rounded font-medium shrink-0 ml-auto',
            isActive
              ? 'bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/40'
              : 'bg-[#1D2935] text-slate-400 border border-[#273747]'
          )}
        >
          {link.badge}
        </motion.span>
      )}
    </button>
  );
};
