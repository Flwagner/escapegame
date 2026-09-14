import { HashRouter, Route, Routes } from 'react-router-dom'
import { ScenarioSelector } from '../components/ScenarioSelector/ScenarioSelector'
import { PlayScreen } from '../components/PlayScreen/PlayScreen'

/**
 * HashRouter volontairement choisi : GitHub Pages ne permet pas de config
 * serveur pour rediriger toutes les routes vers index.html, le hash routing
 * évite donc les 404 au rafraîchissement d'une page profonde (/#/play/xxx).
 */
export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<ScenarioSelector />} />
        <Route path="/play/:scenarioId" element={<PlayScreen />} />
      </Routes>
    </HashRouter>
  )
}
