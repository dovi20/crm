import * as React from "react";
import AppLayout from "@/components/Layout";

export default function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
