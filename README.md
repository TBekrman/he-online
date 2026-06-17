# HE - Online

Sistema web para gerenciamento de historicos escolares, agora preparado para Firebase Hosting, Firebase Authentication e Cloud Firestore.

## Recursos

- Dashboard com total de alunos, historicos e certificados.
- CRUD completo de alunos.
- Ficha do aluno com dados pessoais, historicos e certificados.
- Cadastro de historicos por aluno, etapa, serie, escola, situacao, faltas e carga horaria.
- Lancamento de disciplinas, notas e carga horaria.
- Emissao, listagem, reimpressao e exclusao de certificados.
- Configuracoes institucionais usadas nas impressoes.
- Impressao de historico e certificado com opcao de salvar como PDF pelo navegador.
- Login com Firebase Authentication por email/senha e conta Google.
- Gerenciamento online de usuarios por administradores.
- Acesso restrito a e-mails previamente autorizados pelo administrador.
- Datas exibidas e cadastradas no formato `dd/mm/aaaa`.
- Carga horaria registrada em horas.
- Banco de dados no Cloud Firestore.

## Estrutura Firebase

```text
public/
  index.html
  styles.css
  app.js

firebase.json
firestore.rules
firestore.indexes.json
```

As pastas `apps-script/` e `frontend/` continuam no repositorio como versao anterior para Google Apps Script, mas a versao Firebase usa a pasta `public/`.

## Banco no Firestore

Colecoes usadas:

```text
alunos
historicos
notas
certificados
config/escola
```

As regras em `firestore.rules` permitem acesso apenas para usuarios autenticados.

## Configurar Firebase

1. Acesse o Firebase Console:

```text
https://console.firebase.google.com
```

2. Crie um projeto.
3. Ative **Authentication > Sign-in method > Email/password**.
4. Ative tambem **Authentication > Sign-in method > Google**.
5. Ative **Firestore Database** em modo de producao.
6. Crie um app Web em **Configuracoes do projeto > Seus apps**.
7. Copie a configuracao do SDK Web. Ela tem este formato:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

Para producao, edite `public/firebase-config.js` e substitua `null` pelo objeto `firebaseConfig`. Tambem e possivel abrir o sistema e colar essa configuracao na tela inicial; nesse caso ela fica salva no navegador.

## Rodar Localmente

Instale as dependencias:

```bash
npm install
```

Faça login:

```bash
npm run firebase:login
```

Rode os emuladores:

```bash
npm run firebase:serve
```

## Publicar no Firebase Hosting

Se ainda nao tiver vinculado a pasta ao projeto Firebase:

```bash
firebase use --add
```

Depois publique:

```bash
npm run firebase:deploy
```

O Firebase mostrara a URL publica do site ao final do deploy.

## Usuarios e Administradores

O primeiro usuario que entrar no sistema sera registrado como `admin`. Depois disso, acesse o menu **Usuarios** para autorizar, bloquear ou promover outros usuarios.

Para liberar acesso, o administrador deve cadastrar o e-mail do usuario, escolher o perfil `Administrador` ou `Usuario` e manter o status como `Ativo`. E-mails nao cadastrados ou bloqueados nao acessam o sistema.

Usuarios podem entrar com e-mail Google. Para usar Google, o provedor precisa estar ativado no Firebase Authentication.

## Historico Consolidado

Cada estudante fica cadastrado uma unica vez. As etapas/series sao lancadas como historicos vinculados ao mesmo aluno. A impressao do historico junta todas as etapas em um unico documento, com dados da escola, identificacao do aluno, estudos realizados e matriz de notas/carga horaria.

## Fluxo com GitHub

Depois de alterar o projeto:

```bash
git add .
git commit -m "Migra sistema para Firebase"
git push
npm run firebase:deploy
```

## Observacao Sobre PDF

A versao Firebase gera a visualizacao de impressao em HTML. Para exportar PDF, use o botao **Imprimir / salvar PDF** e selecione **Salvar como PDF** no navegador.
