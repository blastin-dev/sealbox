import { Link } from "@tanstack/react-router";
import { Github, Inbox, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConnectButton } from "./ConnectButton";

const REPO_URL = "https://github.com/blastin-dev/sealbox";

export function Header() {
	return (
		<header className="border-b bg-background">
			<div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4 sm:px-6">
				<Link to="/" className="flex shrink-0 items-center gap-2 font-semibold">
					<img
						src="/logo.png"
						alt="Sealbox"
						className="size-7"
						width={28}
						height={28}
					/>
					<span className="hidden sm:inline">Sealbox</span>
				</Link>
				<nav className="flex items-center gap-1">
					<Button
						asChild
						variant="ghost"
						size="sm"
						className="px-2 sm:px-3"
						aria-label="Create request"
					>
						<Link to="/request">
							<Plus className="size-4 sm:hidden" />
							<span className="hidden sm:inline">Create request</span>
						</Link>
					</Button>
					<Button
						asChild
						variant="ghost"
						size="sm"
						className="px-2 sm:px-3"
						aria-label="Inbox"
					>
						<Link to="/inbox">
							<Inbox className="size-4 sm:hidden" />
							<span className="hidden sm:inline">Inbox</span>
						</Link>
					</Button>
					<Button
						asChild
						variant="ghost"
						size="icon"
						aria-label="GitHub"
						className="hidden sm:inline-flex"
					>
						<a href={REPO_URL} target="_blank" rel="noreferrer noopener">
							<Github className="size-4" />
						</a>
					</Button>
					<div className="ml-1 sm:ml-2">
						<ConnectButton />
					</div>
				</nav>
			</div>
		</header>
	);
}
