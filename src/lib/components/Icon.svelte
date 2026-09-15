<script lang="ts" module>
  import type { Component } from 'svelte'
  import {
    Plus,
    PaperPlaneTilt,
    Stop,
    Trash,
    ChatCircle,
    FolderSimple,
    FolderOpen,
    File,
    FileCode,
    FileText,
    GitDiff,
    Gear,
    Palette,
    ArrowsClockwise,
    PencilSimple,
    Paperclip,
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
    HardDrives,
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
    Lightning,
    Pulse,
    Cpu,
    Database,
    CircleNotch,
  } from 'phosphor-svelte'

  export const ICONS: Record<string, Component<any>> = {
    plus: Plus,
    send: PaperPlaneTilt,
    stop: Stop,
    trash: Trash,
    message: ChatCircle,
    folder: FolderSimple,
    'folder-open': FolderOpen,
    file: File,
    'file-code': FileCode,
    'file-text': FileText,
    'file-diff': GitDiff,
    settings: Gear,
    palette: Palette,
    refresh: ArrowsClockwise,
    pencil: PencilSimple,
    paperclip: Paperclip,
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
    server: HardDrives,
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
    zap: Lightning,
    activity: Pulse,
    cpu: Cpu,
    database: Database,
    loader: CircleNotch,
  }
</script>

<script lang="ts">
  type Weight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'

  let {
    name,
    size = 16,
    weight = 'regular',
    class: className = '',
  }: { name: string; size?: number; weight?: Weight; class?: string } = $props()

  const C = $derived(ICONS[name] ?? ICONS.circle)
</script>

<span
  class={className}
  style="display:inline-flex;align-items:center;justify-content:center;line-height:0"
>
  <C {size} {weight} />
</span>
