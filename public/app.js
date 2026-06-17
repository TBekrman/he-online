import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, writeBatch } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const STORAGE_KEY = 'heOnlineFirebaseConfig';
const APP_VERSION = '1.5.0';
const APP_UPDATED_AT = '17/06/2026 12:07';
const FUND_SERIES = ['Fase Introdutoria','Fase I','Fase II','Fase III','Fase IV','1o Ano','2o Ano','3o Ano','4o Ano','5o Ano','6o Ano','7o Ano','8o Ano','9o Ano'];
const MEDIO_SERIES = ['1o Ano','2o Ano','3o Ano'];
const FUND_DISCIPLINAS = ['Lingua Portuguesa','Matematica','Ciencias','Geografia','Historia','Ensino Religioso','Educacao Fisica','Arte','Ingles'];
const MEDIO_DISCIPLINAS = ['Lingua Portuguesa','Arte','Educacao Fisica','Matematica','Fisica','Biologia','Quimica','Historia','Geografia','Sociologia','Filosofia'];
const SITUACOES = ['Aprovado','Reprovado','Cursando','Transferido','Concluido'];
const DATE_FIELDS = ['dataNascimento', 'dataConclusao'];
const BOOTSTRAP_ADMIN_EMAILS = ['thiago.bekrman@educacao.mg.gov.br', 'thiago@educacaoensa.com'];
const SCHOOL = Object.freeze({
  name: 'E.E. NOSSA SENHORA AUXILIADORA',
  orientation: 'ORIENTACAO ASIE/VIDA ESCOLAR No5/2022',
  address: 'Rod. dos Inconfidentes Km 45,0 - Cachoeira do Campo, Ouro Preto - MG',
  footer: 'Decreto 6689 de 20 de setembro de 1962',
  footerAddress: 'Rodovia dos Inconfidentes, Km 45 - S/No - Cachoeira do Campo',
  footerCity: 'Ouro Preto - MG - CEP: 35.409-592 - Tel.: (31) 3553-1652'
});

const state = { app:null, auth:null, db:null, user:null, currentUserProfile:null, alunos:[], historicos:[], notas:[], certificados:[], usuarios:[], config:{}, selectedAlunoId:null };
const modal = {};

document.addEventListener('DOMContentLoaded', start);

function start(){
  modal.aluno = new bootstrap.Modal(document.getElementById('alunoModal'));
  modal.historico = new bootstrap.Modal(document.getElementById('historicoModal'));
  modal.certificado = new bootstrap.Modal(document.getElementById('certificadoModal'));
  bindSetup();
  bindUi();
  renderVersion();
  const config = window.HE_ONLINE_FIREBASE_CONFIG || readConfig();
  if (!config) return showOnly('setupScreen');
  bootFirebase(config);
}

function renderVersion(){
  const label = `v${APP_VERSION}`;
  const updated = `Atualizado em ${APP_UPDATED_AT}`;
  document.getElementById('appVersionLabel').textContent = label;
  document.getElementById('appVersionBox').textContent = label;
  document.getElementById('appUpdatedBox').textContent = updated;
  document.getElementById('appVersionTop').textContent = `${label} - ${APP_UPDATED_AT}`;
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
  document.querySelectorAll('.date-br').forEach((input) => input.addEventListener('input', maskDateInput));

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
  state.currentUserProfile = state.usuarios.find((u) => u.id === state.user.uid) || state.usuarios.find((u) => normalizeEmail(u.email) === normalizeEmail(state.user.email)) || state.currentUserProfile;
  renderAll();
}

async function loadCurrentUserProfile(){
  if (!state.user) return;
  const snap = await getDoc(doc(state.db, 'usuarios', state.user.uid));
  if (snap.exists()) {
    state.currentUserProfile = { id: snap.id, ...snap.data() };
    return;
  }
  const emailSnap = await getDoc(doc(state.db, 'usuarios', normalizeEmail(state.user.email)));
  if (emailSnap.exists()) {
    state.currentUserProfile = { id: emailSnap.id, ...emailSnap.data() };
  }
}

