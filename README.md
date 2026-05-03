# Mini SaaS Frontend - React + TypeScript

Interface React com autenticação, gestão de produtos, upload de imagens e chat com IA via streaming.

## Stack Tecnológica

- **Framework**: React 19
- **Linguagem**: TypeScript 6
- **Build Tool**: Vite 8
- **Estilização**: TailwindCSS
- **Componentes**: shadcn/ui
- **Ícones**: Lucide React
- **State Management**: React Query (TanStack Query v5)
- **Roteamento**: React Router v7
- **HTTP Client**: Axios
- **Testes**: Vitest + Testing Library

## Funcionalidades

### Autenticação
- Login e registro de usuários
- Proteção de rotas privadas
- Logout com limpeza de sessão
- Password reset (esqueci minha senha)
- Verificação de email
- Banner para usuários não verificados

### Dashboard
- Visão geral da empresa
- Estatísticas de produtos
- Acesso rápido às funcionalidades

### Gestão de Produtos
- Listagem com paginação
- Criação de produtos (admin only)
- Edição de produtos (admin only)
- Exclusão de produtos (admin only)
- Upload de imagens
- Preview de imagens antes do upload
- Validação de tipo e tamanho de arquivo

### Chat com IA
- Interface de chat em tempo real
- Streaming de respostas via SSE
- Indicador "AI is typing..."
- Histórico de conversas
- Consulta ao catálogo de produtos
- Markdown rendering nas respostas

### UX/UI
- Design moderno e responsivo
- Loading states em todas as ações
- Mensagens de erro claras
- Feedback visual de sucesso
- Tema consistente

## Requisitos

- Node.js 20+
- Backend rodando (veja `../backend/README.md`)
- Docker (opcional, para rodar com container)

## Setup Rápido com Docker

### 1. Configurar variáveis de ambiente

```powershell
Copy-Item .env.docker .env
```

Edite `.env` se necessário:
- `VITE_API_URL` - URL da API backend (padrão: `http://localhost:3001/api`)
- `FRONTEND_PORT` - Porta do container (padrão: `3000`)

### 2. Iniciar com Docker Compose

```powershell
docker compose up -d
```

Frontend estará em: `http://localhost:3000`

**Importante**: O backend precisa estar rodando em `http://localhost:3001`

## Setup Manual (Desenvolvimento)

### 1. Instalar dependências

```powershell
npm install
```

### 2. Configurar .env

```powershell
Copy-Item .env.example .env
```

Edite `.env`:
```
VITE_API_URL=http://localhost:3001/api
```

### 3. Rodar em desenvolvimento

```powershell
npm run dev
```

Frontend estará em: `http://localhost:5173` (ou porta disponível)

## Variáveis de Ambiente

| Variável | Obrigatório | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `VITE_API_URL` | Não | URL base da API | `http://localhost:3001/api` (padrão) |

## Scripts Disponíveis

```powershell
# Desenvolvimento (hot reload)
npm run dev

# Build para produção
npm run build

# Preview do build de produção
npm run preview

# Testes
npm run test          # Modo watch
npm run test:run      # Executar uma vez
npm run test:ui       # Interface visual

# Qualidade de código
npm run lint          # ESLint
npm run type-check    # TypeScript check
```

## Estrutura de Pastas

```
frontend/
├── src/
│   ├── components/
│   │   ├── auth/           # LoginForm, RegisterForm, etc
│   │   ├── chat/           # ChatPanel, MessageList, etc
│   │   ├── products/       # ProductCard, ProductForm, ImageUpload
│   │   ├── ui/             # shadcn/ui components
│   │   └── layout/         # Header, Sidebar, etc
│   ├── contexts/
│   │   └── AuthContext.tsx # Contexto de autenticação
│   ├── hooks/
│   │   ├── useAuth.ts      # Hook de autenticação
│   │   ├── useProducts.ts  # React Query hooks para produtos
│   │   ├── useChat.ts      # React Query hooks para chat
│   │   └── useStreamChat.ts # Hook para SSE streaming
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── ChatPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── ResetPasswordPage.tsx
│   │   └── VerifyEmailPage.tsx
│   ├── services/
│   │   ├── api.ts          # Axios instance configurado
│   │   ├── authService.ts  # Chamadas de autenticação
│   │   ├── productService.ts
│   │   ├── chatService.ts
│   │   └── uploadService.ts
│   ├── types/
│   │   ├── auth.ts
│   │   ├── product.ts
│   │   ├── chat.ts
│   │   └── stream.ts
│   ├── lib/
│   │   └── utils.ts        # Utilitários
│   ├── App.tsx             # Rotas principais
│   ├── main.tsx            # Entry point
│   └── index.css           # Estilos globais + Tailwind
├── public/                 # Assets estáticos
├── Dockerfile              # Multi-stage build com Nginx
├── docker-compose.yml      # Container do frontend
├── nginx.conf              # Configuração Nginx (proxy /api)
├── vite.config.ts          # Configuração Vite
└── package.json
```

