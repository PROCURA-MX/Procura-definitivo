import * as React from "react";

interface SheetProps {
  children: React.ReactNode;
}

interface SheetContentProps {
  children: React.ReactNode;
  side?: "left" | "right" | "top" | "bottom";
  className?: string;
}

interface SheetHeaderProps {
  children: React.ReactNode;
}

interface SheetTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface SheetTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const SheetContext = React.createContext<any>(null);

export function Sheet({ children }: SheetProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

export function SheetTrigger({ children, asChild }: SheetTriggerProps) {
  const { setOpen } = React.useContext(SheetContext);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: () => setOpen(true),
    } as any);
  }
  return (
    <button type="button" onClick={() => setOpen(true)}>
      {children}
    </button>
  );
}

export function SheetContent({ children, side = "right", className = "" }: SheetContentProps) {
  const { open, setOpen } = React.useContext(SheetContext);
  if (!open) return null;
  return (
    <div
      className={`fixed inset-0 z-50 flex ${side === "right" ? "justify-end" : side === "left" ? "justify-start" : "items-end"} bg-black/30`}
      onClick={() => setOpen(false)}
    >
      <div
        className={`bg-white shadow-2xl h-full ${side === "right" || side === "left" ? "w-full max-w-2xl" : "w-full max-h-[90vh]"} ${className}`}
        onClick={e => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-700"
          onClick={() => setOpen(false)}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({ children }: SheetHeaderProps) {
  return <div className="mb-6">{children}</div>;
}

export function SheetTitle({ children, className = "" }: SheetTitleProps) {
  return <h2 className={`text-2xl font-bold mb-2 ${className}`}>{children}</h2>;
} 