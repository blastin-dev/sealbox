import { Link } from "@tanstack/react-router";
import { GitCommit, Github, Tag } from "lucide-react";

import {
	GIT_TAG,
	IS_PINNED_BUILD,
	IS_RELEASE_BUILD,
	REPO_URL,
	SHORT_SHA,
} from "@/lib/build";

const ORG_URL = "https://blastin.com.au";

export function Footer() {
	return (
		<footer className="mt-auto border-t bg-background py-6 text-sm text-muted-foreground">
			<div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 sm:flex-row sm:justify-between">
				<p>
					Developed by{" "}
					<a
						href={ORG_URL}
						target="_blank"
						rel="noreferrer noopener"
						className="font-medium text-foreground underline-offset-4 hover:underline"
					>
						Blastin
					</a>
				</p>
				<div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
					{IS_PINNED_BUILD && (
						<Link
							to="/version"
							className="inline-flex items-center gap-1.5 font-mono text-xs underline-offset-4 hover:text-foreground hover:underline"
							title="Build provenance"
						>
							{IS_RELEASE_BUILD ? (
								<>
									<Tag className="size-3.5" />
									{GIT_TAG}
								</>
							) : (
								<>
									<GitCommit className="size-3.5" />
									{SHORT_SHA}
								</>
							)}
						</Link>
					)}
					<a
						href={REPO_URL}
						target="_blank"
						rel="noreferrer noopener"
						className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline"
					>
						<Github className="size-4" />
						Open source on GitHub
					</a>
				</div>
			</div>
		</footer>
	);
}
