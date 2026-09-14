import { ManifestSchema, ScenarioSchema } from '../schema'
import type { Manifest, ManifestEntry, Scenario } from '../../types/scenario'

/**
 * Toutes les URLs sont relatives à BASE_URL (configuré dans vite.config.ts),
 * ce qui permet de fonctionner aussi bien en dev qu'une fois déployé sous
 * https://<user>.github.io/escapegame/.
 */
const scenariosBaseUrl = `${import.meta.env.BASE_URL}scenarios`

export class ScenarioLoadError extends Error {
  readonly cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'ScenarioLoadError'
    this.cause = cause
  }
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new ScenarioLoadError(`Impossible de charger ${url} (HTTP ${res.status})`)
  }
  try {
    return await res.json()
  } catch (err) {
    throw new ScenarioLoadError(`JSON invalide dans ${url}`, err)
  }
}

/** Charge et valide le manifeste listant tous les scénarios disponibles. */
export async function loadManifest(): Promise<Manifest> {
  const raw = await fetchJson(`${scenariosBaseUrl}/manifest.json`)
  const result = ManifestSchema.safeParse(raw)
  if (!result.success) {
    throw new ScenarioLoadError(
      `manifest.json invalide : ${result.error.message}`,
      result.error,
    )
  }
  return result.data
}

/** Charge et valide un scénario complet à partir de son entrée de manifeste. */
export async function loadScenario(entry: ManifestEntry): Promise<Scenario> {
  const raw = await fetchJson(`${scenariosBaseUrl}/${entry.path}/scenario.json`)
  const result = ScenarioSchema.safeParse(raw)
  if (!result.success) {
    throw new ScenarioLoadError(
      `scenario.json invalide pour "${entry.id}" : ${result.error.message}`,
      result.error,
    )
  }
  if (result.data.id !== entry.id) {
    throw new ScenarioLoadError(
      `scenario.json invalide pour "${entry.id}" : l'id déclaré est "${result.data.id}".`,
    )
  }
  return result.data
}

/** Construit l'URL publique d'un asset relatif au dossier du scénario (assets/images/xxx.png, etc). */
export function resolveScenarioAssetUrl(scenarioPath: string, relativePath: string): string {
  return `${scenariosBaseUrl}/${scenarioPath}/${relativePath}`
}

/** URL du fichier CSS custom du scénario, s'il en déclare un. */
export function resolveScenarioThemeUrl(scenarioPath: string, themeFile: string): string {
  return `${scenariosBaseUrl}/${scenarioPath}/${themeFile}`
}