## Rotas da Aplicação

| Rota | Componente | Proteção | Descrição |
|------|------------|----------|-----------|
| `/login` | LoginPage | Pública | Login de usuários |
| `/register` | RegisterPage | Pública | Registro de novos usuários |
| `/forgot-password` | ForgotPasswordPage | Pública | Solicitar reset de senha |
| `/reset-password` | ResetPasswordPage | Pública | Resetar senha com token |
| `/verify-email` | VerifyEmailPage | Pública | Verificar email com token |
| `/` | DashboardPage | Privada | Dashboard principal |
| `/products` | ProductsPage | Privada | Gestão de produtos |
| `/chat` | ChatPage | Privada | Chat com IA |

## Credenciais de Teste

Após rodar o seed no backend:

| Email | Senha | Role |
|-------|-------|------|
| `admin@techcorp.com` | `Admin123!` | Admin |
| `user@techcorp.com` | `User123!` | User |
| `admin@retailco.com` | `Admin123!` | Admin |
| `user@retailco.com` | `User123!` | User |

## Desenvolvimento

### Adicionar novo componente shadcn/ui

```powershell
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
```

### Estrutura de um componente

```tsx
// src/components/exemplo/MeuComponente.tsx
import { useState } from 'react';

interface MeuComponenteProps {
  titulo: string;
}

export function MeuComponente({ titulo }: MeuComponenteProps) {
  const [estado, setEstado] = useState('');

  return (
    <div>
      <h1>{titulo}</h1>
    </div>
  );
}
```

### React Query - Exemplo de Hook

```tsx
// src/hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/productService';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: productService.getAll
  });
}
```

## Testes

```powershell
# Rodar testes em modo watch
npm run test

# Rodar testes uma vez
npm run test:run

# Ver coverage
npm run test:run -- --coverage

# Interface visual
npm run test:ui
```

**Cobertura atual**: 95% statements · 86% branches · 98% funções · 26 suites · 110 testes

## Build para Produção

### Com Docker

```powershell
docker compose build
docker compose up -d
```

### Manual

```powershell
npm run build
npm run preview
```

Arquivos buildados estarão em `dist/`

## Nginx (Produção)

O `nginx.conf` está configurado para:
- Servir arquivos estáticos do React
- Proxy reverso `/api/*` para o backend
- SPA routing (todas as rotas retornam `index.html`)
- Health check em `/healthz`

## Troubleshooting

### API retorna erro de CORS
- Verifique se o backend está configurado com `CORS_ORIGIN=http://localhost:3000`
- Confirme que está acessando o frontend pela porta correta

### Imagens não carregam
- Verifique se o backend está servindo imagens em `/api/uploads`
- Confirme que o upload foi feito com sucesso

### SSE streaming não funciona
- Verifique se o backend suporta SSE em `/api/chat/stream`
- Confirme que o navegador suporta EventSource
- Veja logs do navegador (F12 → Console)

### Build falha
- Limpe cache: `rm -rf node_modules dist && npm install`
- Verifique erros de TypeScript: `npm run type-check`
- Verifique erros de lint: `npm run lint`

## Segurança

- JWT armazenado em localStorage (considere httpOnly cookies para produção)
- Validação de formulários com Zod
- Sanitização de inputs
- HTTPS recomendado em produção
- CSP headers configurados no Nginx

## Performance

- Code splitting automático (Vite)
- Lazy loading de rotas
- React Query para cache de dados
- Imagens otimizadas
- Build minificado e comprimido

## Licença

MIT
