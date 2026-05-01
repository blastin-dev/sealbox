export const GIT_SHA = __GIT_SHA__;
export const GIT_TAG = __GIT_TAG__;
export const GIT_REPO = __GIT_REPO__;
export const GIT_RUN_URL = __GIT_RUN_URL__;
export const GIT_RELEASE_URL = __GIT_RELEASE_URL__;
export const BUILT_AT = __BUILT_AT__;

export const SHORT_SHA = GIT_SHA.slice(0, 7);
export const REPO_URL = `https://github.com/${GIT_REPO}`;
export const COMMIT_URL =
	GIT_SHA === "dev" ? REPO_URL : `${REPO_URL}/commit/${GIT_SHA}`;
export const IS_PINNED_BUILD = GIT_SHA !== "dev";
export const IS_RELEASE_BUILD = IS_PINNED_BUILD && GIT_TAG !== "";
