import * as Icons from 'lucide-react'
import type { LucideProps } from 'lucide-react'

type IconName = keyof typeof Icons

interface Props extends LucideProps {
  name: string
}

/** Render a lucide icon by its string name, falling back to a circle. */
export function Icon({ name, ...props }: Props) {
  const Cmp = (Icons[name as IconName] ??
    Icons.Circle) as React.ComponentType<LucideProps>
  return <Cmp {...props} />
}
