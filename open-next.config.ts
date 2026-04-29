// default open-next.config.ts file created by @opennextjs/cloudflare
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
// import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

export default defineCloudflareConfig({
	// R2 incremental cache is intentionally disabled to keep storage and egress costs near zero.
	// Enable only if traffic/performance requirements justify extra cost.
	// incrementalCache: r2IncrementalCache
});