async function ensureCurrentUserProfile(user){
  const users = snapToArray(await getDocs(collection(state.db, 'usuarios')));
  const userEmail = normalizeEmail(user.email);
  const existing = users.find((item) => item.id === user.uid || normalizeEmail(item.email) === userEmail);
  const firstUser = users.length === 0;
  const bootstrapAdmin = BOOTSTRAP_ADMIN_EMAILS.includes(userEmail);
  if (!firstUser && !existing && !bootstrapAdmin) {
    await signOut(state.auth);
    toast('E-mail nao autorizado. Solicite acesso ao administrador.');
    return false;
  }
  if (existing && existing.status === 'blocked') {
    await signOut(state.auth);
    toast('Usuario bloqueado pelo administrador.');
    return false;
  }
  const profile = {
    email: userEmail,
    nome: user.displayName || user.email || 'Usuario',
    role: firstUser || bootstrapAdmin ? 'admin' : (existing && existing.role) || 'user',
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
  document.getElementById('alunosTable').innerHTML = rowsOrEmpty(list.map((a) => `<tr><td><strong>${esc(a.nome)}</strong></td><td>${esc(dateBr(a.dataNascimento))}</td><td>${esc(a.mae)}</td><td>${esc(a.cpf)}</td><td>${esc(a.telefone)}</td><td class="actions"><button class="btn btn-sm btn-light" data-action="detailAluno" data-id="${esc(a.id)}"><i class="bi bi-eye"></i></button><button class="btn btn-sm btn-outline-primary" data-action="editAluno" data-id="${esc(a.id)}"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-outline-danger" data-action="deleteAluno" data-id="${esc(a.id)}"><i class="bi bi-trash"></i></button></td></tr>`));
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
  document.getElementById('certificadosTable').innerHTML = rowsOrEmpty(state.certificados.map((c) => `<tr><td>${esc(c.alunoNome)}</td><td>${esc(c.etapa)}</td><td>${esc(dateBr(c.dataConclusao))}</td><td>${esc(dateBr(c.dataEmissao))}</td><td class="actions"><button class="btn btn-sm btn-outline-dark" data-action="printCertificado" data-id="${esc(c.id)}"><i class="bi bi-printer"></i></button><button class="btn btn-sm btn-outline-danger" data-action="deleteCertificado" data-id="${esc(c.id)}"><i class="bi bi-trash"></i></button></td></tr>`));
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
  const data = normalizeDateFields(normalizeAluno(formData(event.currentTarget)));
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
  document.getElementById('detailMeta').textContent = `${dateBr(aluno.dataNascimento) || ''} | ${aluno.naturalidade || ''}/${aluno.uf || ''}`;
  document.getElementById('detailInfo').innerHTML = ['mae','pai','rg','cpf','endereco','telefone','email','observacoes'].map((key) => `<div class="info-item"><span>${label(key)}</span><strong>${esc(aluno[key])}</strong></div>`).join('');
  document.getElementById('detailHistoricos').innerHTML = rowsOrEmpty(historicos.map((h) => `<tr><td>${esc(h.tipo)}</td><td>${esc(h.serie)}</td><td>${esc(h.anoLetivo)}</td><td>${esc(h.situacao)}</td><td class="actions"><button class="btn btn-sm btn-outline-primary" data-action="editHistorico" data-id="${esc(h.id)}"><i class="bi bi-pencil"></i></button></td></tr>`));
  document.getElementById('detailCertificados').innerHTML = rowsOrEmpty(certificados.map((c) => `<tr><td>${esc(c.etapa)}</td><td>${esc(dateBr(c.dataConclusao))}</td><td>${esc(dateBr(c.dataEmissao))}</td><td class="actions"><button class="btn btn-sm btn-outline-dark" data-action="printCertificado" data-id="${esc(c.id)}"><i class="bi bi-printer"></i></button></td></tr>`));
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
  const data = normalizeDateFields(formData(event.currentTarget));
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
  try {
    const data = formData(event.currentTarget);
    const email = normalizeEmail(data.email);
    const id = data.id || email;
    const payload = {
      email,
      nome: data.nome || '',
      role: data.role || 'user',
      status: data.status || 'active',
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(state.db, 'usuarios', id), payload, { merge:true });
    const existingIndex = state.usuarios.findIndex((item) => item.id === id || normalizeEmail(item.email) === email);
    const localRow = { id, ...payload, updatedAt: new Date().toISOString() };
    if (existingIndex >= 0) state.usuarios.splice(existingIndex, 1, localRow);
    else state.usuarios.push(localRow);
    event.currentTarget.reset();
    renderUsuarios();
    renderAdminState();
    toast('Usuario salvo.');
  } catch (error) {
    showError(error);
  }
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
  const body = `<h1>${esc(state.config.nomeEscola || 'HE - Online')}</h1><div class="certificate"><h2>Certificado de Conclusao</h2><p>Certificamos que <strong>${esc(aluno.nome)}</strong>, filho(a) de ${esc(aluno.mae)}, concluiu a etapa <strong>${esc(certificado.etapa)}</strong> em ${esc(dateBr(certificado.dataConclusao))}.</p><p>Emitido em ${esc(dateBr(certificado.dataEmissao))}.</p></div>${signatures()}`;
  openPrint(printShell('Certificado', body));
}

function renderHistoricoModelo(aluno, historicos){
  const fundamental = sortHistoricos(historicos.filter((h) => h.tipo === 'Ensino Fundamental'));
  const medio = sortHistoricos(historicos.filter((h) => h.tipo === 'Ensino Medio'));
  return [
    fundamental.length ? renderFundamentalPage(aluno, fundamental) : '',
    medio.length ? renderMedioPage(aluno, medio) : ''
  ].filter(Boolean).join('<div class="page-break"></div>');
}

function renderSchoolHeader(){
  return `<div class="school-header"><div class="seal">REPUBLICA<br>FEDERATIVA</div><div><h1>${SCHOOL.name}</h1><div class="line"></div><p>${SCHOOL.orientation}</p><div class="line"></div><p>${SCHOOL.address}</p></div><div class="seal">BRASAO<br>MG</div></div>`;
}

function renderFundamentalPage(aluno, historicos){
  const bySerie = Object.fromEntries(historicos.map((h) => [fundamentalSerieKey(h.serie), h]));
  const series = ['1o ano','2o ano','3o ano','4o ano','5o ano','6o ano','7o ano','8o ano','9o ano'];
  const blocks = series.map((serie) => renderStageBlock(serie, bySerie[fundamentalSerieKey(serie)], DISCIPLINAS_FUNDAMENTAL, 'fundamental')).join('');
  const emission = historicos.find((h) => h.anoLetivo) || {};
  return `<section class="print-page">${renderPrintTitle('HISTORICO ESCOLAR - ENSINO FUNDAMENTAL')}${blocks}${signatures()}<div style="text-align:center;margin-top:8px">Ouro Preto, ${esc(emission.dataEmissaoHistorico || dateBr(new Date().toISOString()))}</div></section>`;
}

function renderMedioPage(aluno, historicos){
  return renderMedioPdfTemplate(aluno, historicos);
}

function renderMedioPdfTemplate(aluno, historicos){
  const bySerie = Object.fromEntries(historicos.map((h) => [normalizeSerie(h.serie), h]));
  const cert = state.certificados.find((c) => c.alunoId === aluno.id && c.etapa === 'Ensino Medio') || {};
  const fields = [
    pdfField(42, 4.45, SCHOOL.name, 'center w30'),
    pdfField(43, 8.5, SCHOOL.orientation, 'center w32 small'),
    pdfField(42, 11.8, SCHOOL.address, 'center w34 small'),
    pdfField(16.8, 17.55, aluno.nome, 'w44'),
    pdfField(68.8, 17.25, aluno.naturalidade, 'w24'),
    pdfField(5.5, 19.75, aluno.uf, 'w8'),
    pdfField(32.5, 19.55, aluno.nacionalidade, 'w26 center'),
    pdfField(79, 19.55, aluno.sexo, 'w18 center'),
    pdfField(13.2, 21.95, dateBr(aluno.dataNascimento), 'w24 center'),
    pdfField(45.2, 21.95, aluno.mae, 'w48'),
    pdfField(7.2, 24.3, aluno.pai, 'w54'),
    pdfField(81.2, 24.15, aluno.rg, 'w17 center'),
    pdfField(22, 26.4, `${aluno.orgaoExpedidor || ''} ${aluno.ufRg || ''}`, 'w22 center'),
    pdfField(55.5, 26.4, cert.dataConclusao || conclusionYear(historicos), 'w15 center'),
    pdfField(74.5, 26.4, cert.serieConclusao || '3o Ano', 'w22 center'),
    pdfField(8, 28.65, cert.etapa || 'Ensino Medio', 'w52 center'),
    pdfField(28.5, 35.9, cert.municipioData || `Ouro Preto, ${dateBr(new Date().toISOString())}`, 'w42 center')
  ];
  ['1o Ano', '2o Ano', '3o Ano'].forEach((serie, index) => {
    fields.push(...renderMedioSerieFields(bySerie[normalizeSerie(serie)], index));
  });
  const obs = historicos.map((h) => h.observacoes).filter(Boolean).join(' | ');
  fields.push(pdfField(3, 86.9, obs, 'w92 small'));
  return `<section class="pdf-template-page"><img src="./assets/historico-medio-template.png" alt=""><div class="pdf-fields">${fields.join('')}</div></section>`;
}

function renderMedioSerieFields(historico, index){
  const yMeta = [42.8, 69.8, 80.7][index];
  const yAprov = [62.0, 75.0, 85.6][index];
  const yCh = [63.55, 76.35, 86.95][index];
  const yFaltas = [65.05, 77.7, 88.35][index];
  const yObs = [67.0, 79.05, 89.85][index];
  const notes = historico ? state.notas.filter((n) => n.historicoId === historico.id) : [];
  const fields = [
    pdfField(12, yMeta, historico && historico.escola, 'w34 small'),
    pdfField(55, yMeta, historico && historico.municipio, 'w18 small center'),
    pdfField(8, yMeta + 1.7, historico && (historico.uf || historico.estado), 'w8 small center'),
    pdfField(25, yMeta + 1.7, historico && (historico.minimoPromocao || '60%'), 'w12 small center'),
    pdfField(58, yMeta + 1.7, historico && historico.diasLetivos, 'w10 small center'),
    pdfField(76, yMeta + 1.7, historico && historico.chAnual ? `${historico.chAnual}h` : '', 'w10 small center')
  ];
  MEDIO_DISCIPLINAS.forEach((disciplina, col) => {
    const note = notes.find((n) => normalizeSerie(n.disciplina) === normalizeSerie(disciplina)) || {};
    const x = 14.7 + col * 3.9;
    fields.push(pdfField(x, yAprov, note.nota || '', 'cell'));
    fields.push(pdfField(x, yCh, note.cargaHoraria || '', 'cell'));
  });
  fields.push(pdfField(89.5, yCh, historico && historico.chAnual ? `${historico.chAnual}` : '', 'cell'));
  fields.push(pdfField(94, yFaltas, historico && historico.faltas ? `${historico.faltas}` : '', 'cell'));
  fields.push(pdfField(96.8, yFaltas, historico && (historico.situacao || historico.resultadoFinal), 'vertical-result'));
  fields.push(pdfField(13, yObs, historico && historico.observacoes, 'w83 small'));
  return fields;
}

function pdfField(x, y, value, className = ''){
  return `<span class="pdf-field ${className}" style="left:${x}%;top:${y}%">${esc(value || '')}</span>`;
}

function conclusionYear(historicos){
  const last = sortHistoricos(historicos).slice(-1)[0];
  return last ? last.anoLetivo : '';
}

function renderPrintTitle(text){
  return `<div class="doc-title">${esc(text)}</div>`;
}

function renderCertificateHeader(aluno, cert){
  return `<div class="cert-box"><div class="cert-title">Certificado de Conclusao da Educacao Basica</div><table class="cert-grid"><tr><td>Certificamos que <strong>${esc(aluno.nome)}</strong></td><td>natural de ${esc(aluno.naturalidade)}</td></tr><tr><td>UF ${esc(aluno.uf)} de nacionalidade ${esc(aluno.nacionalidade)}</td><td>do sexo ${esc(aluno.sexo)}</td></tr><tr><td>nascido(a) em ${esc(dateBr(aluno.dataNascimento))}</td><td>filho(a) de ${esc(aluno.mae)}</td></tr><tr><td>e de ${esc(aluno.pai)}</td><td>Carteira de Identidade no ${esc(aluno.rg)}</td></tr><tr><td>concluiu em ${esc(cert.dataConclusao || '')}</td><td>a(o) ${esc(cert.etapa || 'Ensino Medio')}</td></tr></table><p style="margin:4px 0 0">Fundamentacao Legal: Lei Federal no 9.394/96; Resolucao SEE/MG no 2.197/12; conforme Historico Escolar e observacoes no anverso e verso.</p>${signatures()}</div>`;
}

function renderStageBlock(label, historico, disciplinas, model){
  const notes = historico ? state.notas.filter((n) => n.historicoId === historico.id) : [];
  const cells = disciplinas.map((disciplina) => {
    const note = notes.find((n) => normalizeSerie(n.disciplina) === normalizeSerie(disciplina)) || {};
    return {
      name: disciplina,
      nota: note.nota || '',
      ch: note.cargaHoraria || '',
      faltas: historico && historico.faltas ? historico.faltas : ''
    };
  });
  const head = cells.map((c) => `<th class="disc-head">${esc(c.name)}</th>`).join('');
  const notas = cells.map((c) => `<td>${esc(c.nota)}</td>`).join('');
  const ch = cells.map((c) => `<td>${esc(c.ch)}</td>`).join('');
  const faltas = cells.map((c) => `<td>${esc(c.faltas)}</td>`).join('');
  const blankCols = model === 'fundamental' ? '<td class="blank-lines" rowspan="4" colspan="4"></td>' : '<td class="blank-lines" rowspan="4" colspan="3"></td>';
  return `<div class="stage-block"><table class="stage-meta"><tr><th>ESTABELECIMENTO:</th><td>${esc(historico && historico.escola)}</td><th>MUNICIPIO:</th><td>${esc(historico && historico.municipio)}</td></tr><tr><th>ESTADO:</th><td>${esc(historico && (historico.uf || historico.estado))}</td><th>MINIMO P/ PROMOCAO:</th><td>${esc(historico && (historico.minimoPromocao || '60%'))}</td><th>DIAS LETIVOS ANUAIS:</th><td>${esc(historico && historico.diasLetivos)}</td><th>CARGA HORARIA ANUAL:</th><td>${esc(historico && historico.chAnual)}${historico && historico.chAnual ? 'h' : ''}</td></tr></table><table class="stage-table"><tr><th class="stage-label" rowspan="5">${esc(label)}</th><th class="row-label">VERIFICACAO DO RENDIMENTO</th>${head}<th class="situation" rowspan="5">${esc(historico && (historico.situacao || historico.resultadoFinal))}</th>${blankCols}</tr><tr><th class="row-label">APROVEITAMENTO</th>${notas}</tr><tr><th class="row-label">C.H. CURRICULAR (H.R.)</th>${ch}</tr><tr><th class="row-label">FALTAS (H.R.)</th>${faltas}</tr><tr><th class="row-label">OBSERVACAO</th><td colspan="${disciplinas.length + (model === 'fundamental' ? 4 : 3)}">${esc(historico && historico.observacoes)}</td></tr></table></div>`;
}

function renderSchoolFooter(){
  return `<div class="footer-school"><strong>${SCHOOL.name}</strong><br>${SCHOOL.footer}<br>${SCHOOL.footerAddress}<br>${SCHOOL.footerCity}</div>`;
}

function printShell(title, body, orientation = 'portrait'){
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>@page{size:A4 portrait;margin:0}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;font-size:9px;background:#fff}.print-actions{padding:12px}.print-page{width:100%;border:2px solid #222;padding:4px;page-break-inside:avoid}.page-break{page-break-before:always}.pdf-template-page{position:relative;width:210mm;height:297mm;margin:0 auto;background:#fff;overflow:hidden;page-break-inside:avoid}.pdf-template-page img{position:absolute;inset:0;width:100%;height:100%;object-fit:fill}.pdf-fields{position:absolute;inset:0}.pdf-field{position:absolute;font-size:9px;line-height:1.05;white-space:nowrap;overflow:hidden;text-align:left}.pdf-field.center{text-align:center}.pdf-field.small{font-size:7.5px}.pdf-field.w8{width:8%}.pdf-field.w10{width:10%}.pdf-field.w12{width:12%}.pdf-field.w15{width:15%}.pdf-field.w17{width:17%}.pdf-field.w18{width:18%}.pdf-field.w22{width:22%}.pdf-field.w24{width:24%}.pdf-field.w26{width:26%}.pdf-field.w30{width:30%}.pdf-field.w32{width:32%}.pdf-field.w34{width:34%}.pdf-field.w42{width:42%}.pdf-field.w44{width:44%}.pdf-field.w48{width:48%}.pdf-field.w52{width:52%}.pdf-field.w54{width:54%}.pdf-field.w83{width:83%}.pdf-field.w92{width:92%}.pdf-field.cell{width:2.8%;text-align:center;font-size:7px}.pdf-field.vertical-result{width:4%;height:6%;writing-mode:vertical-rl;transform:rotate(180deg);text-align:center;font-size:7px;font-weight:700}.school-header{border:1px solid #222;border-radius:6px;padding:6px 8px;margin-bottom:4px;text-align:center;display:grid;grid-template-columns:90px 1fr 90px;align-items:center}.seal{width:54px;height:54px;border:2px solid #555;border-radius:50%;display:grid;place-items:center;font-size:8px;margin:auto}.school-header h1{font-size:15px;margin:0 0 8px}.school-header .line{border-top:1px solid #777;margin:5px 0}.school-header p{font-size:12px;margin:0}.doc-title{text-align:center;border:1px solid #222;font-size:13px;font-weight:700;text-transform:uppercase;padding:2px;margin:2px 0}.stage-block{border:1px solid #222;margin-top:2px}.stage-meta{width:100%;border-collapse:collapse}.stage-meta td,.stage-meta th{border:1px solid #222;padding:1px 3px}.stage-table{width:100%;border-collapse:collapse;table-layout:fixed}.stage-table th,.stage-table td{border:1px solid #222;text-align:center;vertical-align:middle;padding:1px;height:18px}.stage-label{width:26px;font-weight:700;writing-mode:vertical-rl;transform:rotate(180deg)}.row-label{width:62px;font-weight:700}.disc-head{height:92px;font-size:8px;writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap}.situation{width:34px;font-weight:700;writing-mode:vertical-rl;transform:rotate(180deg)}.blank-lines{background:repeating-linear-gradient(to bottom,#fff 0,#fff 8px,#222 9px);position:relative}.blank-lines:after{content:'';position:absolute;inset:0;background:linear-gradient(30deg,transparent 48%,#222 49%,#222 51%,transparent 52%)}.cert-box{border:1px solid #222;border-radius:6px;padding:6px;margin:4px 0}.cert-title{text-align:center;font-size:15px;font-weight:700;text-transform:uppercase;border-bottom:1px solid #222;margin-bottom:5px}.cert-grid{width:100%;border-collapse:collapse}.cert-grid td{padding:3px;border-bottom:1px solid #777}.obs{border:1px solid #222;min-height:24px;padding:3px;margin-top:3px}.footer-school{text-align:center;font-size:11px;margin-top:10px}.signatures{display:flex;justify-content:space-around;margin-top:28px}.signatures span{border-top:1px solid #111;width:240px;text-align:center;padding-top:3px;font-size:10px}@media print{.print-actions{display:none}body{margin:0}.print-page{min-height:276mm}}</style></head><body><div class="print-actions"><button onclick="window.print()">Imprimir / salvar PDF</button></div>${body}</body></html>`;
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
    field.value = DATE_FIELDS.includes(field.name) ? dateBr(data[field.name]) : data[field.name] ?? '';
  });
}

