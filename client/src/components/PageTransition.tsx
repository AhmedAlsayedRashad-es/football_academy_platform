import { ReactNode, useEffect, useRef } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Wraps page content with a smooth fade+slide animation using CSS only.
 * Replaced Framer Motion to fix React 19 Activity API compatibility crash in production.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(8px)";
    requestAnimationFrame(() => {
      el.style.transition = "opacity 0.22s ease-out, transform 0.22s ease-out";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    });
  }, []);

  return (
    <div ref={ref} style={{ opacity: 0, transform: "translateY(8px)" }}>
      {children}
    </div>
  );
}

/**
 * Stagger children animation — useful for card grids and lists.
 */
export function StaggerContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

/**
 * Stagger item — child of StaggerContainer.
 * Uses CSS animation with staggered delay via index detection.
 */
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement;
    if (parent) {
      const index = Array.from(parent.children).indexOf(el);
      const delay = index * 50;
      el.style.opacity = "0";
      el.style.transform = "translateY(12px)";
      setTimeout(() => {
        el.style.transition = "opacity 0.2s ease-out, transform 0.2s ease-out";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, delay);
    }
  }, []);

  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}
