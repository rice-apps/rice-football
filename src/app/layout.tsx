import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rice Football Analytics",
  description: "Reusable foundation for Rice Football analytics workflows.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
