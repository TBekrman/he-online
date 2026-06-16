import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, writeBatch } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const STORAGE_KEY = 'heOnlineFirebaseConfig';
const FUND_SERIES = ['Fase Introdutoria','Fase I','Fase II','Fase III','Fase IV','6o Ano','7o Ano','8o Ano','9o Ano'];
const MEDIO_SERIES = ['1o Ano','2o Ano','3o Ano'];
const FUND_DISCIPLINAS = ['Lingua Portuguesa','Matematica','Ciencias','Geografia','Historia','Ensino Religioso','Educacao Fisica','Arte','Ingles'];
const MEDIO_DISCIPLINAS = ['Lingua Portuguesa','Arte','Educacao Fisica','Matematica','Fisica','Biologia','Quimica','Historia','Geografia','Sociologia','Filosofia'];
const SITUACOES = ['Aprovado','Reprovado','Cursando','Transferido','Concluido'];

const state = { app:null, auth:null, db:null, user:null, currentUserProfile:null, alunos:[], historicos:[], notas:[], certificados:[], usuarios:[], config:{}, selectedAlunoId:null };
const modal = {};

document.addEventListener('DOMContentLoaded', start);

function start(){
  modal.aluno = new bootstrap.Modal(document.getElementById('alunoModal'));
  modal.historico = new bootstrap.Modal(document.getElementById('historicoModal'));
  modal.certificado = new bootstrap.Modal(document.getElementById('certificadoModal'));
  bindSetup();
  bindUi();
  const config = window.HE_ONLINE_FIREBASE_CONFIG || readConfig();
  if (!config) return showOnly('setupScreen');
  bootFirebase(config);
}

function bindSetup(){
  document.getElementById('firebaseConfigForm').addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const config = parseConfig(document.getElementById('firebaseConfigText').value);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      bootFirebase(config);
    } catch (error) {
      alert(error.message);
    }
  });
  document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = formData(event.currentTarget);
    await signInWithEmailAndPassword(state.auth, data.email, data.password).catch(showError);
  });
  document.getElementById('googleLogin').addEventListener('click', async () => {
    await signInWithPopup(state.auth, new GoogleAuthProvider()).catch(showError);
  });
}

function bindUi(){
  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
  document.querySelectorAll('[data-view-target]').forEach((button) => button.addEventListener('click', () => showView(button.dataset.viewTarget)));
  document.getElementById('logout').addEventListener('click', () => signOut(state.auth));
  document.getElementById('searchAluno').addEventListener('input', renderAlunos);
  document.getElementById('addNota').addEventListener('click', () => addNotaRow({}));
  document.querySelector('#historicoForm [name="tipo"]').addEventListener('change', () => updateSeriesAndNotas());
  document.getElementById('editDetail').addEventListener('click', () => openAluno(state.alunos.find((aluno) => aluno.id === state.selectedAlunoId)));
  document.getElementById('newHistoryDetail').addEventListener('click', () => openHistorico({ alunoId: state.selectedAlunoId }));
  document.getElementById('newCertificateDetail').addEventListener('click', () => openCertificado({ alunoId: state.selectedAlunoId }));
  document.getElementById('printHistoryDetail').addEventListener('click', () => printHistorico(state.selectedAlunoId));

  document.body.addEventListener('click', async (event) => {
    const el = event.target.closest('[data-action]');
    if (!el) return;
    const id = el.dataset.id;
    if (el.dataset.action === 'newAluno') openAluno();
    if (el.dataset.action === 'editAluno') openAluno(state.alunos.find((item) => item.id === id));
    if (el.dataset.action === 'deleteAluno') deleteAluno(id);
    if (el.dataset.action === 'detailAluno') openDetalhe(id);
    if (el.dataset.action === 'newHistorico') openHistorico();
    if (el.dataset.action === 'editHistorico') openHistorico(await getHistoricoWithNotas(id));
    if (el.dataset.action === 'deleteHistorico') deleteHistorico(id);
    if (el.dataset.action === 'newCertificado') openCertificado();
    if (el.dataset.action === 'printCertificado') printCertificado(id);
    if (el.dataset.action === 'deleteCertificado') deleteCertificado(id);
    if (el.dataset.action === 'printHistorico') printHistorico(id);
    if (el.dataset.action === 'editUsuario') openUsuario(state.usuarios.find((item) => item.id === id));
    if (el.dataset.action === 'deleteUsuario') deleteUsuario(id);
  });

  document.getElementById('alunoForm').addEventListener('submit', saveAluno);
  document.getElementById('historicoForm').addEventListener('submit', saveHistorico);
  document.getElementById('certificadoForm').addEventListener('submit', saveCertificado);
  document.getElementById('configForm').addEventListener('submit', saveConfig);
  document.getElementById('usuarioForm').addEventListener('submit', saveUsuario);
}

