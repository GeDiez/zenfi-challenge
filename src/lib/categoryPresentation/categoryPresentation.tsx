import {
  EntertainmentIcon,
  FoodIcon,
  GroceriesIcon,
  HealthIcon,
  HousingIcon,
  InsuranceIcon,
  RecurringIcon,
  ServicesIcon,
  ShoppingIcon,
  TransportIcon,
  UncategorisedIcon,
} from '../../components/icons'

type Presentation = {
  /** Categorical slot token, or the neutral for the no-category bucket. */
  colorVar: string
  Icon: (props: { className?: string }) => React.ReactElement
}

/**
 * THE single mapping from a category to how it looks.
 *
 * The slot each category gets is FIXED and written down here on purpose. It is
 * NOT derived from the current ranking: deriving it would repaint the page
 * whenever one category overtakes another, and a reader who learned "vivienda
 * is blue" would be misled the following month.
 *
 * The ORDER of the slots is a safety mechanism, not a style choice. These ten
 * hues in slot order clear every adjacent colour-blind and normal-vision gate
 * in both themes; reordering them breaks it (aqua beside teal drops the dark
 * normal-vision floor to ΔE 11.4, under the 15 required). Adding an eleventh
 * hue means re-running the palette validator, not picking one that looks nice.
 *
 * Light-mode CVD separation sits in the 6–8 band, which is legal ONLY because a
 * label accompanies every swatch — in the table, in the filter and on the hero
 * cards. Colour here reinforces identity; it never carries it alone.
 */
const SLOTS: Record<string, Presentation> = {
  vivienda: { colorVar: '--color-series-1', Icon: HousingIcon },
  supermercado: { colorVar: '--color-series-2', Icon: GroceriesIcon },
  compras: { colorVar: '--color-series-3', Icon: ShoppingIcon },
  comida: { colorVar: '--color-series-4', Icon: FoodIcon },
  seguros: { colorVar: '--color-series-5', Icon: InsuranceIcon },
  servicios: { colorVar: '--color-series-6', Icon: ServicesIcon },
  entretenimiento: { colorVar: '--color-series-7', Icon: EntertainmentIcon },
  salud: { colorVar: '--color-series-8', Icon: HealthIcon },
  transporte: { colorVar: '--color-series-9', Icon: TransportIcon },
  suscripciones: { colorVar: '--color-series-10', Icon: RecurringIcon },
}

/**
 * The absence of a category is not a category, so it gets no hue of its own.
 * Spending a categorical slot on "we don't know" would make it look like a
 * peer of the real ones.
 */
const NEUTRAL: Presentation = {
  colorVar: '--color-ink-muted',
  Icon: UncategorisedIcon,
}

export function categoryPresentation(categoryId: string): Presentation {
  return SLOTS[categoryId] ?? NEUTRAL
}

/** True when the category owns one of the categorical hues. */
export function hasOwnHue(categoryId: string): boolean {
  return categoryId in SLOTS
}
