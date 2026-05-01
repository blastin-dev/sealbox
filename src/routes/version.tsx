import { createFileRoute } from "@tanstack/react-router";
import {
	CheckCircle2,
	ExternalLink,
	GitCommit,
	Github,
	Tag,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
	BUILT_AT,
	COMMIT_URL,
	GIT_RELEASE_URL,
	GIT_REPO,
	GIT_RUN_URL,
	GIT_TAG,
	IS_PINNED_BUILD,
	IS_RELEASE_BUILD,
	REPO_URL,
	SHORT_SHA,
} from "@/lib/build";

export const Route = createFileRoute("/version")({ component: VersionPage });

function VersionPage() {
	return (
		<>
			<section className="relative overflow-hidden bg-gradient-to-b from-emerald-500/15 to-emerald-500/8 pt-12 pb-32">
				<div className="mx-auto max-w-2xl px-6 text-center">
					<div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-500/30">
						<CheckCircle2 className="size-5" />
					</div>
					<h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
						Build provenance
					</h1>
					<p className="mt-3 text-base text-muted-foreground">
						This page lists the exact commit and CI run this site was built
						from. Verify it against the public repo.
					</p>
				</div>
			</section>
			<div className="relative z-10 -mt-24 px-6 pb-16">
				<div className="mx-auto max-w-2xl">
					<Card className="shadow-xl shadow-emerald-500/10">
						<CardContent className="space-y-4">
							{IS_RELEASE_BUILD && (
								<Row label="Release">
									<a
										href={
											GIT_RELEASE_URL || `${REPO_URL}/releases/tag/${GIT_TAG}`
										}
										target="_blank"
										rel="noreferrer noopener"
										className="inline-flex items-center gap-1.5 font-mono text-sm underline-offset-4 hover:underline"
									>
										<Tag className="size-4" />
										{GIT_TAG}
										<ExternalLink className="size-3" />
									</a>
								</Row>
							)}
							<Row label="Commit">
								{IS_PINNED_BUILD ? (
									<a
										href={COMMIT_URL}
										target="_blank"
										rel="noreferrer noopener"
										className="inline-flex items-center gap-1.5 font-mono text-sm underline-offset-4 hover:underline"
									>
										<GitCommit className="size-4" />
										{SHORT_SHA}
										<ExternalLink className="size-3" />
									</a>
								) : (
									<span className="font-mono text-sm text-muted-foreground">
										dev (unpinned local build)
									</span>
								)}
							</Row>
							<Row label="Repository">
								<a
									href={REPO_URL}
									target="_blank"
									rel="noreferrer noopener"
									className="inline-flex items-center gap-1.5 text-sm underline-offset-4 hover:underline"
								>
									<Github className="size-4" />
									{GIT_REPO}
									<ExternalLink className="size-3" />
								</a>
							</Row>
							{GIT_RUN_URL && (
								<Row label="CI run">
									<a
										href={GIT_RUN_URL}
										target="_blank"
										rel="noreferrer noopener"
										className="inline-flex items-center gap-1.5 text-sm underline-offset-4 hover:underline"
									>
										View workflow run
										<ExternalLink className="size-3" />
									</a>
								</Row>
							)}
							{BUILT_AT && (
								<Row label="Built at">
									<span className="text-sm text-muted-foreground">
										{formatBuiltAt(BUILT_AT)}
									</span>
								</Row>
							)}
						</CardContent>
					</Card>

					<div className="mt-8 rounded-lg border bg-muted/20 p-5 text-sm text-muted-foreground">
						<h2 className="mb-2 font-medium text-foreground">
							How to verify
						</h2>
						<p className="mb-3">
							The quick check: confirm the release, commit, and CI run links
							above all exist in the public repo. The cryptographic check, for
							anyone who wants real proof:
						</p>
						<pre className="overflow-x-auto rounded-md border bg-background px-3 py-2 font-mono text-xs">
							{`gh release download ${IS_RELEASE_BUILD ? GIT_TAG : "<tag>"} --repo ${GIT_REPO} -p '*.tar.gz'
gh attestation verify sealbox-${IS_RELEASE_BUILD ? GIT_TAG : "<tag>"}.tar.gz --repo ${GIT_REPO}`}
						</pre>
						<p className="mt-3 text-xs">
							The artifact is signed via Sigstore using GitHub's OIDC identity
							(SLSA build provenance). The signature ties the bundle to this
							exact workflow run, repo, and commit — no shared secret to leak.
						</p>
					</div>
				</div>
			</div>
		</>
	);
}

function Row({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-1 border-b py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
			<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
				{label}
			</span>
			<div className="min-w-0">{children}</div>
		</div>
	);
}

function formatBuiltAt(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString();
}