function readConfig(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function parseConfig(text){
  const source = text.trim();
  const match = source.match(/firebaseConfig\s*=\s*({[\s\S]*?});?/);
  const cleaned = match ? match[1] : source.replace(/^const\s+firebaseConfig\s*=\s*/, '').replace(/;$/, '');
  const config = Function('"use strict"; return (' + cleaned + ');')();
  ['apiKey','authDomain','projectId','appId'].forEach((key) => {
    if (!config[key]) throw new Error('Configuracao Firebase incompleta: falta ' + key);
  });
  return config;
}

function bootFirebase(config){
  try {
    state.app = initializeApp(config);
    state.auth = getAuth(state.app);
    state.db = getFirestore(state.app);
    onAuthStateChanged(state.auth, async (user) => {
      if (!user) return showOnly('authScreen');
      state.user = user;
      document.getElementById('userEmail').textContent = user.email || 'Usuario';
      showOnly('app');
      const allowed = await ensureCurrentUserProfile(user);
      if (!allowed) return;
      await refreshAll();
    });
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    alert('Nao foi possivel iniciar Firebase: ' + error.message);
    showOnly('setupScreen');
  }
}

function showOnly(id){
  ['setupScreen','authScreen','app'].forEach((item) => document.getElementById(item).classList.toggle('d-none', item !== id));
}

async function refreshAll(){
  await ensureConfig();
  await loadCurrentUserProfile();
  const [alunos, historicos, notas, certificados, usuarios] = await Promise.all([
    getOrdered('alunos'), getOrdered('historicos'), getOrdered('notas'), getOrdered('certificados'), getOrdered('usuarios')
  ]);
  state.alunos = alunos;
  state.historicos = historicos.map((h) => ({ ...h, alunoNome: alunoNome(h.alunoId) }));
  state.notas = notas;
  state.certificados = certificados.map((c) => ({ ...c, alunoNome: alunoNome(c.alunoId) }));
  state.usuarios = usuarios;
  state.currentUserProfile = state.usuarios.find((u) => u.id === state.user.uid) || state.currentUserProfile;
  renderAll();
}

async function loadCurrentUserProfile(){
  if (!state.user) return;
  const snap = await getDoc(doc(state.db, 'usuarios', state.user.uid));
  if (snap.exists()) {
    state.currentUserProfile = { id: snap.id, ...snap.data() };
  }
}

async function ensureCurrentUserProfile(user){
  const users = snapToArray(await getDocs(collection(state.db, 'usuarios')));
  const existing = users.find((item) => item.id === user.uid || String(item.email || '').toLowerCase() === String(user.email || '').toLowerCase());
  const firstUser = users.length === 0;
  if (existing && existing.status === 'blocked') {
    await signOut(state.auth);
    toast('Usuario bloqueado pelo administrador.');
    return false;
  }
  const profile = {
    email: user.email || '',
    nome: user.displayName || user.email || 'Usuario',
    role: firstUser ? 'admin' : (existing && existing.role) || 'user',
    status: (existing && existing.status) || 'active',
    uid: user.uid,
    updatedAt: serverTimestamp()
  };
  await setDoc(doc(state.db, 'usuarios', user.uid), profile, { merge:true });
  if (existing && existing.id !== user.uid && profile.role === 'admin') await deleteDoc(doc(state.db, 'usuarios', existing.id));
  state.currentUserProfile = { id:user.uid, ...profile };
  return true;
}

async function getOrdered(name){
  try {
    return snapToArray(await getDocs(query(collection(state.db, name), orderBy('createdAt', 'asc'))));
  } catch {
    return snapToArray(await getDocs(collection(state.db, name)));
  }
}

async function ensureConfig(){
  const ref = doc(state.db, 'config', 'escola');
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    state.config = { nomeEscola:'Escola', municipio:'', uf:'MG', diretor:'', secretario:'' };
    await setDoc(ref, state.config);
  } else {
    state.config = snap.data();
  }
  fillForm(document.getElementById('configForm'), state.config);
}

