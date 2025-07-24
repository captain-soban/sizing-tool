import { browser } from '$app/environment';
import { localStore } from '../localStore.svelte';

export const theme = localStore('theme', 'light');

export function toggleTheme() {
	theme.value = theme.value === 'light' ? 'dark' : 'light';
}

export function initializeTheme() {
	if (browser) {
		// Apply initial theme
		document.documentElement.classList.toggle('dark', theme.value === 'dark');

		// Watch for theme changes and update document class
		// Note: $effect should be used in component context, not in a utility function
		// We'll handle theme watching in the component that calls this
	}
}
