import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	define: {
		__GIT_SHA__: JSON.stringify(process.env.GIT_SHA ?? "dev"),
		__GIT_TAG__: JSON.stringify(process.env.GIT_TAG ?? ""),
		__GIT_REPO__: JSON.stringify(
			process.env.GIT_REPO ?? "blastin-dev/sealbox",
		),
		__GIT_RUN_URL__: JSON.stringify(process.env.GIT_RUN_URL ?? ""),
		__GIT_RELEASE_URL__: JSON.stringify(process.env.GIT_RELEASE_URL ?? ""),
		__BUILT_AT__: JSON.stringify(process.env.BUILT_AT ?? ""),
	},
	plugins: [
		devtools(),
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
});

export default config;