function snapToArray(snapshot){
  return snapshot.docs.map((item) => ({ id:item.id, ...item.data() }));
}

function renderAll(){
  renderDashboard();
  renderAlunos();
  renderHistoricos();
  renderCertificados();
  renderUsuarios();
  renderAdminState();
  refreshAlunoSelects();
}

function renderDashboard(){
  document.getElementById('totalAlunos').textContent = state.alunos.length;
  document.getElementById('totalHistoricos').textContent = state.historicos.length;
  document.getElementById('totalCertificados').textContent = state.certificados.length;
  document.getElementById('recentAlunos').innerHTML = rowsOrEmpty(state.alunos.slice(-5).reverse().map((a) => `<tr><td>${esc(a.nome)}</td><td>${esc(a.cpf)}</td><td class="text-end"><button class="btn btn-sm btn-light" data-action="detailAluno" data-id="${esc(a.id)}"><i class="bi bi-eye"></i></button></td></tr>`));
  document.getElementById('recentHistoricos').innerHTML = rowsOrEmpty(state.historicos.slice(-5).reverse().map((h) => `<tr><td>${esc(h.alunoNome)}</td><td>${esc(h.serie)}</td><td>${esc(h.anoLetivo)}</td><td>${esc(h.situacao)}</td></tr>`));
}

function renderAlunos(){
  const term = (document.getElementById('searchAluno').value || '').toLowerCase();
  const list = state.alunos.filter((a) => [a.nome,a.cpf,a.rg,a.mae].join(' ').toLowerCase().includes(term));
  document.getElementById('alunosTable').innerHTML = rowsOrEmpty(list.map((a) => `<tr><td><strong>${esc(a.nome)}</strong></td><td>${esc(a.dataNascimento)}</td><td>${esc(a.mae)}</td><td>${esc(a.cpf)}</td><td>${esc(a.telefone)}</td><td class="actions"><button class="btn btn-sm btn-light" data-action="detailAluno" data-id="${esc(a.id)}"><i class="bi bi-eye"></i></button><button class="btn btn-sm btn-outline-primary" data-action="editAluno" data-id="${esc(a.id)}"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-outline-danger" data-action="deleteAluno" data-id="${esc(a.id)}"><i class="bi bi-trash"></i></button></td></tr>`));
}

function renderHistoricos(){
  const grouped = state.alunos
    .map((aluno) => ({ aluno, historicos: sortHistoricos(state.historicos.filter((h) => h.alunoId === aluno.id)) }))
    .filter((item) => item.historicos.length);
  document.getElementById('historicosTable').innerHTML = rowsOrEmpty(grouped.map((item) => {
    const ultimo = item.historicos[item.historicos.length - 1];
    const etapas = item.historicos.map((h) => `${h.serie} (${h.anoLetivo})`).join(', ');
    return `<tr><td><strong>${esc(item.aluno.nome)}</strong></td><td>${esc(etapas)}</td><td>${esc(ultimo.anoLetivo)}</td><td>${esc(ultimo.situacao)}</td><td class="actions"><button class="btn btn-sm btn-light" data-action="detailAluno" data-id="${esc(item.aluno.id)}"><i class="bi bi-eye"></i></button><button class="btn btn-sm btn-outline-dark" data-action="printHistorico" data-id="${esc(item.aluno.id)}"><i class="bi bi-printer"></i></button></td></tr>`;
  }));
}

