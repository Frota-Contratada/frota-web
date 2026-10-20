#!/usr/bin/env node
/**
 * Script para remoção segura de comentários de código no projeto.
 *
 * Suporta: .ts, .tsx, .js, .jsx, .mjs, .cjs, .css, .scss
 *
 * Preserva strings, URLs (ex: "https://..."), expressões regulares e
 * template literals sem corrupção.
 *
 * Uso:
 *   node scripts/remove-comments.mjs [caminho] [opções]
 *
 * Exemplos:
 *   node scripts/remove-comments.mjs --dry-run
 *   node scripts/remove-comments.mjs src
 *   node scripts/remove-comments.mjs src/components --all
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// Diretórios e arquivos ignorados
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.vite',
  '.gemini',
]);

const SUPPORTED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.css',
  '.scss',
]);

// Diretivas de compilador/linter e referências que devem ser preservadas por padrão
const DIRECTIVE_REGEX = /^\s*(\/\/\/\s*<reference|\/\/\s*@(ts-|eslint|prettier)|(\/\*|\/\/)\s*(eslint-|istanbul|vite-|@preserve))/i;

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    target: 'src',
    dryRun: false,
    all: false,
    help: false,
  };

  for (const arg of args) {
    if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg === '--all' || arg === '-a') {
      options.all = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (!arg.startsWith('-')) {
      options.target = arg;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
Uso: node scripts/remove-comments.mjs [caminho] [opções]

Argumentos:
  [caminho]       Diretório ou arquivo a ser processado (padrão: "src")

Opções:
  -d, --dry-run   Executa em modo de simulação sem alterar os arquivos
  -a, --all       Remove TODOS os comentários, incluindo diretivas (@ts-ignore, eslint-disable)
  -h, --help      Exibe esta mensagem de ajuda

Exemplos:
  node scripts/remove-comments.mjs
  node scripts/remove-comments.mjs --dry-run
  node scripts/remove-comments.mjs src/components/maps
  node scripts/remove-comments.mjs src --all
`);
}

function canStartRegex(text, index) {
  let p = index - 1;
  while (p >= 0 && /\s/.test(text[p])) p--;
  if (p < 0) return true;
  const ch = text[p];
  if (/[=(?:!,;&|{[(<>]/.test(ch)) return true;
  const before = text.slice(Math.max(0, p - 10), p + 1);
  if (/(^|[\s(])(return|typeof|instanceof|yield|await|case|delete|throw|void)$/.test(before)) {
    return true;
  }
  return false;
}

/**
 * Remove comentários de arquivos JavaScript/TypeScript/JSX preservando strings, templates e regexes.
 */
