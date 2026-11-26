import { getGroupByInvite } from "@/lib/data";
import { firstName, formatDate, money } from "@/lib/format";
import { OG_SIZE, renderOg } from "@/lib/og";

export const alt = "Convite para o amigo oculto · árvore de Natal com presentes";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const group = await getGroupByInvite(code).catch(() => null);
  if (!group) {
    return renderOg({ title: "Convite para o", accent: "amigo oculto", subtitle: "Entre no grupo e monte sua lista de desejos." });
  }
  return renderOg({
    eyebrow: `${firstName(group.owner_name)} te convidou`,
    title: group.name,
    subtitle: "Entre no grupo e monte sua lista de desejos para o amigo oculto.",
    chips: [
      `Até ${money(group.budget).replace(",00", "")}`,
      ...(group.event_date ? [formatDate(group.event_date)!] : []),
      `${group.member_count} ${group.member_count === 1 ? "participante" : "participantes"}`,
    ],
  });
}