function renderCertificados(){
  document.getElementById('certificadosTable').innerHTML = rowsOrEmpty(state.certificados.map((c) => `<tr><td>${esc(c.alunoNome)}</td><td>${esc(c.etapa)}</td><td>${esc(c.dataConclusao)}</td><td>${esc(dateBr(c.dataEmissao))}</td><td class="actions"><button class="btn btn-sm btn-outline-dark" data-action="printCertificado" data-id="${esc(c.id)}"><i class="bi bi-printer"></i></button><button class="btn btn-sm btn-outline-danger" data-action="deleteCertificado" data-id="${esc(c.id)}"><i class="bi bi-trash"></i></button></td></tr>`));
}

function renderUsuarios(){
  const table = document.getElementById('usuariosTable');
  if (!table) return;
  table.innerHTML = rowsOrEmpty(state.usuarios.map((u) => `<tr><td>${esc(u.email)}</td><td>${esc(u.nome)}</td><td>${esc(u.role)}</td><td>${esc(u.status)}</td><td class="actions"><button class="btn btn-sm btn-outline-primary" data-action="editUsuario" data-id="${esc(u.id)}"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-outline-danger" data-action="deleteUsuario" data-id="${esc(u.id)}"><i class="bi bi-trash"></i></button></td></tr>`));
}

function renderAdminState(){
  const canAdmin = isAdmin();
  document.querySelectorAll('.admin-only').forEach((el) => {
    el.classList.toggle('d-none', !canAdmin);
    el.hidden = !canAdmin;
  });
}

function rowsOrEmpty(rows){
  return rows.length ? rows.join('') : '<tr><td colspan="9" class="empty">Nenhum registro encontrado</td></tr>';
}

function showView(view){
  if (view === 'usuarios' && !isAdmin()) {
    toast('Apenas administradores podem acessar usuarios.');
    return;
  }
  document.querySelectorAll('.view').forEach((el) => el.classList.remove('active'));
  document.querySelectorAll('[data-view]').forEach((el) => el.classList.toggle('active', el.dataset.view === view));
  document.getElementById(`view-${view}`).classList.add('active');
  const titles = { dashboard:['Dashboard','Visao geral do historico escolar'], alunos:['Alunos','Cadastro, consulta e manutencao'], detalhe:['Ficha do aluno','Dados pessoais, historicos e certificados'], historicos:['Historicos','Historico consolidado por estudante'], certificados:['Certificados','Emissao e reimpressao'], usuarios:['Usuarios','Gerenciamento de acesso online'], config:['Configuracoes','Dados institucionais'] };
  document.getElementById('pageTitle').textContent = titles[view][0];
  document.getElementById('pageSubtitle').textContent = titles[view][1];
}

function openAluno(data = {}){
  fillForm(document.getElementById('alunoForm'), data);
  modal.aluno.show();
}

async function saveAluno(event){
  event.preventDefault();
  const data = normalizeAluno(formData(event.currentTarget));
  if (data.id) {
    await updateDoc(doc(state.db, 'alunos', data.id), omitId(data));
  } else {
    await addDoc(collection(state.db, 'alunos'), { ...omitId(data), createdAt:serverTimestamp() });
  }
  modal.aluno.hide();
  await refreshAll();
  toast('Aluno salvo com sucesso.');
}

function normalizeAluno(data){
  data.nome = String(data.nome || '').trim().toUpperCase();
  return data;
}

async function deleteAluno(id){
  if (!confirm('Excluir aluno e seus historicos/certificados?')) return;
  const batch = writeBatch(state.db);
  state.historicos.filter((h) => h.alunoId === id).forEach((h) => {
    state.notas.filter((n) => n.historicoId === h.id).forEach((n) => batch.delete(doc(state.db, 'notas', n.id)));
    batch.delete(doc(state.db, 'historicos', h.id));
  });
  state.certificados.filter((c) => c.alunoId === id).forEach((c) => batch.delete(doc(state.db, 'certificados', c.id)));
  batch.delete(doc(state.db, 'alunos', id));
  await batch.commit();
  await refreshAll();
  showView('alunos');
  toast('Aluno excluido.');
}

