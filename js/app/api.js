class AppScriptApi {
	url =
		'https://script.google.com/macros/s/AKfycbyzCUQyA3isPSovB8k9MXw8GxhCJQm3Lo_d2pjw7BK-zKo5JC5OQRMsyhzvM71F90QY/exec';

	async bootstrap() {
		return await fetch(`${this.url}?action=bootstrap`).then((r) => r.json());
	}

	async auth(password) {
		const r = await fetch(this.url, {
			method: 'POST',
			body: JSON.stringify({
				entity: 'auth',
				action: 'admin',
				password,
			}),
		});

		return await r.json();
	}

	async create(entity, payload, password = null) {
		return await fetch(`${this.url}?action=create&entity=${entity}`, {
			method: 'POST',
			body: JSON.stringify({ ...payload, password }),
		}).then((r) => r.json());
	}

	async view(entity) {
		return await fetch(`${this.url}?action=view&entity=${entity}`).then((r) => r.json());
	}

	async update(entity, updatedData, password) {
		return await fetch(`${this.url}?action=update&entity=${entity}`, {
			method: 'POST',
			body: JSON.stringify({ ...updatedData, password }),
		}).then((r) => r.json());
	}

	async deleteWithToken(entity, id, delete_token) {
		return await fetch(`${this.url}?action=delete&entity=${entity}`, {
			method: 'POST',
			body: JSON.stringify({ id, delete_token }),
		}).then((r) => r.json());
	}

	async deleteWithPassword(entity, id, password) {
		return await fetch(`${this.url}?action=delete&entity=${entity}`, {
			method: 'POST',
			body: JSON.stringify({ id, password }),
		}).then((r) => r.json());
	}
}
