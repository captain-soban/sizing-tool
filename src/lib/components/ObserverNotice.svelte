<script lang="ts">
	import { Card, CardContent } from './ui/card';
	import { Eye } from '@lucide/svelte';

	interface Props {
		message?: string;
		showIcon?: boolean;
		class?: string;
	}

	let {
		message = 'You are observing this session. Toggle to participant mode to vote.',
		showIcon = true,
		class: className = ''
	}: Props = $props();
</script>

<div class={`observer-notice ${className}`}>
	<Card class="work-area border-orange-200 bg-orange-50">
		<CardContent class="p-4 sm:p-6">
			<div class="flex items-center justify-center gap-2 text-center">
				{#if showIcon}
					<Eye class="h-5 w-5 flex-shrink-0 text-orange-600" />
				{/if}
				<p class="text-sm text-orange-600 sm:text-base">
					{message}
				</p>
			</div>
		</CardContent>
	</Card>
</div>

<style>
	.observer-notice {
		/* Observer notice styling */
		background-color: #fef3c7;
		border-color: #f59e0b;
	}
</style>