async function openDetalhe(id){
  state.selectedAlunoId = id;
  const aluno = state.alunos.find((a) => a.id === id);
  const historicos = state.historicos.filter((h) => h.alunoId === id);
  const certificados = state.certificados.filter((c) => c.alunoId === id);
  document.getElementById('detailName').textContent = aluno.nome;
  document.getElementById('detailMeta').textContent = `${aluno.dataNascimento || ''} | ${aluno.naturalidade || ''}/${aluno.uf || ''}`;
  document.getElementById('detailInfo').innerHTML = ['mae','pai','rg','cpf','endereco','telefone','email','observacoes'].map((key) => `<div class="info-item"><span>${label(key)}</span><strong>${esc(aluno[key])}</strong></div>`).join('');
  document.getElementById('detailHistoricos').innerHTML = rowsOrEmpty(historicos.map((h) => `<tr><td>${esc(h.tipo)}</td><td>${esc(h.serie)}</td><td>${esc(h.anoLetivo)}</td><td>${esc(h.situacao)}</td><td class="actions"><button class="btn btn-sm btn-outline-primary" data-action="editHistorico" data-id="${esc(h.id)}"><i class="bi bi-pencil"></i></button></td></tr>`));
  document.getElementById('detailCertificados').innerHTML = rowsOrEmpty(certificados.map((c) => `<tr><td>${esc(c.etapa)}</td><td>${esc(c.dataConclusao)}</td><td>${esc(dateBr(c.dataEmissao))}</td><td class="actions"><button class="btn btn-sm btn-outline-dark" data-action="printCertificado" data-id="${esc(c.id)}"><i class="bi bi-printer"></i></button></td></tr>`));
  showView('detalhe');
}

async function openHistorico(data = {}){
  refreshAlunoSelects();
  fillSelect(document.querySelector('#historicoForm [name="situacao"]'), SITUACOES, data.situacao);
  fillForm(document.getElementById('historicoForm'), data);
  updateSeriesAndNotas(data.notas || [], data.serie);
  modal.historico.show();
}

async function getHistoricoWithNotas(id){
  const historico = state.historicos.find((item) => item.id === id);
  return { ...historico, notas: state.notas.filter((nota) => nota.historicoId === id) };
}

async function saveHistorico(event){
  event.preventDefault();
  const data = formData(event.currentTarget);
  const notas = [...document.querySelectorAll('#notasBody tr')].map((row) => ({
    disciplina: row.querySelector('[name="disciplina"]').value,
    nota: row.querySelector('[name="nota"]').value,
    cargaHoraria: Number(row.querySelector('[name="cargaHoraria"]').value || 0)
  })).filter((nota) => nota.disciplina);
  const payload = { ...omitId(data), diasLetivos:Number(data.diasLetivos || 0), chAnual:Number(data.chAnual || 0), faltas:Number(data.faltas || 0) };
  let historicoId = data.id;
  if (historicoId) {
    await updateDoc(doc(state.db, 'historicos', historicoId), payload);
  } else {
    const ref = await addDoc(collection(state.db, 'historicos'), { ...payload, createdAt:serverTimestamp() });
    historicoId = ref.id;
  }
  const batch = writeBatch(state.db);
  state.notas.filter((nota) => nota.historicoId === historicoId).forEach((nota) => batch.delete(doc(state.db, 'notas', nota.id)));
  notas.forEach((nota) => batch.set(doc(collection(state.db, 'notas')), { ...nota, historicoId, createdAt:serverTimestamp() }));
  await batch.commit();
  modal.historico.hide();
  await refreshAll();
  if (state.selectedAlunoId) await openDetalhe(state.selectedAlunoId);
  toast('Historico salvo.');
}

async function deleteHistorico(id){
  if (!confirm('Excluir historico?')) return;
  const batch = writeBatch(state.db);
  state.notas.filter((nota) => nota.historicoId === id).forEach((nota) => batch.delete(doc(state.db, 'notas', nota.id)));
  batch.delete(doc(state.db, 'historicos', id));
  await batch.commit();
  await refreshAll();
  toast('Historico excluido.');
}

function updateSeriesAndNotas(existingNotas = [], selectedSerie){
  const tipo = document.querySelector('#historicoForm [name="tipo"]').value;
  const series = tipo === 'Ensino Medio' ? MEDIO_SERIES : FUND_SERIES;
  const disciplinas = tipo === 'Ensino Medio' ? MEDIO_DISCIPLINAS : FUND_DISCIPLINAS;
  fillSelect(document.querySelector('#historicoForm [name="serie"]'), series, selectedSerie);
  document.getElementById('notasBody').innerHTML = '';
  const notas = existingNotas.length ? existingNotas : disciplinas.map((disciplina) => ({ disciplina, nota:'', cargaHoraria:'' }));
  notas.forEach(addNotaRow);
}

