class UiComponents {
	constructor() {
		this.getComponents();
	}

	async getComponents() {
		await fetch(`js/ui/components/painel-admin.html`)
			.then((response) => response.text())
			.then((text) => {
				this.painelAdmin = text;
			});
		await fetch(`js/ui/components/painel-setores.html`)
			.then((response) => response.text())
			.then((text) => {
				this.painelSetores = text;
			});
		await fetch(`js/ui/components/painel-locais.html`)
			.then((response) => response.text())
			.then((text) => {
				this.painelLocais = text;
			});
		await fetch(`js/ui/components/painel-regras-datas.html`)
			.then((response) => response.text())
			.then((text) => {
				this.painelRegrasDatas = text;
			});
		await fetch(`js/ui/components/painel-agendamentos.html`)
			.then((response) => response.text())
			.then((text) => {
				this.painelAgendamentos = text;
			});
		await fetch(`js/ui/components/confirmar-presenca.html`)
			.then((response) => response.text())
			.then((text) => {
				this.confirmarPresenca = text;
			});
		await fetch(`js/ui/components/home.html`)
			.then((response) => response.text())
			.then((text) => {
				this.home = text;
			});
	}

	Home() {
		return this.home;
	}

	ConfirmarPresenca() {
		return this.confirmarPresenca;
	}

	PainelAdmin() {
		return this.painelAdmin;
	}

	PainelSetores() {
		return this.painelSetores;
	}

	PainelLocais() {
		return this.painelLocais;
	}

	PainelRegrasDatas() {
		return this.painelRegrasDatas;
	}

	PainelAgendamentos() {
		return this.painelAgendamentos;
	}
}
