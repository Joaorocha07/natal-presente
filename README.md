# 🎁 Amigo Oculto · Presentes de Natal

Site em Next.js 16 para organizar amigo oculto: a pessoa cria o grupo, define o valor máximo e convida a turma por link.
Cada participante monta uma lista de desejos com várias opções dentro do valor. Depois do sorteio (feito por vocês),
é só abrir o perfil do amigo oculto e escolher um presente.

## Rodar

```bash
npm install
npm run dev      # http://localhost:3000
```

### Banco de dados (Supabase)

1. No Supabase, abra **SQL Editor**, cole o conteúdo de `supabase/migrations/0001_init.sql` e clique em **Run**.
2. Copie `.env.example` para `.env.local` e preencha a URL e as chaves do projeto.

O app acessa o banco só pelo servidor, com a chave secreta. As tabelas têm RLS ligado e sem políticas,
então a chave publicável sozinha não lê nem grava nada.

## Sugestões de produtos

- **Mercado Livre (API oficial)**: a busca da API exige token desde 2025. Crie um app em
  https://developers.mercadolivre.com.br/devcenter, copie `.env.example` para `.env.local` e preencha
  `ML_CLIENT_ID` / `ML_CLIENT_SECRET`. A busca passa a trazer produtos reais com foto, preço e link, filtrados pelo valor do grupo.
- **Sem credenciais**: usa um catálogo curado de ideias com preço médio de referência e links de busca no
  Mercado Livre e na Amazon já filtrados pelo valor máximo.
- A pessoa também pode colar o link de qualquer loja e informar o preço.

Amazon: a API de produtos (PA-API) só é liberada para afiliados aprovados com vendas. Por isso entram links de busca filtrados.

## Estrutura

| Caminho | O quê |
| --- | --- |
| `supabase/migrations/` | Schema do banco (Postgres/Supabase) |
| `src/lib/db.ts` | Cliente Supabase do servidor |
| `src/lib/data.ts` | Consultas (grupos, membros, desejos), com checagem de participação |
| `src/lib/auth.ts` | Contas com senha (scrypt) e sessão por cookie httpOnly |
| `src/lib/products.ts` | Integração com o Mercado Livre e catálogo curado |
| `src/app/actions.ts` | Server Actions (login, grupos, lista) |
| `src/app/grupos/[id]` | Grupo, perfil de cada membro e minha lista |
| `src/app/convite/[code]` | Página de convite |

## Deploy

Funciona na Vercel: cadastre as variáveis do `.env.example` nas configurações do projeto e faça o deploy.
# natal-presente
