"use client";

import * as React from "react";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";
import { useServerInsertedHTML } from "next/navigation";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "../theme";

// Emotion cache with RTL stylis plugin
function createEmotionCache() {
  // Configure RTL via stylisPlugins per @emotion/cache API
  return createCache({
    key: "muirtl",
    // This is the supported way to apply plugins; avoids accessing cache.stylis
    // which may be undefined depending on bundling/runtime.
    stylisPlugins: [rtlPlugin],
  });
}

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [cache] = React.useState(() => createEmotionCache());

  useServerInsertedHTML(() => {
    // Serialize inserted styles for server-rendered HTML
    // @ts-ignore inserted exists at runtime
    const inserted = cache.inserted || {};
    const keys = Object.keys(inserted);
    if (keys.length === 0) return null;

    // Build style content
    const styles = keys
      // @ts-ignore inserted is a record of css strings
      .map((k) => inserted[k])
      .join(" ");

    return (
      <style
        data-emotion={`${cache.key} ${keys.join(" ")}`}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
