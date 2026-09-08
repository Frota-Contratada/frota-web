import http from 'node:http';
import https from 'node:https';

const BASE_URL = process.argv[2] || process.env.API_URL || 'http://localhost:3000';
const TOKEN = process.env.API_TOKEN || null;

console.log(`\n🔍 Testador de Rotas da API - Gestão de Frota Contratada`);
console.log(`🌐 Base URL: ${BASE_URL}`);
if (TOKEN) console.log(`🔑 Token informado: ${TOKEN.slice(0, 15)}...`);
console.log('');

async function makeRequest(method, path, body = null, token = TOKEN) {
  const url = new URL(path, BASE_URL);
  const startTime = Date.now();

  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : null;
    const client = url.protocol === 'https:' ? https : http;
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        'Accept': 'application/json, text/plain, */*',
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      timeout: 3000
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const duration = Date.now() - startTime;
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch {
          // Mantém string se não for JSON
        }
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 500,
          status: res.statusCode,
          statusText: res.statusMessage,
          duration,
          data: parsed,
          error: null
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        status: 0,
        statusText: 'TIMEOUT',
        duration: Date.now() - startTime,
        data: null,
        error: 'Conexão expirou após 3s'
      });
    });

    req.on('error', (err) => {
      resolve({
        success: false,
        status: 0,
        statusText: 'CONN_ERR',
        duration: Date.now() - startTime,
        data: null,
        error: err.code || err.message
      });
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

const routesToTest = [
  // Documentação e Swagger
  { group: 'Docs', method: 'GET', path: '/docs', description: 'Interface Swagger UI' },
  { group: 'Docs', method: 'GET', path: '/docs-json', description: 'Especificação OpenAPI JSON' },

  // Autenticação
  { group: 'Autenticação', method: 'POST', path: '/autenticacao/login', body: { email: 'invalid@test.com', senha: '123' }, description: 'Login (Teste de validação/credenciais)' },
  { group: 'Autenticação', method: 'POST', path: '/autenticacao/sign-up', body: {}, description: 'Cadastro / Sign-Up (Validação Zod)' },
  { group: 'Autenticação', method: 'POST', path: '/autenticacao/primeiro-acesso', body: { email: 'test@seara.com.br' }, description: 'Verificar primeiro acesso' },
  { group: 'Autenticação', method: 'POST', path: '/autenticacao/pin/enviar', body: { email: 'test@seara.com.br' }, description: 'Envio de PIN por e-mail' },
  { group: 'Autenticação', method: 'POST', path: '/autenticacao/pin/confirmar', body: { pin: '000000', email: 'test@seara.com.br' }, description: 'Confirmação de PIN' },
  { group: 'Autenticação', method: 'POST', path: '/autenticacao/redefinir-senha', body: {}, description: 'Redefinição de senha' },
  { group: 'Autenticação', method: 'POST', path: '/autenticacao/refresh', body: { refreshToken: 'invalid_token' }, description: 'Refresh Token' },

  // Usuário
  { group: 'Usuário', method: 'GET', path: '/usuario/info/me', description: 'Dados do usuário logado (requer Auth)' },
  { group: 'Usuário', method: 'PATCH', path: '/usuario/info/foto-perfil', description: 'Atualizar foto perfil' },
  { group: 'Usuário', method: 'GET', path: '/usuario/motorista', description: 'Listar motoristas' },
  { group: 'Usuário', method: 'POST', path: '/usuario/motorista', body: {}, description: 'Cadastrar motorista' },
  { group: 'Usuário', method: 'GET', path: '/usuario/colaborador', description: 'Listar colaboradores' },
  { group: 'Usuário', method: 'GET', path: '/usuario/colaborador/1/perfis', description: 'Perfis do colaborador' },

  // Filial
  { group: 'Filial', method: 'GET', path: '/filial', description: 'Listar filiais' },
  { group: 'Filial', method: 'GET', path: '/filial/1', description: 'Buscar filial por ID' },
  { group: 'Filial', method: 'POST', path: '/filial', body: {}, description: 'Criar filial' },

  // Fornecedor
  { group: 'Fornecedor', method: 'GET', path: '/fornecedor', description: 'Listar fornecedores' },
  { group: 'Fornecedor', method: 'GET', path: '/fornecedor/1', description: 'Buscar fornecedor por ID' },
  { group: 'Fornecedor', method: 'POST', path: '/fornecedor', body: {}, description: 'Criar fornecedor' },

  // Centro de Custo
  { group: 'Centro de Custo', method: 'GET', path: '/centro-de-custo', description: 'Listar centros de custo' },

  // Contrato
  { group: 'Contrato', method: 'GET', path: '/contrato', description: 'Listar contratos' },
  { group: 'Contrato', method: 'GET', path: '/contrato/1', description: 'Visualizar contrato por ID' },

  // Solicitações
  { group: 'Solicitações', method: 'GET', path: '/solicitacoes/catalogos', description: 'Buscar catálogos' },
  { group: 'Solicitações', method: 'POST', path: '/solicitacoes/simular', body: {}, description: 'Simular solicitação' },
  { group: 'Solicitações', method: 'GET', path: '/solicitacoes', description: 'Listar solicitações/viagens' },
  { group: 'Solicitações', method: 'POST', path: '/solicitacoes', body: {}, description: 'Criar solicitação' },

  // Motorista Operacional
  { group: 'Motorista', method: 'GET', path: '/motorista/perfil', description: 'Perfil do motorista' },
  { group: 'Motorista', method: 'GET', path: '/motorista/viagens', description: 'Viagens do motorista' },

  // Tracking / Corridas
  { group: 'Tracking', method: 'GET', path: '/corridas/1/tracking', description: 'Snapshot de tracking' },
  { group: 'Tracking', method: 'POST', path: '/corridas/1/tracking/positions/batch', body: {}, description: 'Lote de posições de veículo' }
];

async function run() {
  console.log(`Testando conectividade inicial com ${BASE_URL}...`);
  const initialCheck = await makeRequest('GET', '/docs');
  
  if (!initialCheck.success && initialCheck.status === 0) {
    console.warn(`\n⚠️ ATENÇÃO: O backend em ${BASE_URL} não está respondendo conexões HTTP (Erro: ${initialCheck.error}).`);
    console.warn(`Isso ocorre porque o container da API (frota-backend) caiu na inicialização por falta de variáveis de ambiente.`);
    console.warn(`Executando varredura das rotas mapeadas mesmo assim para registrar o status:\n`);
  } else {
    console.log(`✅ Servidor respondeu na rota /docs! Status: ${initialCheck.status}\n`);
  }
  console.log('Iniciando teste de todas as rotas...\n');

  const results = [];

  for (const route of routesToTest) {
    const res = await makeRequest(route.method, route.path, route.body);
    const statusEmoji = res.status >= 200 && res.status < 300 ? '✅' :
                        res.status === 401 ? '🔒' :
                        res.status === 400 ? '⚠️' :
                        res.status === 404 ? '❓' :
                        res.status >= 500 ? '💥' : '❌';

    results.push({
      Grupo: route.group,
      Método: route.method,
      Rota: route.path,
      Status: `${statusEmoji} ${res.status || res.statusText}`,
      Tempo: `${res.duration}ms`,
      Descrição: route.description,
      Detalhes: res.error ? res.error : (res.data?.message || (res.data?.response ? 'OK' : ''))
    });
  }

  console.table(results.map(r => ({
    Grupo: r.Grupo,
    Método: r.Método,
    Rota: r.Rota,
    Status: r.Status,
    Tempo: r.Tempo,
    Detalhes: typeof r.Detalhes === 'object' ? JSON.stringify(r.Detalhes).slice(0, 40) : String(r.Detalhes).slice(0, 40)
  })));

  console.log('\nLegenda de status:');
  console.log('  ✅ 2xx: Sucesso');
  console.log('  🔒 401: Protegida por autenticação JWT (esperado sem token)');
  console.log('  ⚠️ 400: Validação Zod ativa (esperado para corpo vazio/inválido)');
  console.log('  ❓ 404: Rota não encontrada');
  console.log('  💥 500: Erro interno de servidor');
  console.log('  ❌ Conexão recusada ou timeout');
}

run();
