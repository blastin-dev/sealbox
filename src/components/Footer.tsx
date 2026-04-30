import { Github } from "lucide-react";

const REPO_URL = "https://github.com/blastin-dev/sealbox";
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
		</footer>
	);
}
