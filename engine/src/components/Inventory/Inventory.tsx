import { resolveScenarioAssetUrl } from '../../core/loader/scenarioLoader'
import type { InventoryItem } from '../../types/scenario'
import styles from './Inventory.module.css'

interface InventoryProps {
  items: InventoryItem[]
  collectedItemIds: string[]
  consumedItemIds: string[]
  scenarioPath: string
  selectedItemId: string | null
  onSelectItem: (itemId: string | null) => void
}

export function Inventory({
  items,
  collectedItemIds,
  consumedItemIds,
  scenarioPath,
  selectedItemId,
  onSelectItem,
}: InventoryProps) {
  const collected = items.filter(
    (item) => collectedItemIds.includes(item.id) && !consumedItemIds.includes(item.id),
  )
  const selectedItem = collected.find((item) => item.id === selectedItemId)

  if (collected.length === 0) return null

  return (
    <div className={styles.bar} aria-label="Inventaire">
      {selectedItem && (
        <div className={styles.details} aria-live="polite">
          <strong>{selectedItem.name}</strong>
          {selectedItem.description && <span>{selectedItem.description}</span>}
        </div>
      )}
      <div className={styles.items} role="list">
        {collected.map((item) => {
          const selected = item.id === selectedItemId
          return (
            <div key={item.id} role="listitem">
              <button
                type="button"
                className={`${styles.item} ${selected ? styles.selected : ''}`}
                title={item.description ?? item.name}
                aria-label={`${item.name}${item.description ? ` : ${item.description}` : ''}`}
                aria-pressed={selected}
                onClick={() => onSelectItem(selected ? null : item.id)}
              >
                {item.icon ? (
                  <img
                    className={styles.icon}
                    src={resolveScenarioAssetUrl(scenarioPath, item.icon)}
                    alt=""
                  />
                ) : (
                  <span className={styles.iconPlaceholder} aria-hidden="true">
                    {item.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
