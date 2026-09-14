import { resolveScenarioAssetUrl } from '../../core/loader/scenarioLoader'
import type { InventoryItem } from '../../types/scenario'
import styles from './Inventory.module.css'

interface InventoryProps {
  items: InventoryItem[]
  collectedItemIds: string[]
  scenarioPath: string
}

export function Inventory({ items, collectedItemIds, scenarioPath }: InventoryProps) {
  const collected = items.filter((item) => collectedItemIds.includes(item.id))

  if (collected.length === 0) return null

  return (
    <div className={styles.bar} role="list" aria-label="Inventaire">
      {collected.map((item) => (
        <div key={item.id} className={styles.item} role="listitem" title={item.description ?? item.name}>
          {item.icon ? (
            <img
              className={styles.icon}
              src={resolveScenarioAssetUrl(scenarioPath, item.icon)}
              alt={item.name}
            />
          ) : (
            <span className={styles.iconPlaceholder} aria-hidden="true">
              {item.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
