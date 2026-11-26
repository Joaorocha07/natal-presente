import "server-only";
import { listCatalogProducts } from "./data";

export type Product = {
  id: string;
  title: string;
  price: number; // centavos
  image: string | null;
  url: string;
  store: string;
  emoji?: string;
  category?: string;
  /** produto real cadastrado pelo admin */
  featured?: boolean;
  /** true quando o preço é uma estimativa (catálogo curado) */
  approx?: boolean;
  /** links extras para pesquisar a ideia nas lojas */
  links?: { label: string; url: string }[];
};

export type SearchResult = {
  source: "mercadolivre" | "curadoria";
  items: Product[];
};

// ---------------------------------------------------------------------------
// Links de busca nas lojas, já filtrados pelo valor máximo
// ---------------------------------------------------------------------------

export function storeSearchLinks(query: string, maxCents: number) {
  const reais = Math.floor(maxCents / 100);
  const slug = encodeURIComponent(query.trim().toLowerCase()).replace(/%20/g, "-");
  return [
    {
      label: "Amazon",
      url: `https://www.amazon.com.br/s?k=${encodeURIComponent(query)}&rh=p_36%3A-${maxCents}`,
    },
    {
      label: "Mercado Livre",
      url: `https://lista.mercadolivre.com.br/${slug}_PriceRange_0-${reais}_NoIndex_True`,
    },
  ];
}

// ---------------------------------------------------------------------------
// Mercado Livre (API oficial). A busca exige token desde 2025:
// configure ML_CLIENT_ID e ML_CLIENT_SECRET (ou ML_ACCESS_TOKEN) no .env.local
// ---------------------------------------------------------------------------

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function mercadoLivreToken(): Promise<string | null> {
  if (process.env.ML_ACCESS_TOKEN) return process.env.ML_ACCESS_TOKEN;
  const id = process.env.ML_CLIENT_ID;
  const secret = process.env.ML_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const res = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: id, client_secret: secret }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return cachedToken.value;
}

type MlItem = {
  id: string;
  title: string;
  price: number;
  thumbnail?: string;
  permalink: string;
};