function addNotaRow(nota){
  const tr = document.createElement('tr');
  tr.innerHTML = `<td><input class="form-control form-control-sm" name="disciplina" value="${esc(nota.disciplina)}"></td><td><input class="form-control form-control-sm" name="nota" value="${esc(nota.nota)}"></td><td><input type="number" class="form-control form-control-sm" name="cargaHoraria" value="${esc(nota.cargaHoraria)}"></td><td class="text-end"><button type="button" class="btn btn-sm btn-light"><i class="bi bi-x-lg"></i></button></td>`;
  tr.querySelector('button').addEventListener('click', () => tr.remove());
  document.getElementById('notasBody').appendChild(tr);
}

function openCertificado(data = {}){
  refreshAlunoSelects();
  fillForm(document.getElementById('certificadoForm'), data);
  modal.certificado.show();
}

async function saveCertificado(event){
  event.preventDefault();
  const data = formData(event.currentTarget);
  await addDoc(collection(state.db, 'certificados'), { ...data, dataEmissao:new Date().toISOString(), createdAt:serverTimestamp() });
  modal.certificado.hide();
  await refreshAll();
  if (state.selectedAlunoId) await openDetalhe(state.selectedAlunoId);
  toast('Certificado emitido.');
}

async function deleteCertificado(id){
  if (!confirm('Excluir certificado?')) return;
  await deleteDoc(doc(state.db, 'certificados', id));
  await refreshAll();
  toast('Certificado excluido.');
}

function openUsuario(data = {}){
  if (!isAdmin()) return toast('Apenas administradores podem gerenciar usuarios.');
  fillForm(document.getElementById('usuarioForm'), data);
  showView('usuarios');
}

async function saveUsuario(event){
  event.preventDefault();
  if (!isAdmin()) return toast('Apenas administradores podem gerenciar usuarios.');
  const data = formData(event.currentTarget);
  const id = data.id || emailId(data.email);
  const payload = {
    email: String(data.email || '').trim().toLowerCase(),
    nome: data.nome || '',
    role: data.role || 'user',
    status: data.status || 'active',
    updatedAt: serverTimestamp()
  };
  await setDoc(doc(state.db, 'usuarios', id), payload, { merge:true });
  event.currentTarget.reset();
  await refreshAll();
  toast('Usuario salvo.');
}

async function deleteUsuario(id){
  if (!isAdmin()) return toast('Apenas administradores podem gerenciar usuarios.');
  if (id === state.user.uid) return toast('Voce nao pode excluir seu proprio usuario.');
  if (!confirm('Remover usuario da lista de autorizados?')) return;
  await deleteDoc(doc(state.db, 'usuarios', id));
  await refreshAll();
  toast('Usuario removido.');
}

async function saveConfig(event){
  event.preventDefault();
  state.config = formData(event.currentTarget);
  await setDoc(doc(state.db, 'config', 'escola'), state.config, { merge:true });
  toast('Configuracoes salvas.');
}

function refreshAlunoSelects(){
  const html = '<option value=""></option>' + state.alunos.map((aluno) => `<option value="${esc(aluno.id)}">${esc(aluno.nome)}</option>`).join('');
  document.querySelector('#historicoForm [name="alunoId"]').innerHTML = html;
  document.querySelector('#certificadoForm [name="alunoId"]').innerHTML = html;
}

function printHistorico(alunoId){
  const aluno = state.alunos.find((item) => item.id === alunoId);
  const historicos = sortHistoricos(state.historicos.filter((item) => item.alunoId === alunoId));
  const body = renderHistoricoModelo(aluno, historicos);
  openPrint(printShell('Historico Escolar', body, 'landscape'));
}

