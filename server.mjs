import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import { dirname, extname, resolve, sep } from 'node:path';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const rootDirectory = dirname(fileURLToPath(import.meta.url));
const dataDirectory = resolve(rootDirectory, 'data');
const menuFile = resolve(dataDirectory, 'menu.json');
const distDirectory = resolve(rootDirectory, 'dist');
const apiOnly = process.argv.includes('--api-only');
const port = Number(process.env.PORT || (apiOnly ? 3001 : 3000));
const uploadToken = process.env.MENU_UPLOAD_TOKEN;
const maxBodyBytes = 2 * 1024 * 1024;
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

if (!uploadToken) {
  console.error('Configure a variável MENU_UPLOAD_TOKEN antes de iniciar o servidor.');
  process.exit(1);
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, 'http://localhost');
    if (requestUrl.pathname === '/api/menu') {
      await handleMenuApi(request, response);
      return;
    }

    if (apiOnly) {
      sendJson(response, 404, { error: 'Endpoint não encontrado.' });
      return;
    }

    await serveStaticFile(request, response, requestUrl.pathname);
  } catch (error) {
    console.error('Erro ao processar a requisição.', error);
    if (!response.headersSent) {
      sendJson(response, 500, { error: 'Erro interno ao processar a requisição.' });
    } else {
      response.destroy();
    }
  }
});

server.listen(port, apiOnly ? '127.0.0.1' : '0.0.0.0', () => {
  console.log(`Servidor ativo em http://localhost:${port}`);
  if (!apiOnly) {
    for (const address of getNetworkAddresses()) {
      console.log(`Acesso na rede: http://${address}:${port}`);
    }
  }
});

async function handleMenuApi(request, response) {
  if (request.method === 'GET') {
    try {
      const menu = await readFile(menuFile, 'utf8');
      sendJson(response, 200, JSON.parse(menu), { 'Cache-Control': 'no-store' });
    } catch (error) {
      if (error.code === 'ENOENT') {
        sendJson(response, 404, { error: 'Ainda não há cardápio publicado.' });
        return;
      }
      throw error;
    }
    return;
  }

  if (request.method !== 'PUT') {
    response.setHeader('Allow', 'GET, PUT');
    sendJson(response, 405, { error: 'Método não permitido.' });
    return;
  }

  if (!isAuthorized(request.headers.authorization)) {
    sendJson(response, 401, { error: 'Senha de publicação inválida.' });
    return;
  }

  let menu;
  try {
    menu = JSON.parse(await readRequestBody(request));
  } catch (error) {
    sendJson(response, error.statusCode || 400, {
      error: error.statusCode === 413
        ? 'O cardápio excede o tamanho permitido.'
        : 'O corpo da requisição não contém JSON válido.',
    });
    return;
  }

  const validationError = validateMenu(menu);
  if (validationError) {
    sendJson(response, 400, { error: validationError });
    return;
  }

  await mkdir(dataDirectory, { recursive: true });
  const temporaryFile = resolve(dataDirectory, `.menu-${randomUUID()}.tmp`);
  try {
    await writeFile(temporaryFile, JSON.stringify(menu), { encoding: 'utf8', flag: 'wx' });
    await rename(temporaryFile, menuFile);
  } catch (error) {
    try {
      await unlink(temporaryFile);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') {
        console.error('Não foi possível remover o arquivo temporário do cardápio.', cleanupError);
      }
    }
    throw error;
  }

  sendJson(response, 200, { message: 'Cardápio publicado.' });
}

function isAuthorized(authorization) {
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
    return false;
  }
  const candidate = Buffer.from(authorization.slice(7));
  const expected = Buffer.from(uploadToken);
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

async function readRequestBody(request) {
  const chunks = [];
  let bodySize = 0;
  for await (const chunk of request) {
    bodySize += chunk.length;
    if (bodySize > maxBodyBytes) {
      const error = new Error('Request body too large.');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function validateMenu(menu) {
  if (!menu || !Array.isArray(menu.days) || !Array.isArray(menu.categories)) {
    return 'O formato do cardápio está incompleto.';
  }
  if (menu.days.length === 0 || menu.days.length > 14
    || menu.days.some((day) => typeof day !== 'string' || !day.trim())) {
    return 'A lista de dias do cardápio é inválida.';
  }
  if (menu.categories.length === 0 || menu.categories.length > 500) {
    return 'A lista de categorias do cardápio é inválida.';
  }
  for (const category of menu.categories) {
    if (!category || typeof category.name !== 'string'
      || typeof category.restaurant !== 'string'
      || !Array.isArray(category.items)
      || category.items.length !== menu.days.length
      || category.items.some((item) => typeof item !== 'string')) {
      return 'Uma das categorias possui dados inválidos.';
    }
  }
  return '';
}

async function serveStaticFile(request, response, pathname) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD');
    sendJson(response, 405, { error: 'Método não permitido.' });
    return;
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    sendJson(response, 400, { error: 'Caminho inválido.' });
    return;
  }

  const relativePath = decodedPath === '/' ? '/index.html' : decodedPath;
  const filePath = resolve(distDirectory, `.${relativePath}`);
  if (!filePath.startsWith(`${distDirectory}${sep}`)) {
    sendJson(response, 403, { error: 'Acesso negado.' });
    return;
  }

  let fileInfo;
  try {
    fileInfo = await stat(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      sendJson(response, 404, { error: 'Página não encontrada.' });
      return;
    }
    throw error;
  }
  if (!fileInfo.isFile()) {
    sendJson(response, 404, { error: 'Página não encontrada.' });
    return;
  }

  response.writeHead(200, {
    'Content-Length': fileInfo.size,
    'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream',
    'Cache-Control': extname(filePath) === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  });
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  createReadStream(filePath).pipe(response);
}

function sendJson(response, statusCode, data, headers = {}) {
  const body = JSON.stringify(data);
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  response.end(body);
}

function getNetworkAddresses() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((address) => address && address.family === 'IPv4' && !address.internal)
    .map(({ address }) => address);
}
