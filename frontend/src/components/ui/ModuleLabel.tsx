/**
 * ModuleLabel — Numbered step/section label.
 *
 * Used in the Quiz Setup popup and other multi-step interfaces
 * to label each configuration section with a numbered badge.
 */

interface ModuleLabelProps {
  n: number;
  title: string;
  className?: string;
}

export function ModuleLabel({ n, title, className = "" }: ModuleLabelProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="size-6 rounded-full bg-amber-glow text-primary-foreground text-xs font-bold grid place-items-center">
        {n}
      </span>
      <h4 className="font-display font-bold text-sm uppercase tracking-wider">
        {title}
      </h4>
    </div>
  );
}
