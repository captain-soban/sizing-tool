<script lang="ts">
	import type { HTMLLabelAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils.js';

	type Props = WithElementRef<
		HTMLLabelAttributes & { children?: import('svelte').Snippet },
		HTMLLabelElement
	>;

	let { ref = $bindable(null), class: className, children, ...restProps }: Props = $props();
</script>

<label
	bind:this={ref}
	class={cn(
		'text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</label>
