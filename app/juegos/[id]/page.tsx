import { notFound } from "next/navigation";
import { GAMES } from "@/lib/data";
import { GameDetail } from "@/components/game-detail";

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

export default async function GamePage({ params }: PageProps<"/juegos/[id]">) {
  const { id } = await params;
  const game = GAMES.find((g) => g.id === id);
  if (!game) notFound();
  return <GameDetail game={game} />;
}
