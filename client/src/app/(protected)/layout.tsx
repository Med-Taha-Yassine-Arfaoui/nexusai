"use client";

import EnhancedProtectedLayout from "@/components/EnhancedProtectedLayout";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EnhancedProtectedLayout>{children}</EnhancedProtectedLayout>;
}