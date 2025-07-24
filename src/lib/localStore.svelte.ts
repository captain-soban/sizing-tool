// localStorage wrapper for Svelte 5 runes
export function localStore<T>(key: string, initial: T) {
	// Get initial value from localStorage
	function getStoredValue(): T {
		if (typeof localStorage === 'undefined') return initial;

		try {
			const stored = localStorage.getItem(key);
			return stored ? JSON.parse(stored) : initial;
		} catch {
			return initial;
		}
	}

	// Create reactive state
	let value = $state(getStoredValue());

	// Create reactive wrapper with getter/setter
	const store = {
		get value() {
			return value;
		},
		set value(newValue: T) {
			value = newValue;
			// Save to localStorage
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem(key, JSON.stringify(newValue));
			}
		},
		// Legacy store interface for compatibility
		subscribe(fn: (value: T) => void) {
			// Initial call
			fn(value);

			// For Svelte 5, we rely on reactive state changes
			// The component using this store should use $effect to watch changes
			// Return unsubscribe function
			return () => {};
		},
		update(fn: (value: T) => T) {
			this.value = fn(value);
		}
	};

	return store;
}
