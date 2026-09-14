import { Howl, Howler } from 'howler'

/**
 * Wrapper autour de Howler pour gérer musique d'ambiance (boucle, fade)
 * et effets sonores ponctuels (succès/échec puzzle, collecte d'objet).
 *
 * Important (mobile) : les navigateurs mobiles bloquent l'autoplay audio
 * tant qu'il n'y a pas eu d'interaction utilisateur explicite. Le moteur
 * n'appelle donc jamais `playAmbient` automatiquement au chargement ; il
 * attend un geste explicite (ex: bouton "Commencer l'enquête") via
 * `unlockAudioContext()`.
 */
class AudioManager {
  private ambient: Howl | null = null
  private ambientSrc: string | null = null
  private unlocked = false

  /** À appeler depuis un handler de clic/tap utilisateur (ex: bouton Start). */
  unlockAudioContext(): void {
    if (this.unlocked) return
    // Force Howler/WebAudio à sortir de l'état "suspended" sur mobile.
    if (Howler.ctx && Howler.ctx.state === 'suspended') {
      void Howler.ctx.resume()
    }
    this.unlocked = true
  }

  isUnlocked(): boolean {
    return this.unlocked
  }

  playAmbient(src: string, { volume = 0.5, fadeMs = 800 }: { volume?: number; fadeMs?: number } = {}): void {
    if (this.ambientSrc === src && this.ambient?.playing()) return
    this.stopAmbient(fadeMs)
    const howl = new Howl({ src: [src], loop: true, volume: 0 })
    howl.play()
    howl.fade(0, volume, fadeMs)
    this.ambient = howl
    this.ambientSrc = src
  }

  stopAmbient(fadeMs = 500): void {
    if (!this.ambient) return
    const current = this.ambient
    current.fade(current.volume(), 0, fadeMs)
    window.setTimeout(() => current.stop(), fadeMs)
    this.ambient = null
    this.ambientSrc = null
  }

  playSfx(src: string, { volume = 0.8 }: { volume?: number } = {}): void {
    const howl = new Howl({ src: [src], volume })
    howl.play()
  }

  muteAll(muted: boolean): void {
    Howler.mute(muted)
  }
}

export const audioManager = new AudioManager()
