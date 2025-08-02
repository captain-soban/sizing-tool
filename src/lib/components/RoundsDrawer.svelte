<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { X } from '@lucide/svelte';

	interface Round {
		roundNumber: number;
		description: string;
		votes: Record<string, string>;
		voteAverage: string;
		finalEstimate: string;
		timestamp: number;
	}

	interface Props {
		show: boolean;
		rounds: Round[];
		onClose: () => void;
	}

	let { show, rounds, onClose }: Props = $props();

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}
</script>

{#if show}
	<div
		class="fixed inset-0 z-50 flex"
		role="dialog"
		aria-modal="true"
		aria-labelledby="rounds-drawer-title"
		onkeydown={handleKeydown}
		tabindex="-1"
	>
		<!-- Backdrop -->
		<button
			type="button"
			class="fixed inset-0 bg-black/50"
			onclick={handleBackdropClick}
			aria-label="Close rounds history"
		></button>

		<!-- Drawer Panel -->
		<div class="fixed top-0 right-0 z-60 h-full w-80 overflow-y-auto bg-white shadow-xl">
			<div class="p-4">
				<div class="mb-4 flex items-center justify-between">
					<h3 id="rounds-drawer-title" class="text-lg font-semibold text-gray-900">
						Rounds History
					</h3>
					<Button variant="outline" size="sm" onclick={onClose} aria-label="Close rounds history">
						<X class="h-4 w-4" />
					</Button>
				</div>

				<div class="space-y-4">
					{#each rounds as round (round.roundNumber)}
						<Card class="border">
							<CardContent class="p-4">
								<div class="mb-2 flex items-center justify-between">
									<div class="flex items-center gap-2">
										<span class="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
											Round {round.roundNumber}
										</span>
										<h4 class="font-medium text-gray-900">{round.description}</h4>
									</div>
									<span class="text-xs text-gray-500">
										{new Date(round.timestamp).toLocaleDateString()}
									</span>
								</div>

								<div class="space-y-2">
									<div class="flex justify-between text-sm">
										<span class="text-gray-600">Average:</span>
										<span class="font-medium">{round.voteAverage}</span>
									</div>
									<div class="flex justify-between text-sm">
										<span class="text-gray-600">Final:</span>
										<span class="font-medium">{round.finalEstimate}</span>
									</div>
								</div>

								<div class="mt-3 border-t pt-3">
									<p class="mb-2 text-xs text-gray-500">Votes:</p>
									<div class="flex flex-wrap gap-1">
										{#each Object.entries(round.votes) as [name, vote] (name)}
											<span
												class="inline-flex items-center rounded bg-blue-100 px-2 py-1 text-xs text-blue-800"
											>
												{name}: {vote}
											</span>
										{/each}
									</div>
								</div>
							</CardContent>
						</Card>
					{/each}

					{#if rounds.length === 0}
						<div class="py-8 text-center text-gray-500">
							<p>No completed rounds yet</p>
							<p class="mt-1 text-xs">Complete a voting round to see history here</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
