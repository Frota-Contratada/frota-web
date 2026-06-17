# Guia completo do projeto — Plataforma de Gestão de Frota

Este arquivo existe para permitir replicar este projeto em outro contexto sem depender de memória, conversa ou conhecimento implícito. Ele documenta a estrutura atual, decisões visuais, componentes, fluxos, regras de negócio já aplicadas, pendências e a base preparada para futura API em NestJS.

## 1. Visão geral

Projeto frontend em React + TypeScript + Vite para uma plataforma de gestão de frota/corridas corporativas. Hoje a maior parte dos dados vem de mocks locais, mas a estrutura já tem autenticação, rotas protegidas, layout principal, sidebar, header, componentes comuns e telas de domínio.

Principais módulos funcionais:

- Login e verificação em duas etapas.
- Home.
- Corridas:
  - Solicitações.
  - Criação de nova solicitação.
  - Revisão/aprovação de solicitação.
  - Calendário.
  - Histórico.
- Terceiros:
  - Fornecedores.
  - Contratos.
- Colaboradores.
- Filiais.
- Sidebar com logout via popup de confirmação.

Stack atual:

```json
{
  "react": "^19.2.5",
  "react-dom": "^19.2.5",
  "react-router-dom": "^6.30.0",
  "zustand": "^5.0.3",
  "vite": "^8.0.10",
  "typescript": "~6.0.2",
  "vite-plugin-svgr": "^5.2.0"
}
```

Observação importante para outro contexto: no futuro, se endurecer segurança de supply chain, trocar ranges `^`/`~` por versões exatas no `package.json`.

## 2. Como rodar

Instalar dependências:

```bash
npm install
```

Rodar localmente:

```bash
npm run dev
```

Build de produção:

```bash
npm run build
```

Preview do build:

```bash
npm run preview
```

Variável preparada para API futura:

```env
VITE_API_URL=http://localhost:3000
```

Se `VITE_API_URL` não for definida, o client usa `http://localhost:3000` como padrão.

## 3. Estrutura de pastas

Estrutura relevante:

```txt
src/
  App.tsx
  main.tsx
  index.css
  assets/
    fonts/gellix/
    icons/
    images/
  components/
    common/
      Button/
      Card/
      FilterDropdown/
      Input/
      Select/
      StatCard/
      StatusBadge/
      Table/
      TableToolbar/
      Toast/
      index.ts
    layout/
      Header/
      MainLayout/
      Sidebar/
      index.ts
  hooks/
    useAuth.ts
    usePermissions.ts
  pages/
    Calendar/
    Contracts/
    Home/
    Listings/
    Login/
    Rides/
    Suppliers/
    TwoFactor/
  routes/
    index.tsx
    ProtectedRoute.tsx
    ProfileRoute.tsx
  services/
    api/
      apiClient.ts
    auth/
      authApi.ts
      authService.ts
    platform/
      platformApi.ts
    rides/
      ridesApi.ts
    index.ts
  stores/
    authStore.ts
  styles/
    variables.css
  types/
    auth.types.ts
    profile.types.ts
```

Responsabilidades:

- `components/common`: componentes reutilizáveis e independentes de domínio.
- `components/layout`: shell da aplicação autenticada: sidebar, header, conteúdo.
- `pages`: telas por módulo/domínio.
- `routes`: declaração das rotas e guards.
- `services`: camada preparada para API NestJS.
- `stores`: estado global Zustand.
- `styles/variables.css`: design tokens globais.
- `types`: tipos compartilhados.

## 4. Arquitetura atual

### 4.1 Entrada da aplicação

`src/main.tsx` monta o React em `#root` com `StrictMode`.

`src/App.tsx` importa:

- `ToastProvider` para feedback global.
- `AppRoutes` para roteamento.
- `variables.css` e `index.css`.

### 4.2 Roteamento

Arquivo principal: `src/routes/index.tsx`.

Rotas públicas:

- `/login`
- `/two-factor`

Rotas protegidas por `ProtectedRoute` dentro de `MainLayout`:

- `/home`
- `/visao-executiva`
- `/gastos`
- `/preco-auditoria`
- `/corridas/solicitacoes`
- `/corridas/solicitacoes/nova`
- `/corridas/solicitacoes/:requestId/revisar`
- `/corridas/calendario`
- `/corridas/historico`
- `/terceiros/fornecedores`
- `/terceiros/fornecedores/:supplierId`
- `/terceiros/contratos`
- `/terceiros/contratos/:contractId`
- `/colaboradores`
- `/colaboradores/:employeeId`
- `/filiais`

