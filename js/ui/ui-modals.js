let mapaLocalId = null;

/* ================================================
   ABORT CONTROLLER DE MODAL
   Cada modal tem seu próprio AbortController.
   Ao cancelar/fechar durante carregamento, o fetch
   em andamento é abortado via signal.
================================================ */
const _modalAborts = {};

/**
 * Retorna o AbortSignal do modal especificado.
 * Cria um novo controller se não existir.
 */
function _getModalSignal(modalId) {
	if (!_modalAborts[modalId] || _modalAborts[modalId].signal.aborted) {
		_modalAborts[modalId] = new AbortController();
	}
	return _modalAborts[modalId].signal;
}

/**
 * Aborta a operação do modal e libera o estado de trava.
 */
function _abortarModal(modalId) {
	if (_modalAborts[modalId]) {
		_modalAborts[modalId].abort();
		delete _modalAborts[modalId];
	}
	_liberarModal(modalId);
}

/* ================================================
   TRAVA / LIBERA BOTÕES DO MODAL
   - Trava: desabilita todos os botões do footer
     EXCETO o btn-close e o btn de Cancelar
   - Libera: restaura todos
================================================ */
function _travarModal(modalId) {
	const modalEl = document.getElementById(modalId);
	if (!modalEl) return;

	// Footer buttons — trava tudo exceto Cancelar e btn-close
	modalEl.querySelectorAll('.modal-footer .btn, .modal-header .btn-close').forEach((btn) => {
		const isCancelar =
			btn.hasAttribute('data-bs-dismiss') || btn.classList.contains('btn-close');
		if (!isCancelar) {
			btn.setAttribute('disabled', '');
			btn.classList.add('modal-ui-locked');
		}
	});
}

function _liberarModal(modalId) {
	const modalEl = document.getElementById(modalId);
	if (!modalEl) return;

	modalEl.querySelectorAll('.modal-ui-locked').forEach((btn) => {
		btn.removeAttribute('disabled');
		btn.classList.remove('modal-ui-locked');
	});
}

/* ================================================
   UTILITÁRIO INTERNO
   Aguarda qualquer modal que esteja aberto ou em
   processo de fechamento antes de abrir outro.
================================================ */
function _aguardarFechamentoModal() {
	return new Promise((resolve) => {
		const abertos = document.querySelectorAll('.modal.show, .modal.hiding, .modal.fade.show');

		if (!abertos.length) {
			resolve();
			return;
		}

		const ultimo = abertos[abertos.length - 1];

		const instancia = bootstrap.Modal.getInstance(ultimo);
		if (instancia) {
			instancia.hide();
		}

		ultimo.addEventListener('hidden.bs.modal', () => resolve(), { once: true });
	});
}

/* ================================================
   MODAL DE AVISO
================================================ */
async function abrirModalAviso(titulo, mensagem) {
	await _aguardarFechamentoModal();

	return new Promise((resolve) => {
		document.getElementById('modalAvisoTitulo').innerText = titulo;
		document.getElementById('modalAvisoMensagem').innerText = mensagem;

		const modalEl = document.getElementById('modalAviso');
		const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

		modal.show();

		modalEl.addEventListener('hidden.bs.modal', () => resolve(), {
			once: true,
		});
	});
}

/* ================================================
   MODAL DE AJUDA
================================================ */
async function abrirModalAjuda() {
	await _aguardarFechamentoModal();

	const modalEl = document.getElementById('modalAjuda');
	const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
	modal.show();
}

/* ================================================
   MODAL DE CONFIRMAÇÃO (retorna Promise<boolean>)
================================================ */
function abrirModalConfirmacao(mensagem, textoBotao = 'Confirmar') {
	return new Promise(async (resolve) => {
		await _aguardarFechamentoModal();

		const modalEl = document.getElementById('confirmModal');
		const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

		document.getElementById('confirmMessage').innerText = mensagem;
		document.getElementById('confirmOk').innerText = textoBotao;

		const btnOk = document.getElementById('confirmOk');

		const confirmar = () => {
			btnOk.removeEventListener('click', confirmar);
			modal.hide();
			resolve(true);
		};

		btnOk.addEventListener('click', confirmar);

		modalEl.addEventListener(
			'hidden.bs.modal',
			() => {
				btnOk.removeEventListener('click', confirmar);
				resolve(false);
			},
			{ once: true },
		);

		modal.show();
	});
}

