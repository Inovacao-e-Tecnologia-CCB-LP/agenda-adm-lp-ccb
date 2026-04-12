let senhaDigitada = '';

window.adminAuth = {
	authenticated: false,
	token: null,
};

function guardAdmin(next) {
	if (window.adminAuth?.authenticated) {
		next();
		return;
	}

	abrirModalAviso('Acesso negado', 'Faça login como administrador');
	showMenuInicial();
}

function abrirModalAdmin() {
	document.getElementById('senhaAdmin').value = '';
	document.getElementById('erroSenha').classList.add('d-none');

	// Reseta ícone do olho ao abrir
	const input = document.getElementById('senhaAdmin');
	const icone = document.getElementById('iconeSenha');
	if (input) input.type = 'password';
	if (icone) {
		icone.classList.remove('bi-eye-slash');
		icone.classList.add('bi-eye');
	}

	const modal = new bootstrap.Modal(document.getElementById('modalAdmin'));
	modal.show();
}

async function validarSenhaAdmin() {
	senhaDigitada = document.getElementById('senhaAdmin').value;
	const erro = document.getElementById('erroSenha');

	const btn = document.getElementById('btnEntrarAdmin');
	const textoBtn = document.getElementById('textoBtnAdmin');
	const spinner = document.getElementById('spinnerBtnAdmin');

	erro.classList.add('d-none');

	_travarModal('modalAdmin');
	btn.disabled = true;
	textoBtn.classList.add('d-none');
	spinner.classList.remove('d-none');

	try {
		const signal = _getModalSignal('modalAdmin');
		const r = await authService.auth(senhaDigitada, signal);

		// Cancelado pelo usuário
		if (signal.aborted) return;

		if (!r?.success) {
			mostrarErroCampo('erroSenha', r.error || 'Senha incorreta');
			return;
		}

		window.adminAuth.authenticated = true;
		window.adminAuth.token = r.token;

		bootstrap.Modal.getInstance(document.getElementById('modalAdmin')).hide();
		navigateTo(() => guardAdmin(mostrarAdmin));
	} catch (err) {
		if (err?.name === 'AbortError') return;
		console.error(err);
		mostrarErroCampo('erroSenha', 'Erro ao validar senha');
	} finally {
		_liberarModal('modalAdmin');
		btn.disabled = false;
		textoBtn.classList.remove('d-none');
		spinner.classList.add('d-none');
	}
}