Redirects:

- `/` redireciona para `/home` se autenticado, senão `/login`.
- `*` segue a mesma regra.

### 4.3 Autenticação

Arquivos:

- `src/stores/authStore.ts`
- `src/hooks/useAuth.ts`
- `src/services/auth/authService.ts`
- `src/pages/Login/Login.tsx`
- `src/pages/TwoFactor/TwoFactor.tsx`

Hoje o `authService.ts` é mockado com `setTimeout`. Ele simula login, 2FA, resend e logout. O estado real fica no Zustand persistido em `localStorage` com a chave `auth-storage`, e o token mockado fica em `auth_token`.

Fluxo atual:

1. Usuário informa email e senha em `/login`.
2. `useAuth().login()` chama `authService.login()`.
3. Se ok, navega para `/two-factor` levando email via `location.state`.
4. Usuário informa código de 6 dígitos.
5. `TwoFactor` chama `authService.verifyTwoFactor()`.
6. Se ok, `authStore.login(user, token)` autentica e navega para `/home`.
7. Logout na sidebar chama `authStore.logout()` e navega para `/login`.

Ponto importante: o `login` inicial ainda não salva o token, só a confirmação do 2FA salva.

## 5. Design system atual

### 5.1 Fonte

Fonte principal: `Gellix`, carregada por `@font-face` em `src/styles/variables.css`.

Pesos disponíveis:

- 400 regular.
- 500 medium.
- 600 semibold.
- 700 bold.

Token:

```css
--font-family: 'Gellix', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### 5.2 Cores principais

Arquivo: `src/styles/variables.css`.

Marca:

```css
--brand-primary: #2C2C9E;
--brand-primary-lightest: #ebebf7;
--brand-primary-lighter: #d6d6ef;
--brand-primary-light: #adade0;
--brand-primary-medium: #8585d0;
--brand-primary-strong: #3434b1;
--brand-primary-dark: #24247e;
--brand-primary-darker: #1c1c5f;
--brand-primary-darkest: #14143f;
```

Neutros:

```css
--white: #ffffff;
--black: #111827;
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;
```

Semânticas:

```css
--green: #A8CE38;
--green-success: #10b981;
--warning: #f59e0b;
--danger: #ef4444;
--info: #3b82f6;
```

Aliases usados na UI:

```css
--background: var(--gray-50);
--surface: var(--white);
--surface-muted: var(--gray-50);
--surface-hover: var(--gray-100);
--border: var(--gray-200);
--border-strong: var(--gray-300);
--text-primary: var(--gray-900);
--text-secondary: var(--gray-700);
--text-muted: var(--gray-500);
--text-subtle: var(--gray-400);
--text-inverse: var(--white);
```

### 5.3 Espaçamento

```css
--spacing-xs: 0.25rem;
--spacing-sm: 0.5rem;
--spacing-md: 1rem;
--spacing-lg: 1.5rem;
--spacing-xl: 2rem;
--spacing-2xl: 3rem;
```

### 5.4 Radius

```css
--radius-sm: 0.25rem;
--radius-md: 0.375rem;
--radius-lg: 0.5rem;
--radius-xl: 0.75rem;
--radius-full: 9999px;
```

Padrão visual dominante:

- Cards brancos com `--surface`.
- Áreas internas suaves com `--surface-muted`.
- Bordas `1px solid var(--border)`.
- Radius normalmente `--radius-xl` para containers e `--radius-lg` para itens internos.
- Sombras leves `--shadow-sm` e modais com `--shadow-lg`.

### 5.5 Z-index

```css
--z-dropdown: 1000;
--z-sticky: 1020;
--z-fixed: 1030;
--z-modal-backdrop: 1040;
--z-modal: 1050;
--z-popover: 1060;
--z-tooltip: 1070;
```

Use esses tokens em dropdown, sidebar, modal e tooltip.

## 6. Componentes comuns

Export central: `src/components/common/index.ts`.

### 6.1 Button

Arquivo: `src/components/common/Button/Button.tsx`.

Props principais:

- `variant`: `primary | secondary | outline | ghost`.
- `size`: `sm | md | lg`.
- `isLoading`.
- `leftIcon`.
- `rightIcon`.
- `fullWidth`.

Uso esperado:

```tsx
<Button onClick={handleClick}>Salvar</Button>
<Button variant="outline">Cancelar</Button>
<Button variant="ghost">Voltar</Button>
```

### 6.2 Input

Arquivo: `src/components/common/Input/Input.tsx`.

Usado em login, formulários e criação de corridas. Suporta label, erro, ícone, disabled, required etc.

### 6.3 Select

Arquivo: `src/components/common/Select/Select.tsx`.

Select customizado acessível com:

- `label`
- `placeholder`
- `value`
- `options`
- `onChange`
- `required`
- `disabled`

É usado no formulário de nova solicitação, contratos e seleção de campos controlados.

### 6.4 Card

Arquivo: `src/components/common/Card/Card.tsx`.

Usado principalmente no login/2FA. Mantém padrão de superfície elevada.

### 6.5 Table

Arquivo: `src/components/common/Table/Table.tsx`.

Tabela genérica tipada:

- `columns`
- `data`
- `keyExtractor`
- `actions`
- `pagination`
- `onSortChange`
- `emptyMessage`

Ordenação local se `onSortChange` não for fornecido. Se `onSortChange` existir, assume ordenação server-side.

### 6.6 StatusBadge

Arquivo: `src/components/common/StatusBadge/StatusBadge.tsx`.

Status aceitos:

```ts
'pendente' | 'aprovado' | 'rejeitado' | 'em_andamento' | 'cancelado'
```

Labels:

- Pendente.
- Aprovado.
- Rejeitado.
- Em andamento.
- Cancelado.

Importante: usar sempre `StatusBadge` para status, não criar badge local ad hoc.

### 6.7 StatCard

Card para métricas/resumos no dashboard/listagens.

### 6.8 TableToolbar e FilterDropdown

Usados para busca, filtros e ações no topo das tabelas.

### 6.9 Toast

`ToastProvider` envolve a aplicação em `App.tsx`.

Uso:

```tsx
const { showToast } = useToast();

