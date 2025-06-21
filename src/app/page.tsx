import ShapeExplorerGame from '@/components/game/ShapeExplorerGame';

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 selection:bg-primary/20">
      <ShapeExplorerGame />
    </main>
  );
}
