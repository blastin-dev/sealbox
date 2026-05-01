type IconProps = { className?: string };

export function MetaMaskIcon({ className }: IconProps) {
	return (
		<svg
			viewBox="0 0 32 32"
			className={className}
			aria-hidden="true"
			fill="none"
		>
			<title>MetaMask</title>
			<path
				d="M28.4 4 17.6 12.3l2-4.7L28.4 4z"
				fill="#E2761B"
				stroke="#E2761B"
				strokeLinejoin="round"
			/>
			<path
				d="M3.6 4 14.3 12.4l-1.9-4.8L3.6 4z"
				fill="#E4761B"
				stroke="#E4761B"
				strokeLinejoin="round"
			/>
			<path
				d="M24.5 22.7 21.6 27.1 27.8 28.8l1.8-6-5.1-.1z"
				fill="#E4761B"
				stroke="#E4761B"
				strokeLinejoin="round"
			/>
			<path
				d="M2.4 22.8 4.2 28.8l6.2-1.7-2.9-4.4-5.1.1z"
				fill="#E4761B"
				stroke="#E4761B"
				strokeLinejoin="round"
			/>
			<path
				d="M10.1 14.4 8.4 17 14.5 17.3l-.2-6.6-4.2 3.7z"
				fill="#E4761B"
				stroke="#E4761B"
				strokeLinejoin="round"
			/>
			<path
				d="M21.9 14.4 17.6 10.6l-.1 6.7 6.1-.3-1.7-2.6z"
				fill="#E4761B"
				stroke="#E4761B"
				strokeLinejoin="round"
			/>
			<path
				d="M10.4 27.1 14.1 25.3l-3.2-2.5-.5 4.3z"
				fill="#E4761B"
				stroke="#E4761B"
				strokeLinejoin="round"
			/>
			<path
				d="M17.9 25.3 21.6 27.1 21.1 22.8 17.9 25.3z"
				fill="#E4761B"
				stroke="#E4761B"
				strokeLinejoin="round"
			/>
			<path
				d="M21.6 27.1 17.9 25.3l.3 2.4v1l3.4-1.6z"
				fill="#D7C1B3"
				stroke="#D7C1B3"
				strokeLinejoin="round"
			/>
			<path
				d="M10.4 27.1 13.8 28.7v-1l.3-2.4-3.7 1.8z"
				fill="#D7C1B3"
				stroke="#D7C1B3"
				strokeLinejoin="round"
			/>
			<path
				d="M18.2 23.4l-.4-.3H14.2l-.4.3-.3 4 3.2-1.6 3.2 1.6-.7-4z"
				fill="#161616"
				stroke="#161616"
				strokeLinejoin="round"
			/>
			<path
				d="M28.6 11.5 29.6 7l-1.2-3-10.8 8.1 4.1 3.5 5.9 1.7 1.3-1.5-.6-.4 1-.9-.7-.5.9-.7-.9-.8z"
				fill="#763D16"
				stroke="#763D16"
				strokeLinejoin="round"
			/>
			<path
				d="M2.4 7 3.4 11.5l-.7.8.9.7-.7.5 1 .9-.6.4 1.3 1.5 5.9-1.7 4.1-3.5L3.6 4 2.4 7z"
				fill="#763D16"
				stroke="#763D16"
				strokeLinejoin="round"
			/>
			<path
				d="M27.6 16.3l-5.9-1.7 1.8 2.7-2.6 5.1L24.5 22.7H29.6L27.6 16.3z"
				fill="#F6851B"
				stroke="#F6851B"
				strokeLinejoin="round"
			/>
			<path
				d="M10.3 14.6 4.4 16.3 2.4 22.7H7.5L11 22.4l-2.6-5.1 1.8-2.7z"
				fill="#F6851B"
				stroke="#F6851B"
				strokeLinejoin="round"
			/>
			<path
				d="M17.6 17.3 18 11l1.8-4.7H12.3L14.1 11l.4 6.3.1 2v4.5h2.9l.0-4.5.1-2z"
				fill="#F6851B"
				stroke="#F6851B"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export function TrustWalletIcon({ className }: IconProps) {
	return (
		<svg
			viewBox="0 0 32 32"
			className={className}
			aria-hidden="true"
			fill="none"
		>
			<title>Trust Wallet</title>
			<path
				d="M16 3 5 6.6v8.5C5 21.4 9.6 26.7 16 29c6.4-2.3 11-7.6 11-13.9V6.6L16 3z"
				fill="#0500FF"
			/>
			<path d="M16 6.2v19.7c4.6-1.7 8-5.6 8-10.7V8.8L16 6.2z" fill="#0A2DFF" />
		</svg>
	);
}

export function BraveWalletIcon({ className }: IconProps) {
	return (
		<svg
			viewBox="0 0 32 32"
			className={className}
			aria-hidden="true"
			fill="none"
		>
			<title>Brave Wallet</title>
			<path
				d="m27 9.4-1.2-3.2-1.6-1.7L20.6 6 16 4l-4.6 2-3.6-1.5L6.2 6.2 5 9.4l1.5 1.7L6 13l1.5 5.4L9 23.5l1.7 2.3 4.4 3.1c.6.4 1.4.4 2 0l4.4-3.1 1.7-2.3 1.5-5L26 13l-.5-1.9L27 9.4z"
				fill="#FB542B"
			/>
			<path
				d="m21.7 18.7-1.7-2 .9-2.5-.9-.9-1.5.4-3.5-3.4-3.5 3.4-1.5-.4-.9.9.9 2.5-1.7 2 5.6 4.3.5.4.5-.4 5.6-4.3z"
				fill="#fff"
			/>
		</svg>
	);
}