showToast({
  type: 'success',
  title: 'Solicitação criada',
  description: 'A corrida foi solicitada com sucesso.',
});
```

Tipos esperados: success, info, warning, error conforme componente.

## 7. Layout

### 7.1 MainLayout

Arquivo: `src/components/layout/MainLayout/MainLayout.tsx`.

Renderiza:

- `Sidebar` fixa.
- `Header`.
- `Outlet` das rotas protegidas.

Controla estado de sidebar recolhida.

### 7.2 Sidebar

Arquivos:

- `src/components/layout/Sidebar/Sidebar.tsx`
- `src/components/layout/Sidebar/Sidebar.module.css`

Contém menus:

- Home.
- Dashboards.
  - Visão executiva.
  - Gastos.
  - Preço & Auditoria.
- Corridas.
  - Solicitações.
  - Calendário.
  - Histórico.
- Terceiros.
  - Fornecedores.
  - Contratos.
- Colaboradores.
- Filiais.

Tem:

- Logo Seara/JBS.
- Botão de recolher.
- Card do usuário Marina Oliveira.
- Botão `Sair` com `sair.svg`.
- Popup de confirmação de logout.

Logout:

- Abre modal.
- `Cancelar` fecha.
- `Sair` chama `logout()` do Zustand e redireciona para `/login`.

### 7.3 Header

Arquivo: `src/components/layout/Header/Header.tsx`.

Responsável por título/breadcrumb conforme rota, incluindo rotas dinâmicas de revisão, criação de solicitação e edição de permissões de colaborador.

Também possui o botão de notificações no canto direito. O botão abre um popup/dropdown com:

- Cabeçalho `Notificações`.
- Contador/copy de atualizações recentes.
- Ação visual `Marcar como lidas`.
- Lista de notificações recentes com indicador de não lida.
- Ação `Ver todas as notificações`.

Hoje os itens são mockados dentro do próprio `Header.tsx`. Quando existir API, mover para um service/hook dedicado, por exemplo `notificationsApi.list()` e `notificationsApi.markAsRead()`.

## 8. Telas e fluxos existentes

### 8.1 Login

Arquivo: `src/pages/Login/Login.tsx`.

Valida:

- Email obrigatório e formato básico.
- Senha obrigatória e mínimo de 6 caracteres.

Depois navega para 2FA.

### 8.2 TwoFactor

Arquivo: `src/pages/TwoFactor/TwoFactor.tsx`.

- Código de 6 dígitos.
- Inputs separados.
- Suporte a paste.
- Navega para `/home` ao confirmar.

### 8.3 Solicitações de corrida

Arquivo: `src/pages/Listings/RideRequestsList.tsx`.

Lista solicitações mockadas de `src/pages/Listings/listingsData.ts`.

Possui botão `Cadastrar solicitação`, que navega para:

```txt
/corridas/solicitacoes/nova
```

### 8.4 Nova solicitação de corrida

Arquivo: `src/pages/Rides/RideRequestCreate.tsx`.

Fluxo em 3 etapas:

1. Dados da corrida.
2. Selecionar fornecedor.
3. Revisar solicitação.

Regras implementadas:

- Stepper não clicável. Navegação só por botões.
- Solicitante fixo/desabilitado.
- Campo `Corrida para`.
- Campo `Nome de quem vai usar` como select de colaboradores ativos.
- Se `Corrida para = Para mim`, `Nome de quem vai usar` vira a própria solicitante e fica desabilitado.
- Se mudar para outra opção, o campo é limpo para forçar seleção explícita.
- Motivo como select.
- Passageiros começa em 1.
- Se passageiros > 1, mostra CPFs dos passageiros.
- CPF do passageiro 1 vem do beneficiário selecionado e fica disabled.
- CPFs adicionais começam vazios.
- Fornecedor não vem pré-selecionado.
- Campos obrigatórios marcados com `required`.
- Validação bloqueia avanço sem campos obrigatórios, CPFs quando aplicável e fornecedor.
- Solicitação feita via portal é confirmada diretamente, sem aprovação/revisão.
- Etapa 1 não mostra card de origem/destino.
- Etapa final mostra card de origem/destino como resumo.
- CPFs na etapa final aparecem em cards rotulados por passageiro.

Ponto de atenção: estimativa de km e valor ainda são mockadas:

```ts
const estimatedKm = '18,6 km';
const estimatedValue = 'R$ 148,90';
```

### 8.5 Revisão de solicitação

Arquivo: `src/pages/Rides/RideReview.tsx`.

Rota:

```txt
/corridas/solicitacoes/:requestId/revisar
```

Fluxo em 3 etapas:

1. Informações da corrida.
2. Selecionar fornecedor.
3. Revisar tudo.

Regras/decisões:

- Stepper não clicável.
- Card lateral de resumo removido; mantém Trajeto + Ações.
- Etapa 1 tem card de Origem/Destino.
- Etapa final também tem card de Origem/Destino.
- Seleção de fornecedor usa radio visual e semântica `radiogroup`/`radio`.
- Botões:
  - Reprovar solicitação.
  - Cancelar revisão.
  - Voltar.
  - Próximo.
  - Finalizar revisão.

### 8.6 Colaboradores e edição de permissões

Arquivos:

- `src/pages/Listings/EmployeesList.tsx`
- `src/pages/Listings/EmployeeDetails.tsx`
- `src/pages/Listings/EmployeeDetails.module.css`

Rotas:

```txt
/colaboradores
/colaboradores/:employeeId
```

A tela de listagem usa `Table`, `TableToolbar`, `FilterDropdown`, `StatusBadge` e dados mockados de `employees` em `listingsData.ts`.

O botão de ação da tabela navega para `/colaboradores/:employeeId`.

A tela de detalhes/permissões foi criada seguindo a referência visual `Colaboradores - Editar permissões_ Visão geral.png` e contém:

- Card hero com avatar, nome, email, status e ações.
- Botão `Voltar`.
- Botão `Salvar alterações` visual, ainda sem persistência real.
- Card de dados cadastrais:
  - CPF.
  - Cargo.
  - Código Seara.
  - Disponibilidade.
  - Data de ativação.
  - Data de desativação.
- Card de permissões:
  - Solicitações de corrida.
  - Aprovação e revisão.
  - Operação de fornecedor.
- Card lateral de perfis vinculados:
  - Solicitante.
  - Aprovador.
  - Motorista.
- Card lateral de vínculo:
  - Filial.
  - Fornecedor.

Por enquanto os checkboxes de perfil são `readOnly`, porque ainda não existe endpoint de atualização de permissões. Quando a API estiver pronta, trocar para estado controlado local e salvar via endpoint dedicado.

Endpoint futuro recomendado:

```txt
GET   /employees/:employeeId
PATCH /employees/:employeeId/permissions
```

Payload sugerido:

```ts
{
  profiles: string[];
}
```

### 8.7 Histórico, filiais, fornecedores e contratos

Essas telas usam majoritariamente:

- `Table`.
- `TableToolbar`.
- `FilterDropdown`.
- `StatusBadge`.
- Dados mockados locais.

Dados principais:

- `src/pages/Listings/listingsData.ts`
- `src/pages/Suppliers/suppliersData.ts`
- `src/pages/Contracts/contractsData.ts`

Contratos tem modal manual para upload de PDF, seguindo padrão visual que também inspirou o popup de logout.

O header tem popup de notificações com dados mockados locais; no futuro deve consumir API própria de notificações.

## 9. Dados mockados atuais

Mocks relevantes:

- `rideRequests`: solicitações de corrida.
- `rideHistory`: histórico de corridas.
- `employees`: colaboradores.
- `branches`: filiais.
- `suppliers`: fornecedores.
- `contracts`: contratos.

Quando a API estiver pronta, migrar gradualmente:

1. Criar hook por tela consumindo service.
2. Trocar `listingsData.ts`/`suppliersData.ts`/`contractsData.ts` por chamadas assíncronas.
3. Manter tipos DTO próximos dos contratos do backend.
4. Só remover mocks depois que cada tela estiver 100% conectada.

## 10. API futura em NestJS

Foi criada uma base pronta em `src/services`.

### 10.1 API client

Arquivo:

```txt
src/services/api/apiClient.ts
```

Recursos:

- Usa `fetch`, sem dependência externa.
- Lê base URL de `VITE_API_URL`.
- Fallback: `http://localhost:3000`.
- Injeta `Authorization: Bearer <token>` automaticamente, exceto se `skipAuth` for true.
- Suporta query params.
- Suporta body JSON.
- Suporta `FormData` sem setar `Content-Type` manualmente.
- Lança `ApiError` com `status` e `data`.

