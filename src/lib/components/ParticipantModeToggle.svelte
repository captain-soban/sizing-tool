<script lang="ts">
	import { Button } from './ui/button';
	import { Eye, Vote } from '@lucide/svelte';

	interface Props {
		isObserver: boolean;
		isActiveVoting?: boolean;
		isLoading?: boolean;
		disabled?: boolean;
		onToggle: () => Promise<void> | void;
		size?: 'sm' | 'default' | 'lg';
		variant?: 'default' | 'outline' | 'secondary' | 'ghost';
	}

	let {
		isObserver = false,
		isActiveVoting = false,
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

	let buttonText = $derived(
		isToggling
			? 'Switching...'
			: isActiveVoting
				? isObserver
					? 'Join Vote'
					: 'Withdraw'
				: isObserver
					? 'Observer'
					: 'Participant'
	);

	let toggleTitle = $derived(
		isActiveVoting
			? isObserver
				? 'Join this voting round as a participant'
				: 'Withdraw from this voting round and observe'
			: isObserver
				? 'Switch to participant mode for upcoming rounds'
				: 'Switch to observer mode for upcoming rounds'
	);

	let toggleAriaLabel = $derived(
		isActiveVoting
			? isObserver
				? 'Join this voting round as a participant'
				: 'Withdraw from this voting round and observe'
			: `Toggle between participant and observer mode. Currently ${isObserver ? 'observing' : 'participating'}`
	);

	let IconComponent = $derived(isObserver ? Eye : Vote);
</script>

<Button
	{variant}
	{size}
	onclick={handleToggle}
	disabled={disabled || isLoading || isToggling}
	class={buttonClass}
	aria-label={toggleAriaLabel}
	title={toggleTitle}
>
	<IconComponent class="mr-1 h-4 w-4" />
	{buttonText}
</Button>
