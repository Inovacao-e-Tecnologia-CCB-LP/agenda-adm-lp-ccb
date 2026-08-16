class TipoReuniaoService {
	entity = 'tipo-reuniao';

	async listar() {
		return await appScriptApi.view(this.entity);
	}

	async criar(payload, password) {
		return await appScriptApi.create(this.entity, payload, password);
	}

	async atualizar(payload, password) {
		return await appScriptApi.update(this.entity, payload, password);
	}

	async excluir(id, password) {
		return await appScriptApi.deleteWithPassword(this.entity, id, password);
	}
}

const tipoReuniaoService = new TipoReuniaoService();
