/**
 * Agenda ADM Select — Custom Select Profissional
 * Substitui <select class="agenda-select"> por um dropdown estilizado.
 * Mantém o <select> nativo oculto e sincronizado para compatibilidade total com o código existente.
 */

(function () {
	'use strict';

	/* ─── Constantes ─────────────────────────────────────── */
	const SELECTOR = 'select.agenda-select';
	const OPEN_CLASS = 'ds-open';

	/* ─── Utilitários ────────────────────────────────────── */
	function getIcon(id) {
		const icons = {
			regraLocal: 'geo-alt',
			regraTipo: 'tag',
			regraDiaSemana: 'calendar-week',
			regraOrdinal: 'arrow-repeat',
		};
		return icons[id] || 'chevron-expand';
	}

	/* ─── Constrói o custom select ───────────────────────── */
	function buildCustomSelect(nativeSelect) {
		if (nativeSelect._agendaSelectBuilt) return;
		nativeSelect._agendaSelectBuilt = true;

		const id = nativeSelect.id || 'ds-' + Math.random().toString(36).slice(2);
		const isInFloating = nativeSelect.closest('.form-floating');
		const icon = getIcon(nativeSelect.id);

		/* Wrapper externo */
		const wrapper = document.createElement('div');
		wrapper.className = 'agenda-select-wrapper';
		if (isInFloating) wrapper.classList.add('ds-floating');
		wrapper.setAttribute('data-target', id);

		/* Botão trigger */
		const trigger = document.createElement('button');
		trigger.type = 'button';
		trigger.className = 'agenda-select-trigger';
		trigger.setAttribute('aria-haspopup', 'listbox');
		trigger.setAttribute('aria-expanded', 'false');
		trigger.setAttribute('role', 'combobox');
		if (nativeSelect.disabled) trigger.disabled = true;

		const triggerIcon = document.createElement('span');
		triggerIcon.className = 'ds-trigger-icon';
		triggerIcon.innerHTML = `<i class="bi bi-${icon}"></i>`;

		const triggerText = document.createElement('span');
		triggerText.className = 'ds-trigger-text ds-placeholder';
		triggerText.textContent = getPlaceholder(nativeSelect);

		const triggerArrow = document.createElement('span');
		triggerArrow.className = 'ds-trigger-arrow';
		triggerArrow.innerHTML = `<i class="bi bi-chevron-down"></i>`;

		trigger.appendChild(triggerIcon);
		trigger.appendChild(triggerText);
		trigger.appendChild(triggerArrow);

		/* Dropdown */
		const dropdown = document.createElement('div');
		dropdown.className = 'agenda-select-dropdown';
		dropdown.setAttribute('role', 'listbox');

		/* Lista de opções */
		const optList = document.createElement('ul');
		optList.className = 'ds-options-list';
		renderOptions(optList, nativeSelect);

		dropdown.appendChild(optList);
		wrapper.appendChild(trigger);
		wrapper.appendChild(dropdown);

		/* Insere após o select nativo e oculta o nativo */
		nativeSelect.style.display = 'none';
		nativeSelect.parentNode.insertBefore(wrapper, nativeSelect.nextSibling);

		/* Atualiza display inicial se já houver valor */
		updateTriggerDisplay(trigger, triggerText, nativeSelect);

		/* ─── Eventos ─────────────────────────────────────── */
		trigger.addEventListener('click', (e) => {
			e.stopPropagation();
			if (trigger.disabled) return;
			const isOpen = wrapper.classList.contains(OPEN_CLASS);
			closeAll();
			if (!isOpen) openDropdown(wrapper, trigger, dropdown);
		});

		optList.addEventListener('click', (e) => {
			const li = e.target.closest('li[data-value]');
			if (!li) return;
			selectOption(li, nativeSelect, trigger, triggerText, wrapper, optList);
		});

		/* Keyboard navigation */
		trigger.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				trigger.click();
			} else if (e.key === 'ArrowDown') {
				e.preventDefault();
				openDropdown(wrapper, trigger, dropdown);
				focusFirstOption(optList);
			} else if (e.key === 'Escape') {
				closeAll();
				trigger.focus();
			}
		});

		optList.addEventListener('keydown', (e) => {
			const focused = optList.querySelector('li:focus');
			if (!focused) return;
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				const next = focused.nextElementSibling;
				if (next && next.dataset.value !== undefined) next.focus();
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				const prev = focused.previousElementSibling;
				if (prev && prev.dataset.value !== undefined) prev.focus();
				else trigger.focus();
			} else if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				focused.click();
			} else if (e.key === 'Escape') {
				closeAll();
				trigger.focus();
			}
		});

		/* Observer: re-renderiza quando o nativeSelect muda (via JS) */
		observeSelectChanges(nativeSelect, trigger, triggerText, optList);
	}

	/* ─── Observa mudanças no select nativo ──────────────── */
	function observeSelectChanges(nativeSelect, trigger, triggerText, optList) {
		// Intercepta .value = "x" via Object.defineProperty
		const descriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
		const originalSet = descriptor.set;

		Object.defineProperty(nativeSelect, 'value', {
			get: descriptor.get,
			set(newValue) {
				originalSet.call(this, newValue);
				updateTriggerDisplay(trigger, triggerText, nativeSelect);
				syncSelected(optList, newValue);
			},
			configurable: true,
		});

		// Intercepta .disabled = true/false
		const disabledDescriptor =
			Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'disabled') ||
			Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'disabled');
		if (disabledDescriptor) {
			Object.defineProperty(nativeSelect, 'disabled', {
				get: disabledDescriptor.get,
				set(val) {
					disabledDescriptor.set.call(this, val);
					trigger.disabled = val;
					trigger.classList.toggle('ds-disabled', val);
				},
				configurable: true,
			});
		}

		// Observer para mudanças no innerHTML (opções dinâmicas)
		const observer = new MutationObserver(() => {
			renderOptions(optList, nativeSelect);
			updateTriggerDisplay(trigger, triggerText, nativeSelect);
		});
		observer.observe(nativeSelect, { childList: true, subtree: true, characterData: true });
	}

	/* ─── Renderiza opções no dropdown ───────────────────── */
	function renderOptions(optList, nativeSelect) {
		optList.innerHTML = '';
		Array.from(nativeSelect.options).forEach((opt) => {
			if (opt.value === '' && opt.disabled) return; // pula placeholder oculto
			const li = document.createElement('li');
			li.setAttribute('role', 'option');
			li.setAttribute('tabindex', '-1');
			li.dataset.value = opt.value;
			li.textContent = opt.text;
			if (opt.disabled) {
				li.classList.add('ds-option-disabled');
				li.setAttribute('aria-disabled', 'true');
			}
			if (opt.selected && opt.value !== '') {
				li.classList.add('ds-selected');
				li.setAttribute('aria-selected', 'true');
			}
			optList.appendChild(li);
		});
	}

	/* ─── Retorna texto placeholder ──────────────────────── */
	function getPlaceholder(nativeSelect) {
		const first = nativeSelect.options[0];
		if (first && first.value === '') return first.text;
		return 'Selecione...';
	}

	/* ─── Atualiza texto do trigger ──────────────────────── */
	function updateTriggerDisplay(trigger, triggerText, nativeSelect) {
		const selected = nativeSelect.options[nativeSelect.selectedIndex];
		if (selected && selected.value !== '') {
			triggerText.textContent = selected.text;
			triggerText.classList.remove('ds-placeholder');
		} else {
			triggerText.textContent = getPlaceholder(nativeSelect);
			triggerText.classList.add('ds-placeholder');
		}
	}

	/* ─── Sincroniza seleção visual na lista ─────────────── */
	function syncSelected(optList, value) {
		optList.querySelectorAll('li').forEach((li) => {
			const sel = li.dataset.value === String(value);
			li.classList.toggle('ds-selected', sel);
			li.setAttribute('aria-selected', sel ? 'true' : 'false');
		});
	}

	/* ─── Seleciona uma opção ────────────────────────────── */
	function selectOption(li, nativeSelect, trigger, triggerText, wrapper, optList) {
		if (li.classList.contains('ds-option-disabled')) return;
		const value = li.dataset.value;

		// Atualiza nativo
		nativeSelect.value = value;
		// Dispara evento change
		nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));

		// Atualiza visual
		optList.querySelectorAll('li').forEach((el) => {
			el.classList.remove('ds-selected');
			el.setAttribute('aria-selected', 'false');
		});
		li.classList.add('ds-selected');
		li.setAttribute('aria-selected', 'true');
		updateTriggerDisplay(trigger, triggerText, nativeSelect);

		closeAll();
		trigger.focus();
	}

	/* ─── Abre dropdown ──────────────────────────────────── */
	function openDropdown(wrapper, trigger, dropdown) {
		wrapper.classList.add(OPEN_CLASS);
		trigger.setAttribute('aria-expanded', 'true');

		// Posiciona acima se não houver espaço abaixo
		requestAnimationFrame(() => {
			const rect = dropdown.getBoundingClientRect();
			if (rect.bottom > window.innerHeight - 20) {
				wrapper.classList.add('ds-dropup');
			} else {
				wrapper.classList.remove('ds-dropup');
			}
		});
	}

	/* ─── Foca primeira opção ────────────────────────────── */
	function focusFirstOption(optList) {
		const first = optList.querySelector('li:not(.ds-option-disabled)');
		if (first) first.focus();
	}

	/* ─── Fecha todos os dropdowns ───────────────────────── */
	function closeAll() {
		document.querySelectorAll('.agenda-select-wrapper.' + OPEN_CLASS).forEach((w) => {
			w.classList.remove(OPEN_CLASS);
			w.classList.remove('ds-dropup');
			const trigger = w.querySelector('.agenda-select-trigger');
			if (trigger) trigger.setAttribute('aria-expanded', 'false');
		});
	}

	/* ─── Inicialização ──────────────────────────────────── */
	function init() {
		document.querySelectorAll(SELECTOR).forEach(buildCustomSelect);
	}

	// Fecha ao clicar fora
	document.addEventListener('click', (e) => {
		if (!e.target.closest('.agenda-select-wrapper')) closeAll();
	});

	// Fecha ao pressionar Escape global
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') closeAll();
	});

	// API pública para re-inicializar (ex: após carregamento dinâmico de componentes)
	window.agendaSelect = { init, buildCustomSelect };

	// Init no DOMContentLoaded
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
