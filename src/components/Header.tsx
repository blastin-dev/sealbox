import { Link } from "@tanstack/react-router";
import { Github } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConnectButton } from "./ConnectButton";

const REPO_URL = "https://github.com/blastin-dev/sealbox";

export function Header() {
	return (
		<header className="border-b bg-background">
			<div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
				<Link to="/" className="flex items-center gap-2 font-semibold">
					<img
						src="/logo.png"
						alt="Sealbox"
						className="size-7"
						width={28}
						height={28}
					/>
					Sealbox
				</Link>
				<nav className="flex items-center gap-1">
					<Button asChild variant="ghost" size="sm">
						<Link to="/new">New request</Link>
					</Button>
					<Button asChild variant="ghost" size="sm">
						<Link to="/inbox">Inbox</Link>
					</Button>
					<Button asChild variant="ghost" size="icon" aria-label="GitHub">
						<a href={REPO_URL} target="_blank" rel="noreferrer noopener">
							<Github className="size-4" />
						</a>
					</Button>
					<div className="ml-2">
						<ConnectButton />
					</div>
				</nav>
			</div>
		</header>
	);
}
