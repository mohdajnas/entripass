"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import React from "react";

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  formAction?: (formData: FormData) => void;
}

export function SubmitButton({ children, formAction, className, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      formAction={formAction}
      disabled={pending || props.disabled}
      className={`${className} flex justify-center items-center gap-2`}
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
