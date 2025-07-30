<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils.js';

	type Props = WithElementRef<HTMLInputAttributes & { checked?: boolean }, HTMLInputElement>;

	let {
		ref = $bindable(null),
		checked = false,
		value,
		class: className,
		...restProps
	}: Props = $props();
</script>

<input
	bind:this={ref}
	type="radio"
	{checked}
	{value}
	class={cn(
		'text-primary focus:ring-primary h-4 w-4 border-gray-300 transition-colors',
		'focus:ring-2 focus:ring-offset-2',
		'disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	{...restProps}
/>
