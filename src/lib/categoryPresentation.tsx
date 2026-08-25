import {
  EntertainmentIcon,
  FoodIcon,
  InsuranceIcon,
  TransportIcon,
} from '../components/icons'
import type { ExpenseCategoryId } from '../data/expenses'

type Presentation = {
  /** Categorical slot token, e.g. `--color-series-1`. */
  colorVar: string
  Icon: (props: { className?: string }) => React.ReactElement
}

/**
 * THE single mapping from a category to how it looks. Kept in one module on
 * purpose: a second copy in another component would agree on the day it was
 * written and drift the first time a slot changes, leaving the same category
 * two different colours on the same page.
 *
 * The slot each category gets is FIXED. Assigning colour by current rank would
 * repaint everything whenever one category overtakes another, and a reader who
 * learned "comidas is yellow" would be misled the next month.
 */
export const CATEGORY_PRESENTATION: Record<ExpenseCategoryId, Presentation> = {
  entertainment: { colorVar: '--color-series-1', Icon: EntertainmentIcon },
  food: { colorVar: '--color-series-2', Icon: FoodIcon },
  transport: { colorVar: '--color-series-3', Icon: TransportIcon },
  insurance: { colorVar: '--color-series-4', Icon: InsuranceIcon },
}
