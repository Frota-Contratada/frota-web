# Plataforma de Gestão de Frota Contratada

Sistema web para gerenciamento de frotas de veículos desenvolvido com React, TypeScript e Vite.

## 🚀 Tecnologias

- **React 19** - Biblioteca UI
- **TypeScript 6** - Tipagem estática
- **Vite 8** - Build tool e dev server
- **React Router DOM 6** - Roteamento
- **Zustand 5** - Gerenciamento de estado
- **CSS Modules** - Estilização com escopo

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── common/          # Componentes reutilizáveis (Button, Input, Card)
│   └── layout/          # Componentes de layout (Header)
├── hooks/               # Hooks customizados (useAuth)
├── pages/               # Páginas da aplicação
│   ├── Login/          # Tela de autenticação
│   └── Home/           # Dashboard principal
├── routes/              # Configuração de rotas
├── services/            # Camada de serviços
│   ├── api/            # Configuração de API
│   └── auth/           # Serviço de autenticação
├── stores/              # Estado global (Zustand)
├── styles/              # Estilos globais e variáveis CSS
├── types/               # Definições de tipos TypeScript
└── utils/               # Funções utilitárias
```

## 🏗️ Arquitetura

### Componentes Comuns

Componentes base reutilizáveis com API tipada e acessibilidade:

- **Button**: Variantes (primary, secondary, outline, ghost), tamanhos, loading state, ícones
- **Input**: Label, validação, ícones, helper text, estados de erro
- **Card**: Container com variantes (default, bordered, elevated) e padding configurável

### Gerenciamento de Estado

**Zustand** com persistência no localStorage:
- Estado de autenticação centralizado
- Sincronização automática entre abas
- Tipagem completa com TypeScript

### Roteamento

**React Router DOM v6** com proteção de rotas:
- Rota pública: `/login`
- Rotas protegidas: `/home`
- Redirecionamentos inteligentes baseados em autenticação

### Serviços

Camada de abstração para comunicação com API:
- AuthService com simulação de login (pronto para integração real)
- Headers configuráveis com token JWT
- Tratamento de erros centralizado

## 🎨 Design System

### Tokens CSS

Design system com variáveis CSS customizáveis em `src/styles/variables.css`:

- **Cores**: Primary, Neutral, Semantic (success, warning, error, info)
- **Espaçamento**: xs, sm, md, lg, xl, 2xl
- **Tipografia**: Font family, tamanhos (xs até 3xl)
- **Border Radius**: sm, md, lg, xl, full
- **Sombras**: sm, md, lg
- **Transições**: fast, base, slow
- **Z-index**: Sistema hierárquico para camadas

### Responsividade

Breakpoints padrão:
- Mobile: < 640px
- Tablet: < 768px
- Desktop: > 768px

## 🔐 Autenticação

### Hook `useAuth`

```typescript
const { user, isAuthenticated, isLoading, error, login, logout } = useAuth();
```

### Fluxo de Login

1. Usuário preenche credenciais na tela de Login
2. Validação client-side (email válido, senha mínima)
3. Chamada ao `authService.login()`
4. Token armazenado no localStorage
5. Estado atualizado no Zustand
6. Redirecionamento para `/home`

### Login Mock

Atualmente usa simulação. Para integrar API real, edite `src/services/auth/authService.ts`:

```typescript
async login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: this.getHeaders(),
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error('Falha na autenticação');
  }

  return response.json();
}
```

## 🚦 Rotas

| Rota | Componente | Proteção | Descrição |
|------|-----------|----------|-----------|
| `/login` | Login | Pública | Tela de autenticação |
| `/home` | Home | Privada | Dashboard principal |
| `/` | - | - | Redireciona para login ou home |
| `*` | - | - | Redireciona para login ou home |

## 🎯 Features

### Tela de Login
- Formulário com validação client-side
- Estados de loading e erro
- Campos com ícones e feedback visual
- Design responsivo e animações suaves

### Dashboard (Home)
- Cards de estatísticas com trends
- Ações rápidas
- Lista de atividades recentes
- Header com info do usuário e logout

## 🔧 Configuração

### Variáveis de Ambiente

Crie `.env` na raiz do projeto:

```bash
cp .env.example .env
```

Configure a URL da API:

```env
VITE_API_URL=http://localhost:3000/api
```

## 📦 Scripts

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Lint
npm run lint
```

## 🛠️ Próximos Passos

### Funcionalidades
- [ ] Cadastro de veículos
- [ ] Registro de manutenções
- [ ] Gestão de motoristas
- [ ] Relatórios e dashboards avançados
- [ ] Sistema de notificações
- [ ] Busca e filtros

### Técnico
- [ ] Testes unitários (Vitest + Testing Library)
- [ ] Testes E2E (Playwright)
- [ ] Storybook para componentes
- [ ] CI/CD pipeline
- [ ] Error boundary
- [ ] Lazy loading de rotas
- [ ] Service Worker (PWA)

## 🤝 Contribuindo

1. Siga a estrutura de pastas estabelecida
2. Use TypeScript e evite `any`
3. Componentes devem ter props tipadas
4. Utilize CSS Modules para estilos
5. Mantenha componentes pequenos e focados
6. Documente funções complexas

## 📝 Convenções

### Componentes
- PascalCase para nomes de arquivo e export: `Button.tsx`
- Props interface sempre nomeada: `ButtonProps`
- forwardRef quando necessário aceitar ref

### Estilos
- CSS Modules com extensão `.module.css`
- Classes em camelCase: `.buttonPrimary`
- Utilize tokens CSS: `var(--color-primary-600)`

### Tipos
- Interfaces para objetos e props
- Types para unions e primitivos
- Prefixo `I` apenas quando houver conflito de nomenclatura
- Colocalize types específicos com componentes

### Estado
- Zustand para estado global
- useState/useReducer para estado local
- Evite prop drilling — use contexto ou store

## 📄 Licença

Projeto privado - Todos os direitos reservados
