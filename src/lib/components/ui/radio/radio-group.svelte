<script lang="ts">
	import { cn } from '$lib/utils.js';

	type Props = {
		value?: string;
		class?: string;
		disabled?: boolean;
		children: import('svelte').Snippet;
	};

	let { value = $bindable(), class: className, disabled = false, children }: Props = $props();
</script>

<fieldset class={cn('space-y-3', className)} {disabled}>
	{@render children()}
</fieldset>
