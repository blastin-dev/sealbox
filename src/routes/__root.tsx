import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { WalletProvider } from "../components/WalletProvider";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Sealbox — End-to-end encrypted message delivery",
			},
			{
				name: "description",
				content:
					"Receive messages encrypted to your crypto wallet. Senders share a secret through a one-time link; the server only ever stores ciphertext.",
			},
			{
				name: "theme-color",
				content: "#1e3a8a",
			},
			{ property: "og:type", content: "website" },
			{ property: "og:title", content: "Sealbox" },
			{
				property: "og:description",
				content:
					"Receive messages encrypted to your crypto wallet. The server only ever sees ciphertext.",
			},
			{ property: "og:image", content: "/og-image.png" },
			{ property: "og:image:width", content: "2816" },
			{ property: "og:image:height", content: "1536" },
			{ property: "og:image:alt", content: "Sealbox" },
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: "Sealbox" },
			{
				name: "twitter:description",
				content:
					"Receive messages encrypted to your crypto wallet. The server only ever sees ciphertext.",
			},
			{ name: "twitter:image", content: "/og-image.png" },
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				type: "image/x-icon",
				href: "/favicon.ico",
				sizes: "any",
			},
			{
				rel: "icon",
				type: "image/png",
				href: "/favicon-32.png",
				sizes: "32x32",
			},
			{
				rel: "apple-touch-icon",
				href: "/icon-192.png",
				sizes: "192x192",
			},
			{
				rel: "manifest",
				href: "/manifest.json",
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<WalletProvider>
					<div className="flex min-h-screen flex-col">
						<Header />
						<main className="flex-1">{children}</main>
						<Footer />
					</div>
				</WalletProvider>
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