Uso:

```ts
apiClient.get<T>('/endpoint');
apiClient.post<T>('/endpoint', payload);
apiClient.patch<T>('/endpoint/:id', payload);
apiClient.delete<T>('/endpoint/:id');
```

### 10.2 Auth API

Arquivo:

```txt
src/services/auth/authApi.ts
```

Endpoints esperados:

```txt
POST /auth/login
POST /auth/2fa/verify
POST /auth/2fa/resend
GET  /auth/me
POST /auth/logout
```

Payloads esperados:

```ts
login({ email, password })
verifyTwoFactor({ email, code })
resendTwoFactorCode(email)
```

Resposta esperada de login/2FA:

```ts
{
  user: {
    id: string;
    name: string;
    email: string;
    profile: 'admin-master' | 'admin' | 'aprovador' | 'fornecedor';
  },
  token: string;
}
```

### 10.3 Rides API

Arquivo:

```txt
src/services/rides/ridesApi.ts
```

Endpoints esperados:

```txt
GET  /ride-requests
GET  /ride-requests/:requestId
POST /ride-requests
POST /ride-requests/:requestId/approve
POST /ride-requests/:requestId/reject
POST /ride-requests/:requestId/cancel
GET  /rides/history
```

DTO base de criação:

```ts
interface RideRequestPayload {
  rideFor: string;
  beneficiaryName: string;
  origin: string;
  destination: string;
  rideAt: string;
  rideType: string;
  costCenter: string;
  passengers: number;
  passengerCpfs: string[];
  reason: string;
  supplierId?: number;
}
```

