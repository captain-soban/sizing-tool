<script lang="ts">
	import { Button } from './ui/button';
	import { Input } from './ui/input';
	import { Label } from './ui/label';
	import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

	interface Props {
		isOpen: boolean;
		sessionCode: string;
		sessionTitle?: string;
		onJoin: (playerName: string) => Promise<void>;
		onCancel: () => void;
		isLoading?: boolean;
		error?: string;
	}

	let {
		isOpen = false,
		sessionCode,
		sessionTitle,
		onJoin,
		onCancel,
		isLoading = false,
		error = ''
	}: Props = $props();

	let playerName = $state('');
	let validationError = $state('');

	// Reset form when modal opens
	$effect(() => {
		if (isOpen) {
			playerName = '';
			validationError = '';
		}
	});

	async function handleSubmit() {
		const trimmedName = playerName.trim();

		if (!trimmedName) {
			validationError = 'Please enter your name';
			return;
		}

		if (trimmedName.length < 2) {
			validationError = 'Name must be at least 2 characters';
			return;
		}

		if (trimmedName.length > 50) {
			validationError = 'Name must be less than 50 characters';
			return;
		}

		try {
			validationError = '';
			await onJoin(trimmedName);
		} catch {
			// Error handling is done by parent component
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !isLoading) {
			e.preventDefault();
			handleSubmit();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			onCancel();
		}
	}
</script>

{#if isOpen}
	<!-- Modal Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		role="dialog"
		aria-labelledby="shareable-link-title"
		aria-modal="true"
	>
		<!-- Modal Content -->
		<Card class="work-area w-full max-w-md">
			<CardHeader class="pb-4">
				<CardTitle id="shareable-link-title" class="text-lg font-semibold">
					Join Planning Session
				</CardTitle>
				<div class="space-y-1 text-sm text-gray-600">
					<p>You've been invited to join:</p>
					<p class="font-medium text-gray-900">
						{sessionTitle || `Session ${sessionCode}`}
					</p>
					<p class="text-xs text-gray-500">Code: {sessionCode}</p>
				</div>
			</CardHeader>

			<CardContent class="space-y-4">
				<div class="space-y-2">
					<Label for="player-name" class="text-sm font-medium">Your Name</Label>
					<Input
						id="player-name"
						bind:value={playerName}
						onkeydown={handleKeydown}
						placeholder="Enter your name"
						disabled={isLoading}
						autofocus
					/>
					{#if validationError}
						<p class="text-sm text-red-600">{validationError}</p>
					{/if}
					{#if error}
						<p class="text-sm text-red-600">{error}</p>
					{/if}
				</div>

				<div class="flex gap-3 pt-4">
					<Button
						type="button"
						variant="outline"
						onclick={onCancel}
						disabled={isLoading}
						class="flex-1"
					>
						Cancel
					</Button>
					<Button
						onclick={handleSubmit}
						disabled={isLoading || !playerName.trim()}
						class="flex-1 bg-blue-600 hover:bg-blue-700"
					>
						{#if isLoading}
							Joining...
						{:else}
							Join Session
						{/if}
					</Button>
				</div>
			</CardContent>
		</Card>
	</div>
{/if}