async function searchMercadoLivre(query: string, maxCents: number): Promise<Product[] | null> {
  const token = await mercadoLivreToken();
  if (!token) return null;
  const max = (maxCents / 100).toFixed(2);
  const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&price=*-${max}&limit=24`;
  try {
    const res = await fetch(url, {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { results?: MlItem[] };
    return (json.results ?? [])
      .filter((i) => i.price > 0 && i.price * 100 <= maxCents)
      .map((i) => ({
        id: `ml-${i.id}`,
        title: i.title,
        price: Math.round(i.price * 100),
        image: i.thumbnail?.replace(/^http:/, "https:").replace("-I.jpg", "-O.jpg") ?? null,
        url: i.permalink,
        store: "Mercado Livre",
      }));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Catálogo curado (sempre disponível): ideias com preço médio de referência
// ---------------------------------------------------------------------------

const IDEAS: Omit<Product, "id" | "url" | "store" | "image" | "links">[] = [
  { title: "Caneca térmica de aço inox", price: 5990, emoji: "☕", category: "Casa" },
  { title: "Kit de chás especiais", price: 4990, emoji: "🍵", category: "Gourmet" },
  { title: "Vela aromática em pote de vidro", price: 3990, emoji: "🕯️", category: "Casa" },
  { title: "Livro de ficção mais vendido", price: 4490, emoji: "📚", category: "Leitura" },
  { title: "Kindle capa protetora", price: 6990, emoji: "📖", category: "Leitura" },
  { title: "Fone de ouvido bluetooth", price: 8990, emoji: "🎧", category: "Tecnologia" },
  { title: "Carregador portátil power bank 10000mAh", price: 7990, emoji: "🔋", category: "Tecnologia" },
  { title: "Luminária LED de mesa", price: 6490, emoji: "💡", category: "Tecnologia" },
  { title: "Garrafa térmica 1 litro", price: 7490, emoji: "🥤", category: "Esporte" },
  { title: "Tapete de yoga", price: 8990, emoji: "🧘", category: "Esporte" },
  { title: "Corda de pular com contador", price: 3490, emoji: "🏃", category: "Esporte" },
  { title: "Jogo de tabuleiro para família", price: 9490, emoji: "🎲", category: "Diversão" },
  { title: "Quebra-cabeça 1000 peças", price: 5490, emoji: "🧩", category: "Diversão" },
  { title: "Baralho e jogo de cartas", price: 2990, emoji: "🃏", category: "Diversão" },
  { title: "Kit de skincare hidratante", price: 7990, emoji: "🧴", category: "Beleza" },
  { title: "Perfume body splash", price: 5990, emoji: "🌸", category: "Beleza" },
  { title: "Necessaire de viagem", price: 4590, emoji: "👝", category: "Acessórios" },
  { title: "Carteira de couro slim", price: 6990, emoji: "👛", category: "Acessórios" },
  { title: "Meias divertidas (kit com 3)", price: 3990, emoji: "🧦", category: "Moda" },
  { title: "Pijama de algodão", price: 8990, emoji: "🌙", category: "Moda" },
  { title: "Manta de sofá soft", price: 7990, emoji: "🛋️", category: "Casa" },
  { title: "Kit de vinhos taças (par)", price: 6990, emoji: "🍷", category: "Casa" },
  { title: "Cesta de chocolates finos", price: 8990, emoji: "🍫", category: "Gourmet" },
  { title: "Café especial em grãos 500g", price: 5490, emoji: "🌰", category: "Gourmet" },
  { title: "Kit de temperos gourmet", price: 4990, emoji: "🧂", category: "Gourmet" },
  { title: "Planta suculenta com vaso", price: 3990, emoji: "🌵", category: "Casa" },
  { title: "Caderno de capa dura + caneta", price: 4490, emoji: "📓", category: "Papelaria" },
  { title: "Kit de pintura em aquarela", price: 6990, emoji: "🎨", category: "Hobbies" },
  { title: "Mouse sem fio", price: 5990, emoji: "🖱️", category: "Tecnologia" },
  { title: "Suporte de celular para mesa", price: 2990, emoji: "📱", category: "Tecnologia" },
  { title: "Porta-retrato digital / álbum", price: 4990, emoji: "🖼️", category: "Casa" },
  { title: "Kit churrasco (avental + utensílios)", price: 8490, emoji: "🔥", category: "Casa" },

  // ---- Tecnologia
  { title: "Caixa de som bluetooth portátil", price: 8990, emoji: "🔊", category: "Tecnologia" },
  { title: "Smartwatch fitness básico", price: 9990, emoji: "⌚", category: "Tecnologia" },
  { title: "Cabo USB-C trançado 2 metros", price: 2990, emoji: "🔌", category: "Tecnologia" },
  { title: "Carregador de parede 20W USB-C", price: 4490, emoji: "⚡", category: "Tecnologia" },
  { title: "Pen drive 64GB", price: 3990, emoji: "💾", category: "Tecnologia" },
  { title: "Cartão de memória microSD 128GB", price: 6990, emoji: "🗂️", category: "Tecnologia" },
  { title: "Teclado sem fio compacto", price: 7990, emoji: "⌨️", category: "Tecnologia" },
  { title: "Suporte ajustável para notebook", price: 6490, emoji: "💻", category: "Tecnologia" },
  { title: "Ring light com tripé para celular", price: 7490, emoji: "📸", category: "Tecnologia" },
  { title: "Mousepad grande para escritório ou jogos", price: 3990, emoji: "🖲️", category: "Tecnologia" },
  { title: "Tomada inteligente Wi-Fi", price: 4990, emoji: "🏠", category: "Tecnologia" },
  { title: "Rastreador de chaves e objetos", price: 7990, emoji: "🔑", category: "Tecnologia" },

  // ---- Perfumes
  { title: "Perfume masculino amadeirado 50ml", price: 8990, emoji: "🧴", category: "Perfumes" },
  { title: "Perfume feminino floral 30ml", price: 9490, emoji: "🌷", category: "Perfumes" },
  { title: "Body splash frutado 200ml", price: 3990, emoji: "🍓", category: "Perfumes" },
  { title: "Colônia infantil suave 100ml", price: 4990, emoji: "🧸", category: "Perfumes" },
  { title: "Kit de mini perfumes (3 unidades)", price: 7990, emoji: "🎁", category: "Perfumes" },
  { title: "Perfume cítrico unissex 60ml", price: 8490, emoji: "🍋", category: "Perfumes" },
  { title: "Perfume feminino doce de baunilha 50ml", price: 8990, emoji: "🍮", category: "Perfumes" },
  { title: "Difusor de varetas aromático para ambiente", price: 5990, emoji: "🏺", category: "Perfumes" },
  { title: "Kit sabonete líquido e hidratante perfumados", price: 6490, emoji: "🧼", category: "Perfumes" },
  { title: "Óleo corporal perfumado", price: 5490, emoji: "✨", category: "Perfumes" },

  // ---- Livros
  { title: "Livro de romance best-seller", price: 4490, emoji: "💘", category: "Livros" },
  { title: "Livro de suspense e thriller", price: 4990, emoji: "🕵️", category: "Livros" },
  { title: "Livro de fantasia (volume 1 de saga)", price: 5490, emoji: "🐉", category: "Livros" },
  { title: "Livro de desenvolvimento pessoal", price: 3990, emoji: "🌱", category: "Livros" },
  { title: "Livro de culinária e receitas", price: 6990, emoji: "🍳", category: "Livros" },
  { title: "Livro infantil ilustrado", price: 3490, emoji: "🦄", category: "Livros" },
  { title: "Mangá (volume de série popular)", price: 2990, emoji: "🎌", category: "Livros" },
  { title: "HQ ou graphic novel", price: 5990, emoji: "💥", category: "Livros" },
  { title: "Livro de finanças pessoais", price: 4290, emoji: "💰", category: "Livros" },
  { title: "Livro de história e curiosidades", price: 5490, emoji: "🏛️", category: "Livros" },
  { title: "Livro de colorir para adultos", price: 2990, emoji: "🖍️", category: "Livros" },
  { title: "Planner ou agenda 2027", price: 4990, emoji: "🗓️", category: "Livros" },

  // ---- Roupas
  { title: "Camiseta básica de algodão", price: 4990, emoji: "👕", category: "Roupas" },
  { title: "Camiseta estampada divertida", price: 5990, emoji: "😎", category: "Roupas" },
  { title: "Moletom com capuz", price: 9990, emoji: "🧥", category: "Roupas" },
  { title: "Bermuda de moletom", price: 5990, emoji: "🩳", category: "Roupas" },
  { title: "Gorro de lã", price: 3490, emoji: "🧢", category: "Roupas" },
  { title: "Cachecol de tricô", price: 4990, emoji: "🧣", category: "Roupas" },
  { title: "Luvas de inverno compatíveis com touch", price: 3990, emoji: "🧤", category: "Roupas" },
  { title: "Boné ajustável", price: 4490, emoji: "🎩", category: "Roupas" },
  { title: "Camisa polo", price: 7990, emoji: "👔", category: "Roupas" },
  { title: "Regata dry fit para treino", price: 3990, emoji: "🏋️", category: "Roupas" },
  { title: "Pantufa macia", price: 4990, emoji: "🥿", category: "Roupas" },
  { title: "Conjunto de pijama curto", price: 5990, emoji: "😴", category: "Roupas" },

  // ---- Colares
  { title: "Colar folheado a ouro com pingente", price: 7990, emoji: "📿", category: "Colares" },
  { title: "Colar de pérolas", price: 6990, emoji: "🦪", category: "Colares" },
  { title: "Colar com letra inicial", price: 5990, emoji: "🔤", category: "Colares" },
  { title: "Colar de prata 925 delicado", price: 9990, emoji: "🥈", category: "Colares" },
  { title: "Corrente masculina de aço inox", price: 7490, emoji: "⛓️", category: "Colares" },
  { title: "Colar de coração", price: 4990, emoji: "💗", category: "Colares" },
  { title: "Gargantilha minimalista", price: 4490, emoji: "🤍", category: "Colares" },
  { title: "Colar ponto de luz", price: 5990, emoji: "💎", category: "Colares" },
  { title: "Colar com pedra natural (quartzo)", price: 6490, emoji: "🔮", category: "Colares" },
  { title: "Kit de colar e brincos", price: 8490, emoji: "💍", category: "Colares" },

  // ---- Chocolates
  { title: "Caixa de bombons sortidos", price: 5990, emoji: "🍬", category: "Chocolates" },
  { title: "Barra de chocolate amargo 70%", price: 2490, emoji: "🍫", category: "Chocolates" },
  { title: "Kit de barras de chocolate (3 unidades)", price: 4990, emoji: "🍫", category: "Chocolates" },
  { title: "Panetone trufado", price: 4990, emoji: "🎄", category: "Chocolates" },
  { title: "Caixa de trufas artesanais", price: 6990, emoji: "🧁", category: "Chocolates" },
  { title: "Chocolate quente cremoso (pote)", price: 3990, emoji: "☕", category: "Chocolates" },
  { title: "Cesta de Natal com chocolates", price: 9990, emoji: "🧺", category: "Chocolates" },
  { title: "Caixa de chocolate suíço", price: 8990, emoji: "🇨🇭", category: "Chocolates" },
  { title: "Bombons recheados importados", price: 7490, emoji: "🌰", category: "Chocolates" },
  { title: "Creme de avelã com cacau (pote)", price: 3490, emoji: "🥜", category: "Chocolates" },
  { title: "Chocolate em formato de Papai Noel", price: 3490, emoji: "🎅", category: "Chocolates" },
  { title: "Kit fondue de chocolate", price: 8990, emoji: "🍓", category: "Chocolates" },
];

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function curatedIdeas(query: string, maxCents: number): Product[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return IDEAS.filter((i) => i.price <= maxCents)
    .filter((i) => {
      if (!terms.length) return true;
      const hay = normalize(`${i.title} ${i.category}`);
      return terms.some((t) => hay.includes(t));
    })
    .map((i, idx) => {
      const links = storeSearchLinks(i.title, maxCents);
      return {
        ...i,
        id: `idea-${idx}-${i.title}`,
        image: null,
        url: links[0].url,
        store: "Sugestão",
        approx: true,
        links,
      };
    });
}

/** Produtos cadastrados pelo admin, dentro do valor e que batem com a busca */
async function catalogProducts(query: string, maxCents: number): Promise<Product[]> {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  try {
    const rows = await listCatalogProducts(maxCents);
    return rows
      .filter((p) => {
        if (!terms.length) return true;
        const hay = normalize(`${p.title} ${p.category ?? ""} ${p.store ?? ""}`);
        return terms.some((t) => hay.includes(t));
      })
      .map((p) => ({
        id: `cat-${p.id}`,
        title: p.title,
        price: p.price,
        image: p.image,
        url: p.url,
        store: p.store ?? "Loja",
        category: p.category ?? undefined,
        featured: true,
      }));
  } catch (err) {
    // Tabela ainda não criada ou erro no banco: segue só com as outras fontes
    console.error("[produtos] catálogo indisponível:", err);
    return [];
  }
}

export async function searchProducts(query: string, maxCents: number): Promise<SearchResult> {
  const q = query.trim();
  const [catalog, ml] = await Promise.all([
    catalogProducts(q, maxCents),
    q ? searchMercadoLivre(q, maxCents) : Promise.resolve(null),
  ]);
  if (ml && ml.length) return { source: "mercadolivre", items: [...catalog, ...ml] };
  return { source: "curadoria", items: [...catalog, ...curatedIdeas(q, maxCents)] };
}
