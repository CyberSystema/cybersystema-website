// Cloudflare Image Resizing loader for next/image.
// Routes requests through `/cdn-cgi/image/...` so the Cloudflare zone
// resizes, re-encodes (AVIF/WebP via `format=auto`), and caches the
// optimal variant for each viewport size. Requires "Transform via URL"
// enabled on the zone (cybersystema.com). Remote sources are supported
// when "Transform with remote images" is also enabled.
//
// Docs: https://developers.cloudflare.com/images/transform-images/transform-via-url/

type LoaderArgs = {
  src: string;
  width: number;
  quality?: number;
};

export default function cloudflareImageLoader({ src, width, quality }: LoaderArgs): string {
  // Cap requested width: above ~1600px the visual gain on common displays is
  // negligible while bytes nearly double. Keeps thumbnails lean even on 3x DPR.
  const w = Math.min(Math.round(width), 1600);
  const params = [
    `width=${w}`,
    `quality=${Math.min(Math.max(quality ?? 82, 30), 95)}`,
    "format=auto",
    "fit=scale-down",
  ].join(",");
  // next/image always prefixes data URLs with `data:` — pass them through.
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;
  // Encode absolute URLs so query strings survive the path segment.
  const target = /^https?:\/\//.test(src) ? src : src.startsWith("/") ? src : `/${src}`;
  return `/cdn-cgi/image/${params}/${target}`;
}
