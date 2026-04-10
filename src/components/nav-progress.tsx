'use client';

import { AppProgressProvider } from '@bprogress/next';

export function NavProgress({ children }: { children: React.ReactNode }) {
  return (
    <AppProgressProvider
      height="4px"
      color="var(--progress-bar)"
      options={{ showSpinner: false }}
    >
      {children}
    </AppProgressProvider>
  );
}
