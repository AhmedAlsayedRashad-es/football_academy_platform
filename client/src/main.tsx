// Polyfill React.Activity for Framer Motion v12 compatibility with React 19.2.x
// Framer Motion v12 uses React.Activity (ViewTransition) which isn't exported yet in React 19.2
import React from "react";
if (typeof (React as any).Activity === "undefined") {
  (React as any).Activity = ({ children }: { children: any }) => children;
}

import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import ErrorBoundary from "./components/ErrorBoundary";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ParentChildProvider } from "./contexts/ParentChildContext";
import { usePageTitle } from "./hooks/usePageTitle";

import "./index.css";

function PageTitleManager() {
  usePageTitle();
  return null;
}

// Monkey-patch history.pushState to suppress OAuth-related SecurityErrors
// These occur when trying to navigate to cross-origin OAuth URLs (manus.im/app-auth)
// The authentication still works via fallback (window.location.href), so these errors are harmless
const originalPushState = window.history.pushState;
window.history.pushState = function(...args) {
  try {
    return originalPushState.apply(this, args);
  } catch (error) {
    // Suppress SecurityError for OAuth cross-origin navigation
    if (error instanceof DOMException && 
        error.name === 'SecurityError' &&
        args[2]?.toString().includes('manus.im/app-auth')) {
      // Silently ignore - authentication will work via fallback
      console.debug('[OAuth] Cross-origin navigation blocked (expected), using fallback');
      // Return undefined to indicate the operation was handled
      return undefined;
    }
    // Re-throw other errors
    throw error;
  }
};

// Also monkey-patch replaceState for consistency
const originalReplaceState = window.history.replaceState;
window.history.replaceState = function(...args) {
  try {
    return originalReplaceState.apply(this, args);
  } catch (error) {
    if (error instanceof DOMException && 
        error.name === 'SecurityError' &&
        args[2]?.toString().includes('manus.im/app-auth')) {
      console.debug('[OAuth] Cross-origin navigation blocked (expected), using fallback');
      return undefined;
    }
    throw error;
  }
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on FORBIDDEN or UNAUTHORIZED errors - these are role-restricted endpoints
        if (error?.data?.code === 'FORBIDDEN' || error?.data?.code === 'UNAUTHORIZED') return false;
        return failureCount < 2;
      },
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  try { (window.top || window).location.href = getLoginUrl(); } catch { window.open(getLoginUrl(), '_top'); }
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    // Suppress FORBIDDEN errors - expected for role-restricted endpoints (e.g. parent-only queries)
    if ((error as any)?.data?.code !== 'FORBIDDEN') {
      console.error("[API Query Error]", error);
    }
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

// Register service worker for PWA offline support
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((reg) => console.debug('[SW] Registered:', reg.scope))
      .catch((err) => console.debug('[SW] Registration failed:', err));
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <PageTitleManager />
          <ParentChildProvider>
            <App />
          </ParentChildProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </trpc.Provider>
  </ErrorBoundary>
);
