import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [
		devtools(),
		nitro({
			rollupConfig: { external: [/^@sentry\//] },
			compatibilityDate: "2026-11-10",
			cloudflare: {
				deployConfig: true,
				nodeCompat: true,
				wrangler: {
					name: "tincan",
					routes: [{ pattern: "tincan.mehdi-bennouna.com", custom_domain: true }],
				},
			},
		}),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
});

export default config;
