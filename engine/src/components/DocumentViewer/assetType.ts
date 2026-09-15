const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif']

/** Détermine si un asset peut être affiché inline plutôt que via un lien (ex: PDF). */
export function isImageAsset(path: string): boolean {
  const lower = path.toLowerCase().split(/[?#]/)[0]
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))
}
