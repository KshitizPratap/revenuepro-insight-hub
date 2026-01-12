import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentLoaderProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

/**
 * ContentLoader - Only covers the main content area (not sidebar or navbar)
 * Use this for page-level loading states
 * Prevents scrolling when visible and keeps sidebar/navbar visible
 */
export const ContentLoader: React.FC<ContentLoaderProps> = ({ 
  isLoading, 
  message = "Loading...",
  className
}) => {
  // Calculate sidebar width dynamically using state
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const topBarHeight = 60; // TopBar is h-[60px]

  // Update sidebar width when loader becomes visible
  useEffect(() => {
    if (isLoading) {
      const updateSidebarWidth = () => {
        // Try multiple selectors to find the sidebar
        const sidebar = (document.querySelector('[class*="bg-sidebar"]') as HTMLElement) ||
                       (document.querySelector('aside') as HTMLElement);
        if (sidebar) {
          setSidebarWidth(sidebar.offsetWidth || 240);
        } else {
          // Fallback: check if sidebar has w-16 (collapsed = 64px) or w-60 (expanded = 240px)
          const sidebarElement = Array.from(document.querySelectorAll('div')).find(
            el => el.classList.contains('w-16') || el.classList.contains('w-60')
          ) as HTMLElement;
          if (sidebarElement) {
            setSidebarWidth(sidebarElement.offsetWidth || 240);
          }
        }
      };
      
      // Update immediately and after a short delay to ensure DOM is ready
      updateSidebarWidth();
      const timeoutId = setTimeout(updateSidebarWidth, 100);
      
      // Also listen for resize events
      window.addEventListener('resize', updateSidebarWidth);
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', updateSidebarWidth);
      };
    }
  }, [isLoading]);

  // Prevent scrolling when loader is visible
  useEffect(() => {
    if (isLoading) {
      // Find the main content area (the <main> element with overflow-auto)
      const mainElement = document.querySelector('main.flex-1.overflow-auto') as HTMLElement;
      if (mainElement) {
        // Store original overflow value
        const originalOverflow = mainElement.style.overflow;
        mainElement.dataset.originalOverflow = originalOverflow || 'auto';
        
        // Prevent scrolling on the main content area
        mainElement.style.overflow = 'hidden';
        // Also prevent touch scrolling on mobile
        mainElement.style.touchAction = 'none';
      }
      
      // Also prevent body scrolling as a fallback
      const originalBodyOverflow = document.body.style.overflow;
      document.body.dataset.originalOverflow = originalBodyOverflow || '';
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scrolling when loader is hidden
      const mainElement = document.querySelector('main.flex-1.overflow-auto') as HTMLElement;
      if (mainElement) {
        const originalOverflow = mainElement.dataset.originalOverflow || 'auto';
        mainElement.style.overflow = originalOverflow;
        mainElement.style.touchAction = '';
        delete mainElement.dataset.originalOverflow;
      }
      
      // Restore body scrolling
      const originalBodyOverflow = document.body.dataset.originalOverflow || '';
      document.body.style.overflow = originalBodyOverflow;
      delete document.body.dataset.originalOverflow;
    }

    // Cleanup on unmount
    return () => {
      const mainElement = document.querySelector('main.flex-1.overflow-auto') as HTMLElement;
      if (mainElement) {
        const originalOverflow = mainElement.dataset.originalOverflow || 'auto';
        mainElement.style.overflow = originalOverflow;
        mainElement.style.touchAction = '';
        delete mainElement.dataset.originalOverflow;
      }
      
      const originalBodyOverflow = document.body.dataset.originalOverflow || '';
      document.body.style.overflow = originalBodyOverflow;
      delete document.body.dataset.originalOverflow;
    };
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div 
      className={cn(
        "fixed z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
        className
      )}
      style={{
        left: `${sidebarWidth}px`,
        top: `${topBarHeight}px`,
        right: 0,
        bottom: 0,
      }}
      onWheel={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onTouchMove={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onScroll={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
    >
      <div className="flex flex-col items-center gap-4 p-8 pointer-events-none">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium text-card-foreground">{message}</p>
      </div>
    </div>
  );
};
