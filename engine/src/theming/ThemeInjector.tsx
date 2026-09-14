import { useEffect } from 'react'

const STYLE_ELEMENT_ID = 'scenario-theme-css'

/**
 * Injecte dynamiquement le CSS custom d'un scénario (theme.css) dans le
 * <head>, et le retire proprement à la sortie du scénario ou au changement
 * de scénario, pour éviter toute fuite de style entre scénarios.
 */
export function ThemeInjector({ href }: { href: string | null }) {
  useEffect(() => {
    if (!href) return

    let link = document.getElementById(STYLE_ELEMENT_ID) as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.id = STYLE_ELEMENT_ID
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    link.href = href

    return () => {
      link?.remove()
    }
  }, [href])

  return null
}
