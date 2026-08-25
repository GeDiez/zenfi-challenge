/*
 * Icons are inline SVG drawn with `currentColor`, so the CALLER sets the colour
 * through a text utility. A hard-coded multi-colour SVG would be an image, not
 * an icon.
 */

type IconProps = {
  className?: string
}

const BASE = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const

export const GithubIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58l-.01-2.05c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.12-.31-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.18.77.84 1.24 1.91 1.24 3.23 0 4.63-2.81 5.65-5.49 5.95.43.37.82 1.1.82 2.22l-.01 3.29c0 .32.21.7.82.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" />
  </svg>
)

export const EntertainmentIcon = ({ className }: IconProps) => (
  <svg {...BASE} className={className}>
    <path d="M4 6h16a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4V7a1 1 0 0 1 1-1Z" />
    <path d="M14 6v12" strokeDasharray="2 3" />
  </svg>
)

export const FoodIcon = ({ className }: IconProps) => (
  <svg {...BASE} className={className}>
    <path d="M6 3v7a2 2 0 0 0 4 0V3" />
    <path d="M8 10v11" />
    <path d="M17 3c-1.5 1.5-2 3.5-2 6s.5 3 2 3 2-.5 2-3-.5-4.5-2-6Z" />
    <path d="M17 12v9" />
  </svg>
)

export const TransportIcon = ({ className }: IconProps) => (
  <svg {...BASE} className={className}>
    <path d="M5 17h14M4 17v-4.5L6 7h12l2 5.5V17" />
    <path d="M4 12.5h16" />
    <circle cx="7.5" cy="17" r="1.5" />
    <circle cx="16.5" cy="17" r="1.5" />
  </svg>
)

export const InsuranceIcon = ({ className }: IconProps) => (
  <svg {...BASE} className={className}>
    <path d="M12 3l7 3v5.5c0 4-2.9 7.7-7 9.5-4.1-1.8-7-5.5-7-9.5V6l7-3Z" />
    <path d="M9.5 12l1.8 1.8 3.4-3.6" />
  </svg>
)

export const RecurringIcon = ({ className }: IconProps) => (
  <svg {...BASE} className={className}>
    <path d="M3 12a9 9 0 0 1 15.3-6.4L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15.3 6.4L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
)

export const ReviewIcon = ({ className }: IconProps) => (
  <svg {...BASE} className={className}>
    <path d="M12 3.5 21 20H3L12 3.5Z" />
    <path d="M12 10v4" />
    <path d="M12 17.2v.1" />
  </svg>
)

export const RefundIcon = ({ className }: IconProps) => (
  <svg {...BASE} className={className}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h11a5 5 0 0 1 0 10h-3" />
  </svg>
)

export const ChevronDownIcon = ({ className }: IconProps) => (
  <svg {...BASE} className={className}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export const HousingIcon = ({ className }: IconProps) => (
  <svg {...BASE} className={className}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.8V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.8" />
    <path d="M9.5 21v-6h5v6" />
  </svg>
)

export const GroceriesIcon = ({ className }: IconProps) => (
  <svg {...BASE} className={className}>
    <path d="M2.5 3h2.2l2.3 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L20 7H6" />
    <circle cx="9.5" cy="19.5" r="1.4" />
    <circle cx="17" cy="19.5" r="1.4" />
  </svg>
)

export const ShoppingIcon = ({ className }: IconProps) => (
  <svg {...BASE} className={className}>
    <path d="M5 8h14l-1 12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
)

export const ServicesIcon = ({ className }: IconProps) => (
  <svg {...BASE} className={className}>
    <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2Z" />
  </svg>
)

export const HealthIcon = ({ className }: IconProps) => (
  <svg {...BASE} className={className}>
    <path d="M12 20.5C7.5 17.8 4 14.2 4 10.3A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 8 2.3c0 3.9-3.5 7.5-8 10.2Z" />
  </svg>
)

export const UncategorisedIcon = ({ className }: IconProps) => (
  <svg {...BASE} className={className}>
    <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
    <path d="M9.6 9.5a2.5 2.5 0 0 1 4.6 1.3c0 1.7-2.2 1.9-2.2 3.2" />
    <path d="M12 17.3v.1" />
  </svg>
)

export const SunIcon = ({ className }: IconProps) => (
  <svg {...BASE} className={className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)

export const MoonIcon = ({ className }: IconProps) => (
  <svg {...BASE} className={className}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
  </svg>
)
