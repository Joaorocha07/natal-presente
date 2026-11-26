import { OG_SIZE, renderOg } from "@/lib/og";

export const alt = "Árvore de Natal com presentes · Amigo Oculto";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOg({
    title: "O presente certo,",
    accent: "dentro do valor.",
    subtitle: "Crie o grupo, defina o valor e veja a lista de desejos de quem você tirou.",
    chips: ["Grátis", "Lista de desejos", "Sorteio"],
  });
}
