/**
 * The official Zenfi logo, vendored rather than hot-linked: an app that fetches
 * its own logo from someone else's CDN breaks when that CDN does, and leaks a
 * request on every page view.
 *
 * ONE change was made to the source asset. The wordmark ships as `fill="white"`
 * — the file is the `-light` variant, built for dark backgrounds, so on a light
 * surface it would render invisible. Those 8 paths now use
 * `currentColor`, which lets a single file serve both themes. The isotype keeps
 * its exact brand colours (#5B0BE1, #310F78, #0096FC) untouched.
 *
 * Source:
 * https://cdn.prod.website-files.com/5f072f7ce9986bbbc52e0986/63cb2cdd5c56b267a24a81a3_logo-zenfi-light.svg
 *
 * The raw .svg is deliberately NOT kept in src/assets: an unused copy is a
 * trap, since importing it would silently bring back the white wordmark that
 * disappears on the light theme.
 */

type Props = {
  className?: string
}

export const ZenfiLogo = ({ className }: Props) => (
  <svg
    viewBox="0 0 190 33"
    fill="none"
    role="img"
    aria-label="Zenfi"
    className={className}
  >
    <g clipPath="url(#clip0_1082_19777)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M31.5264 15.7629H15.7633L0 31.526H31.5264L47.2895 15.7629H31.5264Z"
        fill="#5B0BE1"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.7631 15.7629L0 31.526L31.5262 15.7629H15.7631Z"
        fill="#310F78"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.7631 -0.000244141L0 15.7628H15.7631H31.5262L47.2895 -0.000244141H15.7631Z"
        fill="#0096FC"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M59.1118 31.4272V29.4081L75.997 11.4915H59.4555L60.9185 9.30054H79.5201V11.3196L62.6349 29.236H80.4653L79.9927 31.4272H59.1118Z"
        fill="currentColor"
      />
      <mask
        id="mask0_1082_19777"
        style={{ maskType: 'alpha' }}
        maskUnits="userSpaceOnUse"
        x="89"
        y="8"
        width="24"
        height="25"
      >
        <path
          d="M89.5737 8.61279H112.947V32.1148H89.5737V8.61279Z"
          fill="currentColor"
        />
      </mask>
      <g mask="url(#mask0_1082_19777)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M110.283 19.0532C110.254 16.4472 109.466 14.4207 107.92 12.974C106.373 11.528 104.21 10.8038 101.432 10.8038C98.8253 10.8038 96.6987 11.5559 95.0518 13.0599C93.4043 14.5632 92.4953 16.5615 92.3237 19.0532H110.283ZM92.2376 21.1158C92.2948 23.8374 93.1467 25.9782 94.794 27.539C96.4409 29.1003 98.6823 29.8801 101.518 29.8801C103.723 29.8801 105.55 29.5087 106.996 28.7633C108.442 28.0188 109.423 26.9447 109.939 25.5409H112.56C111.959 27.6892 110.713 29.3218 108.822 30.4392C106.932 31.5562 104.468 32.1148 101.432 32.1148C97.7082 32.1148 94.8009 31.1049 92.7104 29.0858C90.619 27.0662 89.5737 24.2238 89.5737 20.5573C89.5737 18.209 90.0466 16.139 90.9918 14.3488C91.937 12.5591 93.3043 11.1554 95.0947 10.138C96.8844 9.12193 98.9974 8.61279 101.432 8.61279C105.041 8.61279 107.862 9.59454 109.896 11.5559C111.93 13.5182 112.947 16.2608 112.947 19.7839V21.1158H92.2376Z"
          fill="currentColor"
        />
      </g>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M144.912 31.4271V17.5927C144.912 13.153 142.549 10.9331 137.823 10.9331C136.534 10.9331 135.288 11.148 134.085 11.5774C132.882 12.0073 131.836 12.5947 130.948 13.3392C129.086 14.8286 128.156 16.5474 128.156 18.4947V31.4271H125.449V9.30047H128.113V13.6826C129.258 12.05 130.712 10.7973 132.474 9.92322C134.235 9.05008 136.204 8.61279 138.381 8.61279C141.389 8.61279 143.68 9.3432 145.256 10.804C146.83 12.265 147.619 14.3992 147.619 17.2058V31.4271H144.912Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M163 31.4271V11.4487H158.618V9.30046H163V7.06629C163 4.97557 163.68 3.34291 165.041 2.16806C166.401 0.994163 168.299 0.406738 170.733 0.406738C172.195 0.406738 173.569 0.607241 174.858 1.00825L174.343 3.11352C173.283 2.82733 172.209 2.68364 171.12 2.68364C167.511 2.68364 165.707 4.14468 165.707 7.06629V9.30046H173.655V11.4487H165.707V31.4271H163Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M186.437 31.4272H189.144V9.30054H186.437V31.4272Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M189.813 3.20995C189.813 4.3268 188.907 5.2324 187.79 5.2324C186.673 5.2324 185.768 4.3268 185.768 3.20995C185.768 2.09286 186.673 1.1875 187.79 1.1875C188.907 1.1875 189.813 2.09286 189.813 3.20995Z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip0_1082_19777">
        <rect width="190" height="32.2236" fill="currentColor" />
      </clipPath>
    </defs>
  </svg>
)
