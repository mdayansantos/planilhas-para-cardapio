# Planilhas para Cardápio

Projeto de estudo com o objetivo de criar, passo a passo, um site capaz de transformar planilhas em cardápios para restaurantes.

## Tecnologias

- [SheetJS](https://sheetjs.com/) (`xlsx`) para trabalhar com planilhas.

## Executar localmente

Requisitos: Node.js e npm instalados.

```bash
npm install
npm run dev
```

Abra no navegador o endereço mostrado pelo Vite. A página inicial é usada para enviar o arquivo; após o carregamento, o cardápio é aberto em uma página separada. Os dados ficam na sessão atual do navegador. A página do cardápio também pode ser aberta diretamente em `/menu.html` depois do envio do arquivo.

O arquivo Excel ou CSV deve ter uma linha de cabeçalho com `Categoria` e os dias da semana. Também aceita uma coluna `Restaurantes` (ou `Restaurante`) antes da categoria. As células mescladas verticalmente nessa coluna podem deixar em branco as linhas seguintes do mesmo restaurante; o site mantém o nome até encontrar o próximo restaurante. O formato antigo, começando com `Categoria` e seguido pelos dias, continua aceito.

Exemplo de colunas: `Restaurantes | Categoria | Segunda-feira | Terça-feira | ...`. Escolha um dia no seletor para ver as categorias nas linhas e os restaurantes como cabeçalhos no topo da tabela.

Para verificar a versão de produção:

```bash
npm run build
```

O arquivo de planilha usado nos testes fica no computador e não precisa ser enviado ao GitHub.
