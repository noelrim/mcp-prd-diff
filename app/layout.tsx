import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Diff MCP App',
  description: 'Review diffs and resolve them via MCP.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
