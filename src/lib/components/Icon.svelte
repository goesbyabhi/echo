<script lang="ts" module>
  import type { Component } from 'svelte'
  import {
    Plus,
    Stop,
    Trash,
    ChatCircle,
    FolderSimple,
    File,
    FileCode,
    GitDiff,
    Gear,
    ArrowsClockwise,
    PencilSimple,
    Command,
    At,
    ArrowUp,
    MagnifyingGlass,
    CaretRight,
    CaretDown,
    X,
    Check,
    Warning,
    Info,
    Circle,
    Terminal,
    GitBranch,
    Plug,
    Sparkle,
    Brain,
    Image,
    List,
    ShieldCheck,
    ArrowSquareOut,
    SidebarSimple,
    Sidebar,
    Copy,
    ArrowUUpLeft,
    ArrowLeft,
    Pulse,
    Cpu,
    CircleNotch,
  } from 'phosphor-svelte'

  export const ICONS: Record<string, Component<any>> = {
    plus: Plus,
    stop: Stop,
    trash: Trash,
    message: ChatCircle,
    folder: FolderSimple,
    file: File,
    code: FileCode,
    'file-diff': GitDiff,
    settings: Gear,
    refresh: ArrowsClockwise,
    pencil: PencilSimple,
    slash: Command,
    'at-sign': At,
    'arrow-up': ArrowUp,
    search: MagnifyingGlass,
    'chevron-right': CaretRight,
    'chevron-down': CaretDown,
    x: X,
    check: Check,
    'alert-triangle': Warning,
    info: Info,
    circle: Circle,
    terminal: Terminal,
    'git-branch': GitBranch,
    plug: Plug,
    sparkles: Sparkle,
    brain: Brain,
    image: Image,
    list: List,
    shield: ShieldCheck,
    external: ArrowSquareOut,
    'panel-right': SidebarSimple,
    'panel-left': Sidebar,
    copy: Copy,
    undo: ArrowUUpLeft,
    'arrow-left': ArrowLeft,
    activity: Pulse,
    cpu: Cpu,
    loader: CircleNotch,
  }
</script>

<script lang="ts">
  type Weight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'

  let {
    name,
    size = 16,
    weight,
    class: className = '',
  }: { name: string; size?: number; weight?: Weight; class?: string } = $props()

  const C = $derived(ICONS[name] ?? ICONS.circle)
  const resolved = $derived<Weight>(weight ?? (size <= 12 ? 'regular' : 'light'))
</script>

<span
  class={className}
  style="display:inline-flex;align-items:center;justify-content:center;line-height:0"
>
  <C {size} weight={resolved} />
</span>
