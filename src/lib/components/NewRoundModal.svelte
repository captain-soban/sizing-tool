<script lang="ts">
	import { Button } from './ui/button';
	import { Input } from './ui/input';
	import { Label } from './ui/label';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		onConfirm: (description: string) => Promise<void>;
		isLoading?: boolean;
	}

	let { isOpen = false, onClose, onConfirm, isLoading = false }: Props = $props();

	let description = $state('');
	let error = $state('');

	// Reset form when modal opens
	$effect(() => {
		if (isOpen) {
			description = '';
			error = '';
		}
	});

	async function handleSubmit(e: Event) {
		if (e) e.preventDefault();

		try {
			error = '';
			await onConfirm(description.trim());
			onClose();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to start new round';
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !isLoading) {
			e.preventDefault();
			handleSubmit(e as Event);
		} else if (e.key === 'Escape') {
			e.preventDefault();
			onClose();
		}
	}
</script>

{#if isOpen}
	<!-- Modal Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={(e) => e.target === e.currentTarget && onClose()}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		role="dialog"
		aria-labelledby="new-round-title"
		aria-modal="true"
		tabindex="-1"
	>
		<!-- Modal Content -->
		<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" role="document">
			<div class="mb-4">
				<h2 id="new-round-title" class="text-lg font-semibold text-gray-900">Start New Round</h2>
				<p class="mt-1 text-sm text-gray-600">
					Enter an optional description for the next voting round
				</p>
			</div>

			<form onsubmit={handleSubmit}>
				<div class="mb-4">
					<Label for="round-description" class="text-sm font-medium text-gray-700">
						Round Description (Optional)
					</Label>
					<Input
						id="round-description"
						bind:value={description}
						onkeydown={handleKeydown}
						placeholder="e.g., Epic 2: User Authentication"
						class="mt-1"
						disabled={isLoading}
						autofocus
					/>
					{#if error}
						<p class="mt-1 text-sm text-red-600">{error}</p>
					{/if}
				</div>

				<div class="flex justify-end gap-3">
					<Button type="button" variant="outline" onclick={onClose} disabled={isLoading}>
						Cancel
					</Button>
					<Button type="submit" disabled={isLoading} class="bg-blue-600 hover:bg-blue-700">
						{#if isLoading}
							Starting...
						{:else}
							Start Round
						{/if}
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