function stripCommentsFromJsTs(code, removeAll) {
  const len = code.length;
  let result = '';
  let i = 0;
  let commentsCount = 0;
  const stack = [];

  while (i < len) {
    const ch = code[i];
    const next = i + 1 < len ? code[i + 1] : '';

    // 1. Strings normais com aspas simples ou duplas
    if (ch === "'" || ch === '"') {
      const quote = ch;
      result += ch;
      i++;
      while (i < len) {
        const c = code[i];
        result += c;
        if (c === '\\') {
          i++;
          if (i < len) result += code[i];
        } else if (c === quote) {
          break;
        }
        i++;
      }
      i++;
      continue;
    }

    // 2. Início de template literal
    if (ch === '`') {
      result += ch;
      stack.push('TEMPLATE');
      i++;
      while (i < len && stack[stack.length - 1] === 'TEMPLATE') {
        const c = code[i];
        const n = i + 1 < len ? code[i + 1] : '';
        if (c === '\\') {
          result += c;
          i++;
          if (i < len) result += code[i];
        } else if (c === '$' && n === '{') {
          result += '${';
          i += 2;
          stack.push('BRACE');
          break;
        } else if (c === '`') {
          result += c;
          stack.pop();
          i++;
          break;
        } else {
          result += c;
        }
        i++;
      }
      continue;
    }

    // 3. Fechamento de chaves ou template
    if (ch === '}') {
      if (stack.length > 0 && stack[stack.length - 1] === 'BRACE') {
        stack.pop();
        result += ch;
        i++;
        while (i < len && stack[stack.length - 1] === 'TEMPLATE') {
          const c = code[i];
          const n = i + 1 < len ? code[i + 1] : '';
          if (c === '\\') {
            result += c;
            i++;
            if (i < len) result += code[i];
          } else if (c === '$' && n === '{') {
            result += '${';
            i += 2;
            stack.push('BRACE');
            break;
          } else if (c === '`') {
            result += c;
            stack.pop();
            i++;
            break;
          } else {
            result += c;
          }
          i++;
        }
        continue;
      }
    }

    // 4. Comentário de linha única // ...
    if (ch === '/' && next === '/') {
      let end = i + 2;
      while (end < len && code[end] !== '\n') {
        end++;
      }
      const commentText = code.slice(i, end);
      if (!removeAll && DIRECTIVE_REGEX.test(commentText)) {
        result += commentText;
        i = end;
        continue;
      }
      commentsCount++;
      i = end;
      continue;
    }

    // 5. Comentário de bloco /* ... */
    if (ch === '/' && next === '*') {
      let end = i + 2;
      while (end + 1 < len && !(code[end] === '*' && code[end + 1] === '/')) {
        end++;
      }
      end += 2;
      const commentText = code.slice(i, end);
      if (!removeAll && DIRECTIVE_REGEX.test(commentText)) {
        result += commentText;
        i = end;
        continue;
      }
      commentsCount++;

      // Trata blocos JSX {/* comentário */}
      let beforeIdx = result.length - 1;
      while (beforeIdx >= 0 && /\s/.test(result[beforeIdx])) beforeIdx--;
      let afterIdx = end;
      while (afterIdx < len && /\s/.test(code[afterIdx])) afterIdx++;

      if (beforeIdx >= 0 && result[beforeIdx] === '{' && afterIdx < len && code[afterIdx] === '}') {
        result = result.slice(0, beforeIdx);
        i = afterIdx + 1;
        continue;
      }

      i = end;
      continue;
    }

    // 6. Expressão Regular Literal
    if (ch === '/' && canStartRegex(result, result.length)) {
      result += ch;
      i++;
      let inCharClass = false;
      while (i < len) {
        const c = code[i];
        result += c;
        if (c === '\\') {
          i++;
          if (i < len) result += code[i];
        } else if (c === '[') {
          inCharClass = true;
        } else if (c === ']') {
          inCharClass = false;
        } else if (c === '/' && !inCharClass) {
          i++;
          while (i < len && /[gimsuy]/.test(code[i])) {
            result += code[i];
            i++;
          }
          break;
        }
        i++;
      }
      continue;
    }

    result += ch;
    i++;
  }

  if (commentsCount === 0) {
    return { modified: false, content: code, commentsCount: 0 };
  }

  const cleaned = cleanExcessiveBlankLines(result);
  return {
    modified: cleaned !== code,
    content: cleaned,
    commentsCount,
  };
}

/**
 * Remove comentários de arquivos CSS/SCSS de forma segura.
 */
