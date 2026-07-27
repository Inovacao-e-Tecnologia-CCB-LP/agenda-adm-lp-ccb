class LocalStorageService {
	LS_KEY = 'inscricoes_autorizadas';
	LS_AGENDAMENTOS_KEY = 'agendamentos_autorizados';
	LS_NOME_KEY = 'agenda_ultimo_nome';

	buscarAutorizacao(id) {
		try {
			const lista = JSON.parse(localStorage.getItem(this.LS_KEY)) || [];
			return lista.find((item) => String(item.id) === String(id)) || null;
		} catch (e) {
			console.error('Erro ao ler autorizacoes do localStorage:', e);
			return null;
		}
	}

	salvarAutorizacao(id, token) {
		try {
			const lista = JSON.parse(localStorage.getItem(this.LS_KEY)) || [];
			const novaLista = lista.filter((item) => String(item.id) !== String(id));
			novaLista.push({ id, token });
			localStorage.setItem(this.LS_KEY, JSON.stringify(novaLista));
		} catch (e) {
			console.error('Erro ao salvar autorizacao:', e);
		}
	}

	removerAutorizacao(id) {
		try {
			let lista = JSON.parse(localStorage.getItem(this.LS_KEY)) || [];
			lista = lista.filter((item) => String(item.id) !== String(id));
			localStorage.setItem(this.LS_KEY, JSON.stringify(lista));
		} catch (e) {
			console.error('Erro ao remover autorizacao:', e);
		}
	}

	// ── Agendamentos ──────────────────────────────────────────────────────────

	buscarAutorizacaoAgendamento(id) {
		try {
			const lista = JSON.parse(localStorage.getItem(this.LS_AGENDAMENTOS_KEY)) || [];
			return lista.find((item) => String(item.id) === String(id)) || null;
		} catch (e) {
			console.error('Erro ao ler autorizacoes de agendamentos do localStorage:', e);
			return null;
		}
	}

	salvarAutorizacaoAgendamento(id, token) {
		try {
			const lista = JSON.parse(localStorage.getItem(this.LS_AGENDAMENTOS_KEY)) || [];
			const novaLista = lista.filter((item) => String(item.id) !== String(id));
			novaLista.push({ id, token });
			localStorage.setItem(this.LS_AGENDAMENTOS_KEY, JSON.stringify(novaLista));
		} catch (e) {
			console.error('Erro ao salvar autorizacao de agendamento:', e);
		}
	}

	removerAutorizacaoAgendamento(id) {
		try {
			let lista = JSON.parse(localStorage.getItem(this.LS_AGENDAMENTOS_KEY)) || [];
			lista = lista.filter((item) => String(item.id) !== String(id));
			localStorage.setItem(this.LS_AGENDAMENTOS_KEY, JSON.stringify(lista));
		} catch (e) {
			console.error('Erro ao remover autorizacao de agendamento:', e);
		}
	}

	// ── Nome do usuario ──────────────────────────────────────────────────────

	/**
	 * Converte cada palavra do nome para ter a primeira letra maiuscula.
	 * Ex: "lucas martins" -> "Lucas Martins"
	 */
	capitalizarNome(nome) {
		if (!nome) return '';
		return nome
			.trim()
			.split(/\s+/)
			.map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase())
			.join(' ');
	}

	salvarNome(nome) {
		try {
			const nomeCapitalizado = this.capitalizarNome(nome);
			localStorage.setItem(this.LS_NOME_KEY, nomeCapitalizado);
			return nomeCapitalizado;
		} catch (e) {
			console.error('Erro ao salvar nome:', e);
			return nome;
		}
	}

	buscarNome() {
		try {
			return localStorage.getItem(this.LS_NOME_KEY) || null;
		} catch (e) {
			return null;
		}
	}
}

const localStorageService = new LocalStorageService();
