import { Suspense } from "react";
import { notFound } from "next/navigation";
import { GAMES } from "@/lib/data";
import { GameDetail } from "@/components/game-detail";

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

export default function GamePage({ params }: PageProps<"/juegos/[id]">) {
  return (
    <Suspense fallback={null}>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: Pick<PageProps<"/juegos/[id]">, "params">) {
  const { id } = await params;
  const game = GAMES.find((g) => g.id === id);
  if (!game) notFound();
  return <GameDetail game={game} />;
}
