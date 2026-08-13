import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// tailwind-merge must know our custom type scale is a font-size group and our
// semantic color names are colors — otherwise `cn('text-body', 'text-primary')`
// would wrongly drop one of them.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display', 'h1', 'h2', 'h3',
            'body', 'body-md', 'small', 'label', 'micro',
          ],
        },
      ],
      'text-color': [
        {
          text: [
            'primary', 'secondary', 'tertiary', 'inverse',
            'accent', 'accent-text',
            'success', 'warning', 'danger', 'info',
            'sidebar-fg', 'sidebar-fg-active',
          ],
        },
      ],
    },
  },
})

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
