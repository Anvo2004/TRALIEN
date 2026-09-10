import { defineConfig, loadEnv, splitVendorChunkPlugin } from "vite";
import react from "@vitejs/plugin-react";
import zaloMiniApp from "zmp-vite-plugin";

export default defineConfig(({ mode }) => {
  // zmp-ui's ZMPRouter hardcodes basename = "/zapps/" + window.APP_ID in production
  // builds (matching Zalo's own hosting path). Without this, window.APP_ID is
  // undefined and the router silently matches nothing -> blank page with no error.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    // zmp-cli's build/deploy pipeline (zmp-cli-core's buildApp) hardcodes
    // `root: cwd` when invoking vite.build(), overriding whatever `root` is set
    // here. index.html must live at the project root to match, or `zmp-cli
    // deploy` / the VSCode extension's Deploy button fails with
    // "Could not resolve entry module index.html".
    base: "",
    define: {
      "window.APP_ID": JSON.stringify(env.APP_ID || ""),
    },
    plugins: [react(), splitVendorChunkPlugin(), zaloMiniApp()],
    // zmp-ui bundles its own `import ... from "react-router-dom"` (ZMPRouter.js).
    // Without an explicit include, Vite's dependency crawl can, depending on scan
    // order, end up giving zmp-ui's internal usage a different optimized copy than
    // the app's own react-router-dom import — two separate module instances means
    // two separate React Context objects, so Layout's useLocation() (reading from
    // one) can't see ZMPRouter's Provider (writing to the other): "useLocation()
    // may be used only in the context of a <Router> component", despite ZMPRouter
    // visibly wrapping it. Forcing the include pins a single shared instance.
    optimizeDeps: {
      include: ["react-router-dom"],
    },
    build: {
      outDir: "www",
      emptyOutDir: true,
      assetsDir: "assets",
    },
    preview: {
      allowedHosts: ["tralien.dxvtech.vn"],
    },
  };
});
