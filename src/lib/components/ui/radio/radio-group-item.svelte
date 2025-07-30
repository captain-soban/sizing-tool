<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Radio } from './index.js';

	type Props = {
		value: string;
		id?: string;
		disabled?: boolean;
		class?: string;
		groupValue?: string;
		onValueChange?: (value: string) => void;
		children: import('svelte').Snippet;
	};

	let {
		value,
		id = value,
		disabled = false,
		class: className,
		groupValue,
		onValueChange,
		children
	}: Props = $props();

	let checked = $derived(groupValue === value);

	function handleChange() {
		if (!disabled) {
			onValueChange?.(value);
		}
	}
</script>

<div class={cn('flex items-center space-x-3', className)}>
	<Radio
		{id}
		{value}
		{checked}
		{disabled}
		onclick={handleChange}
		class="text-poker-blue focus:ring-poker-blue"
	/>
	<label for={id} class="flex-1 cursor-pointer">
		{@render children()}
	</label>
</div>
