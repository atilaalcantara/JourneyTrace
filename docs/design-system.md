# Journey UI design system

Journey UI is calm, restrained, map-first and native-feeling; avoid dashboards, neon, heavy shadows and decorative motion. Typography: display 40/48/600, title 24/32/600, heading 18/24/600, body 15/22/400, label 13/18/500, caption 12/16/400; Inter/system stack. Spacing is 4, 8, 12, 16, 24, 32, 48, 64 px. Radii: 8 control, 12 card, 16 modal, pill 999. Use semantic background/surface/muted/text/secondary/border/accent/hover/success/warning/danger variables prepared for dark mode. Motion is 120/180/280 ms ease-out and respects reduced motion.

Required primitives: Button, IconButton, Select, Slider, SegmentedControl, DropZone, Modal, BottomSheet, Tooltip, Progress and Toast. Controls need labels, visible focus, keyboard access, non-color state and touch targets. Desktop: large map with compact bottom/floating controls. Mobile: map, summary/actions, settings bottom sheet.

Current UI uses basic color variables, system type and a breakpoint, but lacks named type/spacing/radius tokens, dark/reduced-motion/focus rules, keyboard drop zone, bottom sheet, progress/toast/tooltip primitives, real map and accessible dialog behavior.