function omitId(data){
  const copy = { ...data };
  delete copy.id;
  return copy;
}

function normalizeDateFields(data){
  const copy = { ...data };
  DATE_FIELDS.forEach((field) => {
    if (copy[field]) copy[field] = dateBr(copy[field]);
  });
  return copy;
}

function maskDateInput(event){
  const digits = event.target.value.replace(/\D/g, '').slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
  event.target.value = parts.join('/');
}

function dateBr(value){
  if (!value) return '';
  const text = String(value);
  const br = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return text;
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const date = new Date(value);
  return isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR');
}

function label(key){
  return { mae:'Mae', pai:'Pai', rg:'RG', cpf:'CPF', endereco:'Endereco', telefone:'Telefone', email:'Email', observacoes:'Observacoes' }[key] || key;
}

function isAdmin(){
  if (BOOTSTRAP_ADMIN_EMAILS.includes(normalizeEmail(state.user && state.user.email))) return true;
  const profile = state.currentUserProfile || {};
  const currentEmail = normalizeEmail(state.user && state.user.email);
  return String(profile.role || '').toLowerCase() === 'admin'
    && String(profile.status || '').toLowerCase() === 'active'
    && (!profile.email || normalizeEmail(profile.email) === currentEmail || profile.uid === (state.user && state.user.uid));
}

function emailId(email){
  return String(email || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || crypto.randomUUID();
}

function normalizeEmail(email){
  return String(email || '').trim().toLowerCase();
}

function unique(values){
  return [...new Set(values.filter(Boolean))];
}

function sortHistoricos(items){
  return [...items].sort((a, b) => String(a.anoLetivo || '').localeCompare(String(b.anoLetivo || '')) || String(a.serie || '').localeCompare(String(b.serie || '')));
}

function normalizeSerie(value){
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[ºª]/g, 'o').replace(/\s+/g, ' ').trim();
}

function fundamentalSerieKey(value){
  const normalized = normalizeSerie(value);
  const aliases = {
    'fase introdutoria': '1o ano',
    'fase i': '2o ano',
    'fase ii': '3o ano',
    'fase iii': '4o ano',
    'fase iv': '5o ano'
  };
  return aliases[normalized] || normalized;
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
