function setTitle(text) {
	document.getElementById('titulo').innerText = text;
}

async function showMenuInicial() {
	window.adminAuth = {
		authenticated: false,
		token: null,
	};

	mostrarBotaoAdmin();
	setTitle('Página Inicial');
	conteudo.innerHTML = Ui.Home();
}

const adminButton = document.getElementById('adminButton');

function esconderBotaoAdmin() {
	adminButton.style.display = 'none';
}

function mostrarBotaoAdmin() {
	adminButton.style.display = 'inline-block';
}

function copiarTexto(container = document) {
	container.querySelectorAll('.copy-text').forEach((el) => {
		el.addEventListener('click', () => {
			const text = el.cloneNode(true);
			text.querySelectorAll('i').forEach((i) => i.remove());
			const valor = text.textContent.trim();
			if (!valor) return;

			navigator.clipboard.writeText(valor).then(() => {
				const localId = el.getAttribute('data-localid');
				abrirModalMapa(localId);
			});
		});
	});
}

function abrirMapa(localId) {
	let localObj = null;

	// Tenta via Map (inscrições)
	if (typeof locaisMap !== 'undefined' && locaisMap[localId]) {
		localObj = locaisMap[localId];
	}

	// Fallback via dataStore (Agendamentos)
	if (!localObj && typeof _getLocalById === 'function') {
		localObj = _getLocalById(localId);
	}

	if (!localObj) {
		abrirModalAviso('Erro', 'Endereço não encontrado');
		return;
	}

	const endereco = encodeURIComponent(localObj.endereco ?? 'Endereço não informado');

	const url = `https://www.google.com/maps/search/?api=1&query=${endereco}`;

	window.open(url, '_blank', 'noopener');
}

function abrirWhatsApp(numero) {
	const mensagem = `A Paz de Deus! Estou com uma dúvida sobre como utilizar o sistema de agendamentos.`;
	const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
	window.open(url, '_blank', 'noopener,noreferrer');
}

function mostrarLoading(containerId) {
	const el = document.getElementById(containerId);
	if (!el) return;

	el.innerHTML = `
    <div class="text-center my-4">
      <div class="spinner-border text-dark"></div>
    </div>
  `;
}

// getTipoRadioSelecionado e marcarTipoRadio foram migrados para
// ui-setores.js como parte do sistema de tipos dinâmicos.

function mostrarErroCampo(idErro, msg) {
	const el = document.getElementById(idErro);
	if (!el) return;
	el.innerText = msg;
	el.classList.remove('d-none');
}

function limparErroCampo(idErro) {
	const el = document.getElementById(idErro);
	if (!el) return;
	el.innerText = '';
	el.classList.add('d-none');
}

/* =============================================================
   SISTEMA CENTRAL DE TRAVA DE UI
   ─────────────────────────────────────────────────────────────
   travarUI()   — desabilita backButton + todos os botões de
                  ação da tela atual (novo, editar, excluir,
                  compartilhar, whatsapp, pdf, etc.)
   liberarUI()  — restaura tudo

   Uso com profundidade: chamadas aninhadas são contadas;
   só libera quando o contador chegar a 0.
============================================================= */

let _uiLockDepth = 0;

/**
 * Seletores que identificam "botões de ação" na tela.
 * Inclui todos os padrões usados no sistema.
 */
const _BTN_ACAO_SELETORES = [
	// botões "Novo ..." de cada painel
	'#novoLocalBtn',
	'#novoSetorBtn',
	'#novaRegraBtn',
	'#novoAgendamentoBtn',
	// ações inline de tabelas / cards
	'.editar-btn',
	'.excluir-btn',
	'.compartilhar-btn',
	// botões de relatório
	'#btnGerarPDF',
	'#btnEnviarWhatsApp',
	// botão confirmar presença (fluxo de inscrição)
	'#btnConfirmar',
	// botão de whatsapp na lista de inscritos
	'.btn-whatsapp-share',
].join(', ');

function travarUI() {
	_uiLockDepth++;
	if (_uiLockDepth > 1) return; // já travado

	// Trava o botão Voltar
	backButton.setAttribute('disabled', '');
	backButton.classList.add('ui-locked');

	// Trava todos os botões de ação visíveis no #conteudo
	document.querySelectorAll(_BTN_ACAO_SELETORES).forEach((b) => {
		b.setAttribute('disabled', '');
		b.classList.add('ui-locked');
	});
}

function liberarUI() {
	if (_uiLockDepth <= 0) return;
	_uiLockDepth--;
	if (_uiLockDepth > 0) return; // ainda há chamadas aninhadas

	// Libera backButton
	backButton.removeAttribute('disabled');
	backButton.classList.remove('ui-locked');

	// Libera todos os botões marcados
	document.querySelectorAll('.ui-locked').forEach((b) => {
		b.removeAttribute('disabled');
		b.classList.remove('ui-locked');
	});
}

/**
 * Executa uma operação async travando/liberando a UI automaticamente.
 * Uso: await comUITravada(async () => { ... })
 */
async function comUITravada(fn) {
	travarUI();
	try {
		return await fn();
	} finally {
		liberarUI();
	}
}
