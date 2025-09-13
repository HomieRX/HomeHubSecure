import ThemeToggle from '../ThemeToggle';

export default function ThemeToggleExample() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Theme Toggle:</span>
        <ThemeToggle />
      </div>
    </div>
  );
}