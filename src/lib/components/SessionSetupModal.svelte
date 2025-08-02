<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { defaultStoryPointScales } from '$lib/stores/session';

	interface Props {
		show: boolean;
		playerName: string;
		onCancel: () => void;
		onConfirm: (title: string, scale: string[], roundDescription: string) => void;
	}

	let { show = $bindable(), playerName, onCancel, onConfirm }: Props = $props();

	let sessionTitle = $state('');
	let roundDescription = $state('');
	let selectedScale = $state('fibonacci_0_8');

	// Generate scale options from the same source as settings
	const scaleOptions = $derived(
		Object.entries(defaultStoryPointScales).map(([key, scale]) => ({
			value: key,
			label:
				key
					.replace('_', ' ')
					.replace('fibonacci', 'Fibonacci')
					.replace('tshirt', 'T-Shirt')
					.split(' ')
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(' ') + ` (${scale.join(', ')})`,
			scale
		}))
	);

	const currentScale = $derived(
		defaultStoryPointScales[selectedScale as keyof typeof defaultStoryPointScales] ||
			defaultStoryPointScales.fibonacci_0_8
	);

	function handleSubmit() {
		// Use default values if fields are empty
		const finalSessionTitle = sessionTitle.trim() || 'Session 1';
		const finalRoundDescription = roundDescription.trim() || 'Round 1';

		onConfirm(finalSessionTitle, currentScale, finalRoundDescription);
		handleClose();
	}

	function handleClose() {
		show = false;
		sessionTitle = '';
		roundDescription = '';
		selectedScale = 'fibonacci_0_8';
		onCancel();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleClose();
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if show}
	<!-- Modal backdrop -->
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
	>
		<!-- Modal content -->
		<div
			class="max-h-screen w-full max-w-md overflow-y-auto rounded-lg bg-white shadow-xl"
			onclick={(e) => e.stopPropagation()}
		>
			<Card class="border-0 shadow-none">
				<CardHeader class="pb-4">
					<div class="flex items-center justify-between">
						<CardTitle id="modal-title" class="text-lg font-semibold">Session Setup</CardTitle>
						<button
							type="button"
							onclick={handleClose}
							class="text-gray-400 transition-colors hover:text-gray-600"
							aria-label="Close modal"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>
					<p class="text-sm text-gray-600">
						Configure your planning session for <strong>{playerName}</strong>
					</p>
				</CardHeader>

				<CardContent class="space-y-6">
					<div class="space-y-2">
						<label for="modal-sessionTitle" class="text-sm font-medium">
							Session Title <span class="text-xs text-gray-500">(optional)</span>
						</label>
						<Input
							id="modal-sessionTitle"
							type="text"
							bind:value={sessionTitle}
							placeholder="Session 1 (default)"
							autofocus
						/>
						<p class="text-xs text-gray-500">Leave blank to use "Session 1"</p>
					</div>

					<div class="space-y-2">
						<label for="modal-roundDescription" class="text-sm font-medium">
							First Round Description <span class="text-xs text-gray-500">(optional)</span>
						</label>
						<Input
							id="modal-roundDescription"
							type="text"
							bind:value={roundDescription}
							placeholder="Round 1 (default)"
						/>
						<p class="text-xs text-gray-500">
							Describe what you'll be estimating (e.g. "User Authentication", "Payment System")
						</p>
					</div>

					<div class="space-y-2">
						<label for="modal-scaleSelect" class="text-sm font-medium">Story Point Scale</label>
						<select
							id="modal-scaleSelect"
							bind:value={selectedScale}
							class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#each scaleOptions as option (option.value)}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>

					<!-- Scale preview -->
					<div class="space-y-2">
						<label class="text-sm font-medium text-gray-600">Preview</label>
						<div class="flex flex-wrap gap-2">
							{#each currentScale as point (point)}
								<span
									class="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
								>
									{point}
								</span>
							{/each}
						</div>
					</div>

					<div class="flex gap-3 pt-4">
						<Button onclick={handleClose} variant="outline" class="flex-1">Cancel</Button>
						<Button onclick={handleSubmit} class="bg-poker-blue hover:bg-poker-blue/90 flex-1">
							Create Session
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	</div>
{/if}
