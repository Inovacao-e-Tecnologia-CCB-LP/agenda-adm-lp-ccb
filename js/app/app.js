const appScriptApi = new AppScriptApi();
const Ui = new UiComponents();

/* ================= APP ================= */

let dataStore = {};
let escolha = {};
let abortController;

const navigationStack = [];
const titulo = document.getElementById('titulo');
const conteudo = document.getElementById('conteudo');
const backButton = document.getElementById('backButton');

document.addEventListener('DOMContentLoaded', init);
backButton.addEventListener('click', goBack);

function goBack() {
	if (abortController) abortController.abort();
	if (navigationStack.length > 1) {
		navigationStack.pop();
		navigationStack[navigationStack.length - 1]();
		updateBackButton();
	}
}

function navigateTo(screenFn, ...args) {
	esconderBotaoAdmin();
	const screen = () => screenFn(...args);
	navigationStack.push(screen);
	screen();
	updateBackButton();
}

function updateBackButton() {
	backButton.style.display = navigationStack.length > 1 ? 'block' : 'none';
}

async function init() {
	esconderBotaoAdmin();
	backButton.style.display = 'none';
	setTitle('Carregando...');
	conteudo.innerHTML = '<div class="spinner-border"></div>';

	try {
		dataStore = await appScriptApi.bootstrap();
		navigateTo(showMenuInicial);
	} catch {
		conteudo.innerHTML = '<div class="alert alert-danger">Erro ao carregar dados.</div>';
	}
}

function selecionarLocal(l) {
	escolha.local = l;
	navigateTo(showEscolherData);
}

function selecionarData(p) {
	escolha.agendamentos = p;
	navigateTo(showConfirmar);
}

async function verInscritos() {
	navigateTo(showInscritos);
}

function resetAndGoHome() {
	abortController?.abort();
	escolha = {};
	navigationStack.length = 0;
	navigateTo(showMenuInicial);
}

async function resetAndGoHomeWithConfirmation() {
	const ok = await abrirModalConfirmacaoNormal(
		'Tem certeza que deseja voltar para a tela inicial?',
		'Sim',
	);

	if (!ok) return;

	abortController?.abort();
	escolha = {};
	navigationStack.length = 0;
	navigateTo(showMenuInicial);
}

// ================================
// Foco global para todas as modais
// ================================

document.addEventListener('shown.bs.modal', (event) => {
	const modalEl = event.target;
	if (!modalEl) return;

	// Busca o primeiro input ou botão visível, ignorando o botão de fechar (btn-close)
	const foco = modalEl.querySelector(
		'input:not([type=hidden]):not([disabled]), button:not([disabled]):not(.btn-close)',
	);

	if (foco) {
		foco.focus();
	}
});

document.addEventListener('hide.bs.modal', (event) => {
	if (document.activeElement) {
		document.activeElement.blur();
	}
});
