import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getCloudflareEnv(): Promise<Cloudflare.Env | null> {
  try {
    const ctx = await getCloudflareContext({ async: true });
    return (ctx?.env as Cloudflare.Env | undefined) ?? null;
  } catch {
    return null;
  }
}
