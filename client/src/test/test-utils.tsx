import React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { render, RenderOptions } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";
import { HelmetProvider } from "react-helmet-async";

interface WrapperProps {
  children: ReactNode;
}

function AllProviders({ children }: WrapperProps) {
  return (
    <HelmetProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </HelmetProvider>
  );
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library
export * from "@testing-library/react";

// Override render method
export { customRender as render };
