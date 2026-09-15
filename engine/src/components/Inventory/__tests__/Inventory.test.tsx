import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Inventory } from '../Inventory'

const items = [
  { id: 'cle', name: 'Clé', description: 'Une petite clé' },
  { id: 'medaillon', name: 'Médaillon' },
]

describe('Inventory', () => {
  it('affiche seulement les objets possédés et non consommés', () => {
    render(
      <Inventory
        items={items}
        collectedItemIds={['cle', 'medaillon']}
        consumedItemIds={['cle']}
        scenarioPath="demo"
        selectedItemId={null}
        onSelectItem={() => {}}
      />,
    )

    expect(screen.queryByRole('button', { name: /Clé/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Médaillon' })).toBeTruthy()
  })

  it('sélectionne et désélectionne un objet avec un bouton accessible', () => {
    const onSelectItem = vi.fn()
    const { rerender } = render(
      <Inventory
        items={items}
        collectedItemIds={['cle']}
        consumedItemIds={[]}
        scenarioPath="demo"
        selectedItemId={null}
        onSelectItem={onSelectItem}
      />,
    )

    const button = screen.getByRole('button', { name: /Clé/ })
    expect(button.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(button)
    expect(onSelectItem).toHaveBeenCalledWith('cle')

    rerender(
      <Inventory
        items={items}
        collectedItemIds={['cle']}
        consumedItemIds={[]}
        scenarioPath="demo"
        selectedItemId="cle"
        onSelectItem={onSelectItem}
      />,
    )
    expect(screen.getByRole('button', { name: /Clé/ }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText('Une petite clé')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Clé/ }))
    expect(onSelectItem).toHaveBeenLastCalledWith(null)
  })
})