function stripCommentsFromCss(content) {
  let result = '';
  let inString = false;
  let stringChar = '';
  let inComment = false;
  let commentsCount = 0;
  const len = content.length;

  for (let i = 0; i < len; i++) {
    const char = content[i];
    const nextChar = i + 1 < len ? content[i + 1] : '';

    if (inComment) {
      if (char === '*' && nextChar === '/') {
        inComment = false;
        i++;
      }
      continue;
    }

    if (inString) {
      result += char;
      if (char === '\\') {
        if (nextChar) {
          result += nextChar;
          i++;
        }
      } else if (char === stringChar) {
        inString = false;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      stringChar = char;
      result += char;
      continue;
    }

    if (char === '/' && nextChar === '*') {
      inComment = true;
      commentsCount++;
      i++;
      continue;
    }

    if (char === '/' && nextChar === '/') {
      commentsCount++;
      while (i < len && content[i] !== '\n') {
        i++;
      }
      if (i < len && content[i] === '\n') {
        result += '\n';
      }
      continue;
    }

    result += char;
  }

  if (commentsCount === 0) {
    return { modified: false, content, commentsCount: 0 };
  }

  const cleaned = cleanExcessiveBlankLines(result);
  return {
    modified: cleaned !== content,
    content: cleaned,
    commentsCount,
  };
}

function cleanExcessiveBlankLines(code) {
  return code
    .replace(/[ \t]+$/gm, '')
    .replace(/(\r?\n){3,}/g, '\n\n');
}

function collectFiles(targetPath, fileList = []) {
  if (!fs.existsSync(targetPath)) {
    return fileList;
  }

  const stat = fs.statSync(targetPath);

  if (stat.isFile()) {
    const ext = path.extname(targetPath).toLowerCase();
    if (SUPPORTED_EXTENSIONS.has(ext)) {
      fileList.push(targetPath);
    }
    return fileList;
  }

  if (stat.isDirectory()) {
    const base = path.basename(targetPath);
    if (IGNORED_DIRS.has(base)) {
      return fileList;
    }

    const entries = fs.readdirSync(targetPath, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry.name)) continue;

      const fullPath = path.join(targetPath, entry.name);
      if (entry.isDirectory()) {
        collectFiles(fullPath, fileList);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          fileList.push(fullPath);
        }
      }
    }
  }

  return fileList;
}

function run() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  const targetPath = path.resolve(process.cwd(), options.target);
  if (!fs.existsSync(targetPath)) {
    console.error(`❌ Caminho não encontrado: ${options.target}`);
    process.exit(1);
  }

  console.log(`\n🧹 [Remover Comentários]`);
  console.log(`📁 Alvo: ${options.target}`);
  console.log(`⚙️ Modo: ${options.dryRun ? '🔍 Simulação (--dry-run)' : '✍️ Aplicar alterações no disco'}`);
  console.log(`🛡️ Preservar diretivas (@ts-, eslint): ${options.all ? 'NÃO (remover tudo)' : 'SIM (recomendado)'}\n`);

  const files = collectFiles(targetPath);

  if (files.length === 0) {
    console.log('Nenhum arquivo elegível encontrado.');
    return;
  }

  let totalComments = 0;
  let modifiedFilesCount = 0;
  const startTime = Date.now();

  for (const filePath of files) {
    const relativePath = path.relative(process.cwd(), filePath);
    const ext = path.extname(filePath).toLowerCase();
    const content = fs.readFileSync(filePath, 'utf-8');

    let result;
    if (ext === '.css' || ext === '.scss') {
      result = stripCommentsFromCss(content);
    } else {
      result = stripCommentsFromJsTs(content, options.all);
    }

    if (result.commentsCount > 0) {
      totalComments += result.commentsCount;
      modifiedFilesCount++;
      console.log(`  ✓ ${relativePath} (${result.commentsCount} comentários encontrados)`);

      if (!options.dryRun) {
        fs.writeFileSync(filePath, result.content, 'utf-8');
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 Resumo da execução:`);
  console.log(`  • Arquivos escaneados: ${files.length}`);
  console.log(`  • Arquivos com comentários: ${modifiedFilesCount}`);
  console.log(`  • Total de comentários: ${totalComments}`);
  console.log(`  • Tempo: ${elapsed}s`);

  if (options.dryRun) {
    console.log(`\nℹ️ Modo de simulação concluído. Nenhum arquivo foi modificado.`);
    console.log(`👉 Para aplicar as alterações de verdade, execute:`);
    console.log(`   node scripts/remove-comments.mjs ${options.target !== 'src' ? options.target : ''}`);
  } else {
    console.log(`\n✨ Concluído com sucesso! Os comentários foram removidos.`);
  }
}

run();
