const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif']

/** Détermine si un chemin d'asset pointe vers une image (par extension), pour savoir si on peut l'afficher inline / dans le Lightbox, plutôt qu'un simple lien de téléchargement (ex: PDF). */
export function isImageAsset(path: string): boolean {
  const lower = path.toLowerCase().split(/[?#]/)[0]
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))
}
