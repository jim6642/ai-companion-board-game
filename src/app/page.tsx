import { redirect } from "next/navigation";

// The home page is the game hub: pick one of the 5 companion games
// (Werewolf / Liars Dice / Love Letter / Aeroplane Chess / Uno).
// Sending "/" straight to "/companion" avoids a confusing "Play Werewolf"
// landing page at the project root — werewolf still has its own dedicated
// page at /companion/werewolf.
export default function HomePage(): never {
  redirect("/companion");
}