### 10.4 Platform API

Arquivo:

```txt
src/services/platform/platformApi.ts
```

Services:

- `suppliersApi`
- `contractsApi`
- `employeesApi`
- `branchesApi`

Endpoints esperados:

```txt
GET /suppliers
GET /suppliers/:supplierId

GET  /contracts
GET  /contracts/:contractId
POST /contracts

GET /employees
GET /employees/:employeeId

GET /branches
GET /branches/:branchId
```

Para upload de contrato:

```ts
const formData = new FormData();
formData.append('file', file);
formData.append('supplierId', String(supplierId));
contractsApi.upload(formData);
```

### 10.5 Padrão de paginação sugerido para NestJS

O frontend espera algo assim:

```ts
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}
```

Query params recomendados:

```txt
?page=1&perPage=10&search=texto&status=aprovado&sortBy=name&sortDirection=asc
```

### 10.6 CORS no NestJS

No backend NestJS, habilitar CORS para o frontend:

```ts
app.enableCors({
  origin: ['http://localhost:5173'],
  credentials: true,
});
```

Se usar cookies HttpOnly no futuro, adaptar o `apiClient` para `credentials: 'include'` e revisar armazenamento de token. Hoje usa Bearer token no `localStorage`.

## 11. Perfis e permissões

Foi criada base em:

```txt
src/types/profile.types.ts
src/routes/ProfileRoute.tsx
src/hooks/usePermissions.ts
```

Perfis definidos:

```ts
type UserProfile = 'admin-master' | 'admin' | 'aprovador' | 'fornecedor';
```

Labels:

- `admin-master`: Admin Master.
- `admin`: Admin.
- `aprovador`: Aprovador.
- `fornecedor`: Fornecedor.

### 11.1 Permissões atuais

```ts
type Permission =
  | 'dashboard:read'
  | 'rides:read'
  | 'rides:create'
  | 'rides:review'
  | 'rides:approve'
  | 'rides:reject'
  | 'rides:execute'
  | 'suppliers:read'
  | 'suppliers:manage'
  | 'contracts:read'
  | 'contracts:manage'
  | 'employees:read'
  | 'employees:manage'
  | 'branches:read'
  | 'branches:manage'
  | 'users:manage'
  | 'settings:manage';
```

### 11.2 Matriz sugerida

Admin Master:

- Acesso total.
- Gerencia usuários/configurações.
- Gerencia fornecedores, contratos, colaboradores, filiais.
- Aprova/reprova/revisa corridas.

Admin:

- Acesso operacional amplo.
- Gerencia cadastros principais.
- Aprova/reprova/revisa corridas.
- Não gerencia configurações globais nem usuários master.

Aprovador:

- Lê dashboards e cadastros.
- Revisa, aprova e reprova solicitações.
- Não gerencia fornecedores/contratos/colaboradores/filiais.

Fornecedor:

- Enxerga corridas atribuídas.
- Executa/acompanha corridas.
- Lê contratos próprios.
- Não acessa gestão interna.

### 11.3 Como proteger uma rota por perfil

Exemplo:

```tsx
<Route
  path="/admin/usuarios"
  element={
    <ProfileRoute allowedProfiles={['admin-master']}>
      <UsersPage />
    </ProfileRoute>
  }
/>
```

Por permissão:

```tsx
<Route
  path="/corridas/solicitacoes/:requestId/revisar"
  element={
    <ProfileRoute requiredPermission="rides:review">
      <RideReview />
    </ProfileRoute>
  }
/>
```

Por qualquer permissão:

```tsx
<ProfileRoute requiredAnyPermission={['rides:approve', 'rides:reject']}>
  <RideReview />
</ProfileRoute>
```

### 11.4 Como controlar UI por permissão

Hook:

```ts
const { can, isAdminMaster, isSupplier } = usePermissions();
```

Uso:

```tsx
{can('rides:create') && <Button>Cadastrar solicitação</Button>}
```

Importante: controle de UI não substitui segurança no backend. O NestJS também precisa aplicar guards por perfil/permissão.

## 12. Como migrar mocks para API real

Estratégia recomendada:

### Etapa 1 — Auth real

1. Implementar endpoints NestJS:
   - `POST /auth/login`
   - `POST /auth/2fa/verify`
   - `POST /auth/2fa/resend`
   - `GET /auth/me`
   - `POST /auth/logout`
2. Trocar `authService.ts` para chamar `authApi.ts`.
3. Garantir que `User` retorne `profile`.
4. Validar `ProtectedRoute`.
5. Validar logout.

### Etapa 2 — Listagens

Migrar uma tela por vez:

1. Solicitações.
2. Histórico.
3. Fornecedores.
4. Contratos.
5. Colaboradores.
6. Filiais.

Para cada tela:

- Criar estado `isLoading`, `error`, `data`, `pagination`.
- Chamar service em `useEffect`.
- Passar resultado para `Table`.
- Manter fallback de empty state.
- Só remover mock quando a tela estiver estável.

### Etapa 3 — Corridas

- Nova solicitação deve chamar `ridesApi.createRequest()`.
- Revisão deve chamar:
  - `ridesApi.approveRequest()`.
  - `ridesApi.rejectRequest()`.
  - `ridesApi.cancelRequest()` se existir cancelamento real.
- Estimativa de km/valor deve vir do backend ou de endpoint dedicado.

Sugestão de endpoint para estimativa:

```txt
POST /ride-requests/estimate
```

Payload:

```ts
{
  origin: string;
  destination: string;
  rideAt: string;
  rideType: string;
  passengers: number;
}
```

Resposta:

```ts
{
  estimatedDistanceKm: number;
  estimatedValue: string;
  availableSuppliers: SupplierDto[];
}
```

## 13. Regras de negócio já decididas

- Etapas/steppers não devem ser clicáveis; navegação só por botões.
- Solicitação feita via portal não vai para aprovação; confirma diretamente.
- Fornecedor não deve vir pré-selecionado na criação.
- Campos obrigatórios devem bloquear avanço.
- `Corrida para = Para mim` bloqueia alteração de `Nome de quem vai usar`.
- Primeiro CPF pertence ao beneficiário/colaborador selecionado e fica desabilitado.
- CPFs adicionais são obrigatórios quando passageiros > 1.
- Badges de status devem usar `StatusBadge` padrão.
- Status `cancelado` deve usar vermelho.
- Select deve manter alinhamento visual com Input.
- Cards devem seguir padrão branco/surface-muted, bordas, radius e tokens.

## 14. Pendências técnicas e funcionais

### 14.1 Integração real com API

Ainda não existe consumo real de backend nas telas. Services foram criados, mas as telas seguem usando mocks.

Pendências:

- Trocar `authService` mock por `authApi`.
- Conectar listagens aos endpoints.
- Conectar criação/revisão de corrida aos endpoints.
- Definir tratamento global para 401/403 no `apiClient`.
- Definir refresh token ou estratégia de expiração.

### 14.2 Segurança

- Evitar manter JWT em `localStorage` se o contexto exigir segurança mais forte. Preferir cookie HttpOnly + SameSite se viável.
- Implementar guards no NestJS. Frontend sozinho não protege dados.
- Validar permissões por rota e por endpoint.
- Sanitizar/validar dados de entrada no backend.
- Evitar expor CPF desnecessariamente para perfis sem permissão.

### 14.3 Acessibilidade

Já existem alguns cuidados:

- `aria-label` em botões de ação.
- `role="dialog"`, `aria-modal`, `aria-labelledby` em modal.
- `radiogroup`/`radio` em seleção de fornecedor.
- `aria-current` no stepper.

Melhorias pendentes:

- Fechar modal com `Escape`.
- Trap focus em modais.
- Garantir navegação por teclado em todos dropdowns.
- Revisar contraste de todos estados disabled/hover.

### 14.4 Testes

Não há testes automatizados ainda.

Sugestão:

- Unitários para helpers de permissão.
- Testes de componentes para Button, Select, Table e StatusBadge.
- Testes de fluxo para criação de solicitação.
- Testes de auth e guards.

Ferramentas sugeridas:

- Vitest.
- React Testing Library.
- MSW para mock de API.

### 14.5 Estado remoto/cache

Hoje não usa React Query/TanStack Query. Quando conectar API, considerar TanStack Query para:

- cache.
- loading/error padronizados.
- invalidação pós-mutação.
- paginação.

Não é obrigatório para MVP, mas ajuda muito conforme crescer.

### 14.6 Componentização futura

Possíveis extrações:

- Modal genérico.
- Stepper genérico.
- RouteCard/OriginDestinationCard.
- SupplierRadioGroup.
- PassengerCpfList.
- PageSection/CardSection.

Não extrair antes de ter repetição real suficiente. Evitar over-engineering.

## 15. Guia para replicar em outro contexto

Checklist recomendado:

1. Copiar estrutura base do projeto.
2. Atualizar marca:
   - Logo em `assets/images`.
   - Tokens em `styles/variables.css`.
   - Textos de sidebar/header/login.
