import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SidebarContext, useSidebar } from './use-sidebar';

export interface SidebarLinkItem {
  label: string;
  href?: string;
  icon: React.JSX.Element | React.ReactNode;
  badge?: string | null;
  isActive?: boolean;
  onClick?: () => void;
}

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
      <MobileSidebar className={props.className}>
        {props.children as React.ReactNode}
      </MobileSidebar>
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
        'sticky top-14 h-[calc(100vh-3.5rem)] px-3 py-4 hidden md:flex md:flex-col bg-white border-r border-[#DDE2E5] w-67.5 shrink-0 select-none z-30 shadow-[1px_0_3px_rgba(30,37,43,0.02)]',
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
        'h-12 px-4 flex flex-row md:hidden items-center justify-between bg-white border-b border-[#DDE2E5] w-full z-40'
      )}
      {...props}
    >
      <div className="flex justify-end z-20 w-full">
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={() => setOpen(!open)}
          className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
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
              'fixed h-full w-full inset-0 bg-white p-6 z-100 flex flex-col justify-between overflow-y-auto text-slate-900 border-r border-[#DDE2E5]',
              className
            )}
          >
            <div className="absolute right-5 top-4 z-50">
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
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
        'flex items-center justify-start gap-3 group/sidebar py-2 px-2.5 rounded-md transition-colors duration-150 w-full text-left cursor-pointer relative overflow-hidden',
        isActive
          ? 'bg-[#EBF0F5] text-[#0F62FE] font-bold border-l-[3px] border-[#0F62FE] shadow-2xs'
          : 'text-slate-600 hover:text-slate-900 hover:bg-[#F1F3F5]',
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
            'text-[9px] font-mono px-1.5 py-0.2 rounded font-bold shrink-0 ml-auto',
            isActive
              ? 'bg-[#0F62FE]/15 text-[#004CCD] border border-[#0F62FE]/30'
              : 'bg-[#F1F3F5] text-slate-500 border border-[#DDE2E5]'
          )}
        >
          {link.badge}
        </motion.span>
      )}
    </button>
  );
};
