/**
 * Escáner de contenido para NotLimit_Proyecto (TypeScript + JS) sin límites de tamaño.
 * Genera backend_context.txt y frontend_context.txt con el contenido de todos los archivos.
 * Funciona en Node.js CommonJS incluso si package.json usa "type": "module".
 * No requiere instalar dependencias y no modifica el código del proyecto.
 *
 * USO: coloca este archivo en la raíz del proyecto y ejecuta:
 *   node scan_project.cjs
 *
 * SALIDA:
 *   backend_context.txt  -> contenido de archivos de raíz + backend/.
 *   frontend_context.txt -> contenido de archivos de frontend/.
 *
 * SEGURIDAD: omite node_modules, .env*, .md, credenciales habituales y binarios.
 * Revisa los resultados ANTES de compartirlos: un secreto pegado dentro del
 * código fuente todavía podría aparecer.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;

const BACKEND_CONTEXT_FILE = 'backend_context.txt';
const FRONTEND_CONTEXT_FILE = 'frontend_context.txt';

const EXCLUDED_DIRS = new Set([
  'node_modules', '.git', '.vercel', '.next', '.nuxt', '.output',
  'dist', 'build', 'coverage', '.cache', '.turbo', '.parcel-cache',
  '.angular', '.vite', 'vendor', '__pycache__', '.venv', 'venv',
  'imagenes', 'images', 'assets', 'public', '.idea', '.vscode',
]);

const EXCLUDED_FILES = new Set([
  BACKEND_CONTEXT_FILE.toLowerCase(),
  FRONTEND_CONTEXT_FILE.toLowerCase(),
  'estructura-proyecto.txt',
  'files_list.txt',
  'scan_project.cjs', 'scan_project.js',
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  'bun.lock', 'bun.lockb', '.npmrc', '.yarnrc', '.yarnrc.yml',
  '.ds_store', 'thumbs.db', 'id_rsa', 'id_ed25519',
]);

const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs', '.json', '.html',
  '.css', '.scss', '.sass', '.less', '.yaml', '.yml',
  '.vue', '.svelte', '.prisma', '.graphql', '.gql', '.sql', '.toml',
  '.xml', '.py', '.sh', '.ps1', '.txt',
]);

const CONFIG_FILES = new Set([
  '.gitignore', '.prettierrc', '.eslintignore', 'dockerfile',
  'makefile', 'procfile', 'vercel.json',
]);

const backendFiles = [];
const frontendFiles = [];
const warnings = [];

function isSecretOrExcluded(name) {
  const lower = name.toLowerCase();
  if (EXCLUDED_FILES.has(lower)) return true;
  if (lower.startsWith('.env') || lower.endsWith('.env')) return true;
  if (lower.endsWith('.md') || lower.endsWith('.mdx')) return true;
  if (/^(client_secret|credentials|service.account|service_account)/i.test(name)) return true;
  if (/\.(pem|key|p12|pfx|crt|cer|der|keystore|jks)$/i.test(name)) return true;
  if (/^(npm-debug|yarn-debug|yarn-error|debug)\..*log/i.test(name)) return true;
  return false;
}

function isRelevantText(name) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.md') || lower.endsWith('.mdx')) return false;
  return TEXT_EXTENSIONS.has(path.extname(lower)) || CONFIG_FILES.has(lower);
}

function redactCommonSecrets(content) {
  return content
    .replace(/\b(?:mongodb(?:\+srv)?):\/\/[^\s'"`<>]+/gi, 'mongodb://[URL_OCULTA]')
    .replace(/\b(?:sk-[A-Za-z0-9_-]{16,}|ghp_[A-Za-z0-9_]{16,}|github_pat_[A-Za-z0-9_]{16,}|AKIA[0-9A-Z]{16})\b/g, '[CREDENCIAL_OCULTA]')
    .replace(/((?:["']?)(?:api[_-]?key|client[_-]?secret|private[_-]?key|jwt[_-]?secret|password|passwd|access[_-]?token|refresh[_-]?token)(?:["']?)\s*[:=]\s*)(["'`])([^\r\n]*?)\2/gi, '$1$2[VALOR_OCULTTO]$2');
}

function classifyFile(relativePath) {
  if (relativePath.startsWith('frontend/')) {
    return frontendFiles;
  }
  return backendFiles;
}

function visit(directory) {
  let entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch (err) {
    warnings.push('No se pudo leer ' + path.relative(ROOT, directory) + ': ' + err.code);
    return;
  }

  entries.sort((a, b) => {
    if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
    return a.name.localeCompare(b.name, 'es');
  });

  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    const fullPath = path.join(directory, entry.name);
    const relativePath = path.relative(ROOT, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name.toLowerCase())) {
        visit(fullPath);
      }
      continue;
    }

    if (entry.isFile() && !isSecretOrExcluded(entry.name) && isRelevantText(entry.name)) {
      classifyFile(relativePath).push({ fullPath, relativePath });
    }
  }
}

visit(ROOT);

function buildContextContent(scopeLabel, filesList) {
  const header = [
    `ARCHIVOS DEL PROYECTO (${scopeLabel}): ` + path.basename(ROOT),
    'Generado: ' + new Date().toISOString(),
    'Nota: node_modules, .env*, .md, compilados, medios y secretos omitidos.',
    'IMPORTANTE: revisar manualmente antes de enviar; la ocultación no es infalible.',
    '',
  ];

  const sections = [header.join('\n')];
  let writtenFiles = 0;

  for (const file of filesList) {
    try {
      const raw = fs.readFileSync(file.fullPath, 'utf8');
      if (raw.includes('\u0000')) continue;
      const safeText = redactCommonSecrets(raw);
      sections.push(`\n---------- Archivo: ${file.relativePath} ----------\n${safeText}\n`);
      writtenFiles++;
    } catch (err) {
      warnings.push(file.relativePath + ': no pudo leerse (' + err.code + ').');
    }
  }

  return {
    content: sections.join('') + '\n',
    writtenFiles,
  };
}

for (const folder of ['backend/src/middleware', 'frontend/src']) {
  const candidate = path.join(ROOT, folder, '.env');
  if (fs.existsSync(candidate)) {
    warnings.push('Revisar ubicación de ' + folder + '/.env; normalmente va en la raíz de su aplicación.');
  }
}

const backendResult = buildContextContent('RAÍZ + BACKEND', backendFiles);
const frontendResult = buildContextContent('FRONTEND', frontendFiles);

fs.writeFileSync(path.join(ROOT, BACKEND_CONTEXT_FILE), backendResult.content, 'utf8');
fs.writeFileSync(path.join(ROOT, FRONTEND_CONTEXT_FILE), frontendResult.content, 'utf8');

console.log('\n✅ Archivos mapeados correctamente (sin estructura ni límites de tamaño).');
console.log(`📄 Backend:  ${BACKEND_CONTEXT_FILE} (${backendResult.writtenFiles} archivos)`);
console.log(`📄 Frontend: ${FRONTEND_CONTEXT_FILE} (${frontendResult.writtenFiles} archivos)`);
if (warnings.length) {
  console.log('\n⚠️ Advertencias:');
  warnings.forEach(item => console.log(' - ' + item));
}
console.log('\n🔐 Revisa los archivos generados antes de compartirlos.');