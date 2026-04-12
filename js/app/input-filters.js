/**
 * INPUT FILTERS
 * Restringe caracteres permitidos por tipo de campo via data-input-filter="tipo"
 *
 * Tipos disponíveis:
 *   nome       — Letras (incluindo acentuadas), espaço, hífen, apóstrofo
 *   text-especial — Letras, números, espaço e: / - , ( ) * . ' "
 *   endereco   — Letras, números, espaço e: / - , . ( ) # ° ª º
 *   numero     — Apenas dígitos 0-9
 *   biblia     — Letras, números, espaço e: : - , . ( )
 */

(function () {
	// ── Regex por tipo ──────────────────────────────────────────────────────
	const FILTROS = {
		// Nomes de pessoas: letras unicode + espaço + hífen + apóstrofo
		nome: /^[A-Za-zÀ-ÖØ-öø-ÿ\s\-']+$/,

		// Nomes de locais / setores: letras, números, espaço e caracteres especiais permitidos
		'text-especial': /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s\/\-,\(\)\*\.'"\u00B0\u00AA\u00BA]+$/,

		// Endereços: inclui #, °, ª, º além dos acima
		endereco: /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s\/\-,\.\(\)#\u00B0\u00AA\u00BA]+$/,

		// Apenas dígitos
		numero: /^[0-9]+$/,

		// Referências bíblicas: letras, números, espaço, : - , . ( )
		biblia: /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s:\-,\.\(\)–\u2013\u2014]+$/,
	};

	// ── Mensagens de dica ───────────────────────────────────────────────────
	const DICAS = {
		nome: 'Apenas letras e espaço',
		'text-especial': 'Letras, números e: / - , ( ) * . \' "',
		endereco: 'Letras, números e: / - , . ( ) #',
		numero: 'Apenas números',
		biblia: 'Letras, números e: : - , . ( )',
	};

	/**
	 * Filtra o valor de um input removendo caracteres não permitidos.
	 * Retorna true se algum caractere foi bloqueado (para feedback visual).
	 */
	function aplicarFiltro(input) {
		const tipo = input.getAttribute('data-input-filter');
		if (!tipo || !FILTROS[tipo]) return false;

		const regex = FILTROS[tipo];
		const valorOriginal = input.value;

		// Remove caractere a caractere os que não batem
		const valorFiltrado = Array.from(valorOriginal)
			.filter((ch) => regex.test(ch))
			.join('');

		if (valorFiltrado !== valorOriginal) {
			// Preserva posição do cursor
			const pos = input.selectionStart - (valorOriginal.length - valorFiltrado.length);
			input.value = valorFiltrado;
			try {
				input.setSelectionRange(Math.max(0, pos), Math.max(0, pos));
			} catch (_) {}
			return true; // caractere bloqueado
		}
		return false;
	}

	/**
	 * Mostra feedback visual rápido quando caractere é bloqueado.
	 */
	function feedbackBloqueio(input) {
		input.classList.add('input-bloqueado');
		setTimeout(() => input.classList.remove('input-bloqueado'), 350);
	}

	/**
	 * Aplica os listeners em todos os inputs com data-input-filter presentes
	 * num container (padrão: document).
	 */
	function inicializarFiltros(container) {
		container = container || document;
		const inputs = container.querySelectorAll('[data-input-filter]');

		inputs.forEach(function (input) {
			// Evita duplicar listeners
			if (input._filtroAtivo) return;
			input._filtroAtivo = true;

			// Bloqueia na digitação (keydown para Enter/Tab não disparar filtro)
			input.addEventListener('input', function () {
				const bloqueou = aplicarFiltro(this);
				if (bloqueou) feedbackBloqueio(this);
			});

			// Também filtra em colar (paste)
			input.addEventListener('paste', function () {
				// Precisa aguardar o valor ser colado
				setTimeout(() => {
					const bloqueou = aplicarFiltro(this);
					if (bloqueou) feedbackBloqueio(this);
				}, 0);
			});

			// Tooltip de dica (title) se ainda não tiver
			const tipo = input.getAttribute('data-input-filter');
			if (!input.title && DICAS[tipo]) {
				input.title = DICAS[tipo];
			}
		});
	}

	// ── Exposição global ────────────────────────────────────────────────────
	window.InputFilters = { inicializar: inicializarFiltros };

	// ── Inicializa ao carregar o DOM ────────────────────────────────────────
	document.addEventListener('DOMContentLoaded', function () {
		inicializarFiltros(document);
	});

	// ── Re-inicializa quando Bootstrap abre qualquer modal ──────────────────
	// (para campos gerados dinamicamente dentro de modais)
	document.addEventListener('shown.bs.modal', function (e) {
		inicializarFiltros(e.target);
	});

	// ── Observer para campos injetados via innerHTML (componentes dinâmicos) ─
	const observer = new MutationObserver(function (mutations) {
		mutations.forEach(function (mutation) {
			mutation.addedNodes.forEach(function (node) {
				if (node.nodeType !== 1) return;
				// Verifica o próprio nó
				if (node.hasAttribute && node.hasAttribute('data-input-filter')) {
					inicializarFiltros(node.parentElement);
				}
				// Verifica filhos
				if (node.querySelectorAll) {
					const found = node.querySelectorAll('[data-input-filter]');
					if (found.length) inicializarFiltros(node);
				}
			});
		});
	});

	observer.observe(document.body, { childList: true, subtree: true });
})();

// ── Função global para toggle de senha ─────────────────────────────────────
function toggleVerSenha() {
	const input = document.getElementById('senhaAdmin');
	const icone = document.getElementById('iconeSenha');
	if (!input) return;

	if (input.type === 'password') {
		input.type = 'text';
		icone.classList.replace('bi-eye', 'bi-eye-slash');
	} else {
		input.type = 'password';
		icone.classList.replace('bi-eye-slash', 'bi-eye');
	}
	input.focus();
}