function abrirModalConfirmacaoNormal(mensagem, textoBotao = 'Confirmar') {
	return new Promise(async (resolve) => {
		await _aguardarFechamentoModal();

		const modalEl = document.getElementById('confirmModalNormal');
		const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

		document.getElementById('confirmMessageNormal').innerText = mensagem;
		document.getElementById('confirmOkNormal').innerText = textoBotao;

		const btnOk = document.getElementById('confirmOkNormal');

		const confirmar = () => {
			btnOk.removeEventListener('click', confirmar);
			modal.hide();
			resolve(true);
		};

		btnOk.addEventListener('click', confirmar);

		modalEl.addEventListener(
			'hidden.bs.modal',
			() => {
				btnOk.removeEventListener('click', confirmar);
				resolve(false);
			},
			{ once: true },
		);

		modal.show();
	});
}

/* ================================================
   MODAL DE MAPA / ENDEREÇO
================================================ */
async function abrirModalMapa(localId) {
	await _aguardarFechamentoModal();

	const modalEl = document.getElementById('modalMapa');
	const btnAbrir = modalEl.querySelector('#btnAbrirMapa');

	btnAbrir.onclick = () => abrirMapa(localId);

	bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

/* ================================================
   REGISTRA CANCELAMENTO EM TODOS OS MODAIS
   Ao clicar em Cancelar ou fechar (X) qualquer
   modal que esteja em loading → aborta operação.
================================================ */
document.addEventListener('DOMContentLoaded', () => {
	// Nota: modalCorrecaoNome é excluído desta lista propositalmente.
	// Ele usa um sistema próprio de Promise (nome-corrector.js) que escuta
	// 'hidden.bs.modal' diretamente — interferir aqui quebraria o fluxo.
	const modaisComOperacao = [
		'modalAdmin',
		'modalLocal',
		'modalSetor',
		'modalRegra',
		'confirmModal',
		'modalAdicionarMusico',
		'modalMapa',
		'modalAviso',
	];

	modaisComOperacao.forEach((modalId) => {
		const modalEl = document.getElementById(modalId);
		if (!modalEl) return;

		// Qualquer fechamento do modal (X, Cancelar, ESC, backdrop)
		// aborta a operação em curso e libera os botões.
		// O evento 'hide.bs.modal' é disparado para TODOS os meios de fechamento,
		// inclusive o botão X (btn-close com data-bs-dismiss="modal").
		modalEl.addEventListener('hide.bs.modal', () => {
			_abortarModal(modalId);
		});
	});
});

/* ================================================
   ENTER KEY — dispara o botão de ação principal
   de qualquer modal aberto (exceto modais de aviso
   que já fecham via data-bs-dismiss).
   Regra: o botão de ação é o ÚLTIMO .btn não-secundário
   do .modal-footer que esteja visível e habilitado.
================================================ */
document.addEventListener('keydown', function (e) {
	if (e.key !== 'Enter') return;

	// Só age se houver um modal visível
	const modalAberto = document.querySelector('.modal.show');
	if (!modalAberto) return;

	// Se o foco está num textarea, deixa o Enter funcionar normalmente
	const focused = document.activeElement;
	if (focused && focused.tagName === 'TEXTAREA') return;

	// Se o foco está num input dentro de um input-group com botão próprio,
	// deixa o onkeydown do input agir
	if (focused && focused.tagName === 'INPUT' && focused.hasAttribute('onkeydown')) return;

	// Encontra o botão de ação principal do modal:
	// último botão no footer que NÃO seja Cancelar / fechar / secundário
	const footer = modalAberto.querySelector('.modal-footer');
	if (!footer) return;

	const botoes = [
		...footer.querySelectorAll(
			'.btn:not([data-bs-dismiss]):not(.btn-secondary):not(.btn-outline-secondary):not(.btn-close)',
		),
	];
	const btnAcao = botoes.filter((b) => !b.disabled && b.offsetParent !== null).pop();

	if (btnAcao) {
		e.preventDefault();
		btnAcao.click();
	}
});
