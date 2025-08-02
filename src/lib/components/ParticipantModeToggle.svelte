<script lang="ts">
	import { Button } from './ui/button';
	import { Eye, Vote } from '@lucide/svelte';

	interface Props {
		isObserver: boolean;
		isLoading?: boolean;
		disabled?: boolean;
		onToggle: () => Promise<void> | void;
		size?: 'sm' | 'default' | 'lg';
		variant?: 'default' | 'outline' | 'secondary' | 'ghost';
	}

	let {
		isObserver = false,
		isLoading = false,
		disabled = false,
		onToggle,
		size = 'default',
		variant = 'outline'
	}: Props = $props();

	let isToggling = $state(false);

	async function handleToggle() {
		if (isToggling || disabled) return;

		isToggling = true;
		try {
			await onToggle();
		} catch (error) {
			console.error('[ParticipantModeToggle] Toggle failed:', error);
			// Could emit error event or show notification here
		} finally {
			isToggling = false;
		}
	}

	// Compute button styling based on observer state
	let buttonClass = $derived(() => {
		const baseClasses = isObserver
			? 'border-orange-300 bg-orange-100 text-orange-800 hover:bg-orange-200'
			: 'border-green-300 bg-green-100 text-green-800 hover:bg-green-200';

		if (disabled || isToggling) {
			return `${baseClasses} opacity-50 cursor-not-allowed`;
		}

		return baseClasses;
	});

	let buttonText = $derived(isToggling ? 'Switching...' : isObserver ? 'Observer' : 'Participant');

	let IconComponent = $derived(isObserver ? Eye : Vote);
</script>

<Button
	{variant}
	{size}
	onclick={handleToggle}
	disabled={disabled || isLoading || isToggling}
	class={buttonClass}
	aria-label={`Toggle between participant and observer mode. Currently ${isObserver ? 'observing' : 'participating'}`}
	title={`Click to switch to ${isObserver ? 'participant' : 'observer'} mode`}
>
	<IconComponent class="mr-1 h-4 w-4" />
	{buttonText}
</Button>
