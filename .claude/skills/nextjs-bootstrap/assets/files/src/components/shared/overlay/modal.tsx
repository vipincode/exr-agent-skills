"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface ModalProps {
  /** Controlled open state. Omit for an uncontrolled modal driven by `trigger`. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Optional element that opens the modal (uncontrolled usage). */
  trigger?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** The only thing callers MUST pass: the inner content. */
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Forwarded to the dialog panel for sizing/spacing overrides. */
  className?: string;
}

/**
 * Shared modal wrapper around shadcn's `Dialog` primitive. Callers pass only the
 * inner content (plus optional title/description/footer) — never the
 * `Dialog`/`DialogContent` scaffolding. This is the single definition of "a
 * modal" in the app; feature code composes <Modal> instead of re-wiring the
 * Dialog primitive each time. New overlay wrappers (Drawer, Sheet, ConfirmModal)
 * belong next to this file in `components/shared/overlay/`.
 */
export function Modal({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className={cn(className)}>
        {(title || description) && (
          <DialogHeader>
            {title ? <DialogTitle>{title}</DialogTitle> : null}
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </DialogHeader>
        )}
        {children}
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}
