<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { theme, initializeTheme } from '$lib/stores/theme.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	onMount(() => {
		initializeTheme();
	});

	// Watch for theme changes and update document class
	$effect(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.classList.toggle('dark', theme.value === 'dark');
		}
	});
</script>

<div class="min-h-screen">
	<main>
		{@render children()}
	</main>
</div>
