<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { X } from '@lucide/svelte';
	import type { AdminSessionData } from '$lib/api/adminClient';

	interface Props {
		session: AdminSessionData | null;
		show: boolean;
		onClose: () => void;
	}

	let { session, show, onClose }: Props = $props();

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleString();
	}

	function formatRelativeTime(dateString: string): string {
		const now = new Date();
		const date = new Date(dateString);
		const diffMs = now.getTime() - date.getTime();
		const diffMinutes = Math.floor(diffMs / (1000 * 60));
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffMinutes < 1) return 'Just now';
		if (diffMinutes < 60) return `${diffMinutes}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString();
	}

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

{#if show && session}
	<div
		class="fixed inset-0 z-50 overflow-y-auto"
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		onkeydown={handleKeydown}
		tabindex="-1"
	>
		<div class="flex min-h-screen items-center justify-center p-4">
			<button
				type="button"
				class="bg-opacity-50 fixed inset-0 bg-black"
				onclick={handleBackdropClick}
				onkeydown={(e) => e.key === 'Escape' && handleBackdropClick(e as unknown as MouseEvent)}
				aria-label="Close modal"
			></button>
			<div class="relative w-full max-w-2xl">
				<Card class="bg-white">
					<CardHeader>
						<div class="flex items-center justify-between">
							<CardTitle id="modal-title">Session Details - {session.sessionCode}</CardTitle>
							<Button variant="outline" size="sm" onclick={onClose} aria-label="Close modal">
								<X class="h-4 w-4" />
							</Button>
						</div>
					</CardHeader>
					<CardContent class="space-y-6">
						<div class="grid grid-cols-2 gap-4">
							<div>
								<h4 class="font-medium text-gray-900">Session Title</h4>
								<p class="text-sm text-gray-600">{session.title}</p>
							</div>
							<div>
								<h4 class="font-medium text-gray-900">Session Code</h4>
								<p class="font-mono text-sm text-gray-600">{session.sessionCode}</p>
							</div>
							<div>
								<h4 class="font-medium text-gray-900">Host</h4>
								<p class="text-sm text-gray-600">{session.hostName}</p>
							</div>
							<div>
								<h4 class="font-medium text-gray-900">Status</h4>
								<span
									class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {session.isActive
										? 'bg-green-100 text-green-800'
										: 'bg-gray-100 text-gray-800'}"
								>
									{session.isActive ? 'Active' : 'Inactive'}
								</span>
							</div>
							<div>
								<h4 class="font-medium text-gray-900">Created</h4>
								<p class="text-sm text-gray-600">{formatDate(session.createdAt)}</p>
							</div>
							<div>
								<h4 class="font-medium text-gray-900">Last Activity</h4>
								<p class="text-sm text-gray-600">
									{formatRelativeTime(session.lastActivity)}
								</p>
							</div>
						</div>

						<div>
							<h4 class="mb-3 font-medium text-gray-900">
								Participants ({session.participantCount})
							</h4>
							{#if session.participants && session.participants.length > 0}
								<div class="overflow-hidden rounded-lg border">
									<table class="min-w-full divide-y divide-gray-200">
										<thead class="bg-gray-50">
											<tr>
												<th
													scope="col"
													class="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
												>
													Name
												</th>
												<th
													scope="col"
													class="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
												>
													Role
												</th>
												<th
													scope="col"
													class="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
												>
													Status
												</th>
												<th
													scope="col"
													class="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
												>
													Last Seen
												</th>
											</tr>
										</thead>
										<tbody class="divide-y divide-gray-200 bg-white">
											{#each session.participants as participant (participant.name)}
												<tr>
													<td class="px-4 py-2">
														<div class="text-sm font-medium text-gray-900">{participant.name}</div>
													</td>
													<td class="px-4 py-2">
														<div class="text-sm text-gray-900">
															{participant.isHost ? 'Host' : 'Participant'}
															{#if participant.isObserver}
																<span class="ml-1 text-xs text-gray-500">(Observer)</span>
															{/if}
														</div>
													</td>
													<td class="px-4 py-2">
														{#if participant.isHost || participant.isConnected !== false}
															<span
																class="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
															>
																{#if participant.isHost}
																	🏛️ Host (Always Online)
																{:else}
																	🟢 Connected
																{/if}
															</span>
														{:else}
															<span
																class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800"
															>
																⚫ Disconnected
															</span>
														{/if}
													</td>
													<td class="px-4 py-2">
														<div class="text-sm text-gray-500">
															{#if participant.lastSeen}
																{formatRelativeTime(new Date(participant.lastSeen).toISOString())}
															{:else}
																Never
															{/if}
														</div>
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{:else}
								<div class="rounded-lg border border-gray-200 p-6 text-center">
									<p class="text-gray-500">No participants found</p>
								</div>
							{/if}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	</div>
{/if}
