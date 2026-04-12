async function mostrarAdmin() {
	setTitle('Área Administrativa');
	backButton.style.display = 'block';
	conteudo.innerHTML = Ui.PainelAdmin();
	window.adminAuth.authenticated = true;
}

function irParaTelaLocais() {
	navigateTo(() => guardAdmin(abrirTelaLocais));
}

function irParaTelaSetores() {
	navigateTo(() => guardAdmin(abrirTelaSetores));
}

function irParaTelaRegrasDatas() {
	navigateTo(() => guardAdmin(abrirTelaRegrasDatas));
}

function irParaTelaAgendamentos() {
	navigateTo(() => guardAdmin(abrirTelaAgendamentos));
}
