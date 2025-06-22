import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { buttonVariants } from "./button-variants"; // Importa variantes desde archivo separado

// Justificación:
// Se movió la definición de buttonVariants a button-variants.ts para evitar advertencias y problemas con Fast Refresh/Hot Reload.
// React recomienda que los archivos de componentes solo exporten componentes para que el estado y la recarga en caliente funcionen correctamente.
// Así, este archivo solo exporta el componente Button.

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
