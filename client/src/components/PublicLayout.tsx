import { useIsMobileOrTablet } from "@/hooks/useMobileOrTablet";
import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import MobileHeader from "./mobile/MobileHeader";
import MobileBottomNav from "./mobile/MobileBottomNav";
import MobileFooter from "./mobile/MobileFooter";

interface PublicLayoutProps {
  readonly children: ReactNode;
  /** Hide footer on this page (useful for some mobile views) */
  readonly hideFooter?: boolean;
}

/**
 * PublicLayout - Main layout for public pages
 * 
 * Automatically switches between desktop and mobile layouts:
 * - Desktop (>= 1024px): Header + content + Footer
 * - Mobile/Tablet (< 1024px): MobileHeader + content + MobileFooter + MobileBottomNav
 */
export default function PublicLayout({ children, hideFooter }: PublicLayoutProps) {
  const isMobileOrTablet = useIsMobileOrTablet();

  if (isMobileOrTablet) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <MobileHeader />
        
        <main className="flex-1">
          {children}
        </main>
        
        {!hideFooter && <MobileFooter />}
        
        {/* Bottom navigation - always visible on mobile */}
        <MobileBottomNav />
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {children}
      </main>
      
      {!hideFooter && <Footer />}
    </div>
  );
}

/**
 * PageContent - Wrapper for page content
 * Use this inside pages to maintain consistent padding
 */
export function PageContent({ children, className = "" }: { readonly children: ReactNode; readonly className?: string }) {
  return (
    <div className={`container ${className}`}>
      {children}
    </div>
  );
}