function printCertificado(id){
  const certificado = state.certificados.find((item) => item.id === id);
  const aluno = state.alunos.find((item) => item.id === certificado.alunoId);
  const body = `<h1>${esc(state.config.nomeEscola || 'HE - Online')}</h1><div class="certificate"><h2>Certificado de Conclusao</h2><p>Certificamos que <strong>${esc(aluno.nome)}</strong>, filho(a) de ${esc(aluno.mae)}, concluiu a etapa <strong>${esc(certificado.etapa)}</strong> em ${esc(certificado.dataConclusao)}.</p><p>Emitido em ${esc(dateBr(certificado.dataEmissao))}.</p></div>${signatures()}`;
  openPrint(printShell('Certificado', body));
}

function renderHistoricoModelo(aluno, historicos){
  const first = historicos[0] || {};
  const disciplinas = unique(state.notas.filter((nota) => historicos.some((h) => h.id === nota.historicoId)).map((nota) => nota.disciplina));
  const headerCols = historicos.map((h) => `<th>${esc(h.serie)}<br><small>${esc(h.anoLetivo)}</small></th>`).join('');
  const notaRows = disciplinas.map((disciplina) => {
    const cols = historicos.map((h) => {
      const nota = state.notas.find((n) => n.historicoId === h.id && n.disciplina === disciplina) || {};
      return `<td>${esc(nota.nota)}<br><small>${esc(nota.cargaHoraria)} h</small></td>`;
    }).join('');
    return `<tr><th>${esc(disciplina)}</th>${cols}</tr>`;
  }).join('');
  const percurso = historicos.map((h) => `<tr><td>${esc(h.anoLetivo)}</td><td>${esc(h.tipo)}</td><td>${esc(h.serie)}</td><td>${esc(h.escola)}</td><td>${esc(h.municipio)}</td><td>${esc(h.uf)}</td><td>${esc(h.diasLetivos)}</td><td>${esc(h.chAnual)}</td><td>${esc(h.faltas)}</td><td>${esc(h.situacao || h.resultadoFinal)}</td></tr>`).join('');
  return `
    <div class="sidade-page">
      <div class="print-head">
        <div><strong>Historico Escolar</strong><span>HE - Online</span></div>
        <div class="print-title">${esc(state.config.nomeEscola || first.escola || 'Escola')}</div>
      </div>
      <table class="meta-table">
        <tr><th>Escola</th><td>${esc(first.escola || state.config.nomeEscola)}</td><th>Codigo INEP</th><td>${esc(first.codigoInep)}</td></tr>
        <tr><th>Municipio/UF</th><td>${esc(first.municipio || state.config.municipio)} / ${esc(first.uf || state.config.uf)}</td><th>Entidade mantenedora</th><td>${esc(first.entidadeMantenedora)}</td></tr>
        <tr><th>Ato de autorizacao</th><td>${esc(first.atoAutorizacao)}</td><th>Ato de criacao</th><td>${esc(first.atoCriacao)}</td></tr>
      </table>
      <h2>Identificacao do aluno</h2>
      <table class="meta-table">
        <tr><th>Nome</th><td colspan="3">${esc(aluno.nome)}</td></tr>
        <tr><th>Data de nascimento</th><td>${esc(aluno.dataNascimento)}</td><th>Naturalidade/UF</th><td>${esc(aluno.naturalidade)} / ${esc(aluno.uf)}</td></tr>
        <tr><th>Nacionalidade</th><td>${esc(aluno.nacionalidade)}</td><th>Sexo</th><td>${esc(aluno.sexo)}</td></tr>
        <tr><th>Mae</th><td>${esc(aluno.mae)}</td><th>Pai</th><td>${esc(aluno.pai)}</td></tr>
        <tr><th>RG/Orgao/UF</th><td>${esc(aluno.rg)} ${esc(aluno.orgaoExpedidor)} ${esc(aluno.ufRg)}</td><th>CPF</th><td>${esc(aluno.cpf)}</td></tr>
      </table>
      <h2>Estudos realizados</h2>
      <table class="history-table">
        <thead><tr><th>Ano</th><th>Etapa</th><th>Serie/Fase</th><th>Escola</th><th>Municipio</th><th>UF</th><th>Dias</th><th>CH</th><th>Faltas</th><th>Resultado</th></tr></thead>
        <tbody>${percurso}</tbody>
      </table>
      <h2>Aproveitamento escolar</h2>
      <table class="grade-matrix">
        <thead><tr><th>Componentes curriculares</th>${headerCols}</tr></thead>
        <tbody>${notaRows}</tbody>
      </table>
      <div class="observations"><strong>Observacoes:</strong> ${esc(historicos.map((h) => h.observacoes).filter(Boolean).join(' | '))}</div>
      ${signatures()}
    </div>`;
}

