# HE - Online

Sistema web para gerenciamento de historicos escolares, inspirado no fluxo de gestao escolar do SIMADE/MG, usando Google Apps Script, Google Sheets, Google Drive e frontend HTML/CSS/Bootstrap/JavaScript.

## Recursos

- Dashboard com totais e ultimos registros.
- CRUD completo de alunos.
- Ficha do aluno com dados pessoais, historicos e certificados.
- Cadastro de historicos por aluno, etapa, serie, situacao, faltas e carga horaria.
- Lancamento de disciplinas, notas e carga horaria.
- Emissao, listagem, reimpressao e exclusao de certificados.
- Configuracoes institucionais usadas nas impressoes.
- Criacao automatica das abas `ALUNOS`, `HISTORICOS`, `NOTAS`, `CERTIFICADOS` e `CONFIG`.
- Modulo de impressao com visualizacao em nova janela e botao de imprimir/exportar PDF pelo navegador.
- Separacao entre banco, services, web app e frontend.

## Estrutura

```text
apps-script/
  Config.gs
  Database.gs
  Setup.gs
  Menu.gs
  WebApp.gs
  AlunoService.gs
  HistoricoService.gs
  NotaService.gs
  CertificadoService.gs
  PdfService.gs
  ConfigService.gs

frontend/
  index.html
  dashboard.html
  alunos.html
  alunoDetalhe.html
  historico.html
  certificados.html
  configuracoes.html
  studentForm.html
  historyForm.html
  certificateForm.html
  css.html
  js.html
```

## Banco de Dados

O banco usa Google Sheets. Ao abrir o sistema ou executar `setup()`, as abas sao criadas automaticamente com os cabecalhos exigidos:

- `ALUNOS`
- `HISTORICOS`
- `NOTAS`
- `CERTIFICADOS`
- `CONFIG`

O nome sugerido para a planilha e `Modulo: Historico Escolar Online`.

## Instalar pelo GitHub

1. Crie um repositorio no GitHub e envie estes arquivos.
2. Instale o Node.js LTS.
3. No terminal, dentro do projeto, execute:

```bash
npm install
npm run login
```

4. Crie o projeto Apps Script:

```bash
npm run create
```

Se voce ja tiver um projeto Apps Script existente, execute `clasp clone SCRIPT_ID` em outra pasta e copie o `scriptId` gerado para este projeto.

5. Envie os arquivos para o Apps Script:

```bash
npm run push
```

6. Abra o editor do Apps Script:

```bash
npm run open
```

7. No editor, execute a funcao `setup` uma vez e autorize as permissoes.
8. Implante como Web App em `Implantar > Nova implantacao > Aplicativo da Web`.

Configuracao recomendada:

- Executar como: usuario que esta implantando.
- Quem tem acesso: conforme sua necessidade institucional.

## Uso na Planilha

Depois de vincular o script a uma planilha, recarregue a planilha. O menu `HE - Online` exibira:

- Abrir sistema
- Inicializar banco
- Sobre

## Publicacao

Para criar uma implantacao pelo terminal:

```bash
npm run deploy
```

Para atualizar o codigo apos alteracoes:

```bash
npm run push
```

## Observacoes Tecnicas

- O arquivo `.claspignore` publica somente `apps-script/`, `frontend/` e `appsscript.json`.
- A pasta `src/` antiga, se existir no repositorio, nao participa do deploy.
- Os dados sao persistidos na planilha definida nas propriedades do script.
- A impressao abre HTML em nova janela; use o dialogo do navegador para imprimir ou salvar como PDF.