3. Atualizar rotas em `src/routes/index.tsx`.
4. Atualizar menus em `Sidebar.tsx`.
5. Atualizar tipos de domínio.
6. Atualizar mocks iniciais ou remover se API já existir.
7. Configurar `.env` com `VITE_API_URL`.
8. Ajustar `authApi` aos endpoints reais.
9. Garantir que backend retorne `profile` compatível.
10. Aplicar `ProfileRoute` nas rotas sensíveis.
11. Usar `usePermissions()` para esconder ações que o perfil não pode executar.
12. Rodar `npm run build`.
13. Validar fluxos principais manualmente.

## 16. Contrato recomendado com NestJS

### 16.1 User

```ts
interface UserDto {
  id: string;
  name: string;
  email: string;
  profile: 'admin-master' | 'admin' | 'aprovador' | 'fornecedor';
}
```

### 16.2 Auth response

```ts
interface AuthResponseDto {
  user: UserDto;
  token: string;
}
```

### 16.3 Erro padrão

NestJS costuma retornar:

```json
{
  "statusCode": 400,
  "message": "Mensagem de erro",
  "error": "Bad Request"
}
```

O `apiClient` já tenta ler `message` automaticamente.

### 16.4 Paginação

Usar padrão:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "perPage": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## 17. Convenções de código

- React function components.
- CSS Modules por componente/tela.
- Tipagem explícita para dados compartilhados.
- Evitar `any`.
- Preferir `unknown` quando dado ainda não tem contrato fechado.
- Componentes pequenos e com responsabilidade clara.
- Reutilizar componentes comuns antes de criar novos.
- Não criar estilos inline salvo exceções pequenas já existentes.
- Rodar `npm run build` após mudanças relevantes.

## 18. Arquivos mais importantes para manutenção

- `src/styles/variables.css`: tokens globais.
- `src/routes/index.tsx`: mapa de rotas.
- `src/routes/ProtectedRoute.tsx`: autenticação básica.
- `src/routes/ProfileRoute.tsx`: controle por perfil/permissão.
- `src/types/profile.types.ts`: matriz de permissões.
- `src/stores/authStore.ts`: auth global.
- `src/services/api/apiClient.ts`: base HTTP.
- `src/services/auth/authApi.ts`: endpoints de auth futura.
- `src/services/rides/ridesApi.ts`: endpoints de corrida futura.
- `src/services/platform/platformApi.ts`: endpoints de cadastros.
- `src/components/layout/Sidebar/Sidebar.tsx`: menu e logout.
- `src/components/layout/Header/Header.tsx`: títulos/breadcrumbs e popup de notificações.
- `src/pages/Rides/RideRequestCreate.tsx`: criação de solicitação.
- `src/pages/Rides/RideReview.tsx`: revisão de solicitação.
- `src/pages/Listings/EmployeesList.tsx`: listagem de colaboradores.
- `src/pages/Listings/EmployeeDetails.tsx`: visão geral/edição visual de permissões do colaborador.
- `src/pages/Listings/listingsData.ts`: mocks centrais.

## 19. O que ainda precisa ser feito antes de produção

Obrigatório:

- API real.
- Auth real com expiração/renovação.
- Guards reais no backend.
- Tratamento de 401/403 no frontend.
- Loading/error states nas telas.
- Testes mínimos dos fluxos críticos.
- Revisão de acessibilidade dos modais/dropdowns.
- Remover mocks ou isolar como fallback/dev.
- Validar CPF no backend.
- Validar autorização para exibição de CPF por perfil.

Desejável:

- TanStack Query.
- Modal genérico.
- Stepper genérico.
- Storybook ou documentação visual dos componentes.
- E2E com Playwright.
- Observabilidade/log de erro frontend.

## 20. Resumo rápido para quem vai assumir

Este é um frontend Vite/React/TS com design system próprio via CSS variables, componentes comuns bem definidos e telas mockadas para gestão de frota. A maior atenção está nos fluxos de corrida: criação e revisão. A base para API NestJS e perfis já foi criada, mas as telas ainda precisam ser conectadas aos services. Para replicar, comece por marca/tokens/rotas/sidebar, depois auth, depois listagens, depois criação/revisão de corridas. Sempre preserve o padrão visual: cards brancos, surface-muted para blocos internos, bordas suaves, radius consistente, badges padronizadas e navegação por botões em fluxos multi-step.
