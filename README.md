# Planilhas para Cardápio

O projeto oferece duas páginas independentes no mesmo servidor:

- `/` — envio de planilha Excel ou CSV, protegido por senha de publicação.
- `/menu.html` — tela limpa para a TV, sem controles; escolhe o dia atual e busca atualizações do servidor a cada 30 segundos.

O servidor publica os dados do cardápio na rede local e os salva em `data/menu.json`. A planilha original é processada no navegador e não é salva no servidor.

## Executar em desenvolvimento

Requisitos: Node.js e npm instalados.

Instale as dependências:

```bash
npm install
```

Inicie a API em um terminal, definindo uma senha forte:

```powershell
$env:MENU_UPLOAD_TOKEN = "defina-uma-senha-forte"
npm run api
```

Em outro terminal, inicie o site:

```bash
npm run dev
```

Abra o endereço mostrado pelo Vite. Use a senha configurada no servidor no campo “Senha de publicação”. A página da TV fica no mesmo endereço com `/menu.html`.

## Executar na rede do restaurante

Gere os arquivos e inicie o servidor:

```powershell
npm run build
$env:MENU_UPLOAD_TOKEN = "Sapore2026"
npm start
```

O servidor mostra o endereço local e os endereços de rede disponíveis. Acesse `/` no computador de administração e `/menu.html` na TV. Os dois dispositivos precisam alcançar o servidor pela rede. Para acesso pela internet, publique o servidor atrás de HTTPS e configure uma senha forte.

## Formato da planilha

O arquivo deve ter uma linha de cabeçalho com `Categoria` e os dias da semana. Também aceita uma coluna `Restaurantes` (ou `Restaurante`) antes da categoria. Células mescladas verticalmente nessa coluna podem deixar em branco as linhas seguintes; o nome do restaurante é mantido até encontrar o próximo. O formato antigo, começando com `Categoria` e seguido pelos dias, também é aceito.

Exemplo de colunas: `Restaurantes | Categoria | Segunda-feira | Terça-feira | ...`.

## Build

```bash
npm run build
```