function printShell(title, body, orientation = 'portrait'){
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>@page{size:A4 ${orientation};margin:10mm}body{font-family:Arial,sans-serif;color:#111;margin:18px;font-size:12px}.print-actions{margin-bottom:12px}.block{border:1px solid #777;padding:10px;margin:10px 0}h1,h2{text-align:center}h2{font-size:14px;text-transform:uppercase;margin:10px 0 6px}.print-head{border:2px solid #111;display:grid;grid-template-columns:180px 1fr;align-items:center;text-align:center;margin-bottom:8px}.print-head div{padding:8px}.print-head span{display:block;font-size:11px}.print-title{font-size:16px;font-weight:700;border-left:2px solid #111}.meta-table,.history-table,.grade-matrix{width:100%;border-collapse:collapse;margin-top:6px}.meta-table th,.meta-table td,.history-table th,.history-table td,.grade-matrix th,.grade-matrix td{border:1px solid #333;padding:4px;vertical-align:middle}.meta-table th{width:16%;background:#f1f5f9;text-align:left}.history-table th,.grade-matrix th{background:#e5e7eb}.grade-matrix td,.grade-matrix th{text-align:center}.grade-matrix th:first-child{text-align:left;min-width:190px}.observations{border:1px solid #333;padding:8px;margin-top:8px}.certificate{font-size:20px;line-height:1.8;text-align:center;margin:80px 30px}.signatures{display:flex;justify-content:space-around;margin-top:54px}.signatures span{border-top:1px solid #111;width:220px;text-align:center;padding-top:8px}@media print{.print-actions{display:none}body{margin:0}}</style></head><body><div class="print-actions"><button onclick="window.print()">Imprimir / salvar PDF</button></div>${body}</body></html>`;
}

function signatures(){
  return '<div class="signatures"><span>Diretor(a)</span><span>Secretario(a)</span></div>';
}

function openPrint(html){
  const win = window.open('', '_blank');
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function alunoNome(id){
  return (state.alunos.find((aluno) => aluno.id === id) || {}).nome || '';
}

function fillSelect(select, values, selected){
  select.innerHTML = values.map((value) => `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(value)}</option>`).join('');
}

function formData(form){
  return Object.fromEntries(new FormData(form).entries());
}

function fillForm(form, data = {}){
  form.reset();
  [...form.elements].forEach((field) => {
    if (!field.name) return;
    field.value = data[field.name] ?? '';
  });
}

function omitId(data){
  const copy = { ...data };
  delete copy.id;
  return copy;
}

function dateBr(value){
  if (!value) return '';
  const date = new Date(value);
  return isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR');
}

function label(key){
  return { mae:'Mae', pai:'Pai', rg:'RG', cpf:'CPF', endereco:'Endereco', telefone:'Telefone', email:'Email', observacoes:'Observacoes' }[key] || key;
}

function isAdmin(){
  return String(state.currentUserProfile && state.currentUserProfile.role || '').toLowerCase() === 'admin' && String(state.currentUserProfile && state.currentUserProfile.status || '').toLowerCase() === 'active';
}

function emailId(email){
  return String(email || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || crypto.randomUUID();
}

function unique(values){
  return [...new Set(values.filter(Boolean))];
}

function sortHistoricos(items){
  return [...items].sort((a, b) => String(a.anoLetivo || '').localeCompare(String(b.anoLetivo || '')) || String(a.serie || '').localeCompare(String(b.serie || '')));
}

function esc(value){
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
}

function toast(message){
  const el = document.getElementById('appToast');
  el.querySelector('.toast-body').textContent = message;
  bootstrap.Toast.getOrCreateInstance(el).show();
}

function showError(error){
  toast(error.message || String(error));
}
