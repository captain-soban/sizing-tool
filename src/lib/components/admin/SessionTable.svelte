<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Eye, Power, Trash2, RefreshCw, Search } from '@lucide/svelte';
	import type { AdminSessionData } from '$lib/api/adminClient';

	interface Props {
		sessions: AdminSessionData[];
		loading?: boolean;
		searchTerm?: string;
		onSearchChange?: (value: string) => void;
		onRefresh?: () => void;
		onViewDetails?: (session: AdminSessionData) => void;
		onTerminate?: (sessionCode: string) => void;
		onDelete?: (sessionCode: string) => void;
	}

	let {
		sessions,
		loading = false,
		searchTerm = '',
		onSearchChange,
		onRefresh,
		onViewDetails,
		onTerminate,
		onDelete
	}: Props = $props();

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

	let filteredSessions = $derived(
		sessions.filter(
			(session) =>
				session.sessionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
				session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				session.hostName.toLowerCase().includes(searchTerm.toLowerCase())
		)
	);

	function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		onSearchChange?.(target.value);
	}
</script>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between">
			<CardTitle>Session Management</CardTitle>
			<div class="flex items-center space-x-4">
				<div class="relative">
					<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
					<Input
						type="text"
						placeholder="Search sessions..."
						value={searchTerm}
						oninput={handleSearchInput}
						class="w-64 pl-10"
						aria-label="Search sessions by code, title, or host name"
					/>
				</div>
				<Button onclick={onRefresh} disabled={loading} aria-label="Refresh sessions list">
					<RefreshCw class="mr-2 h-4 w-4 {loading ? 'animate-spin' : ''}" />
					{loading ? 'Loading...' : 'Refresh'}
				</Button>
			</div>
		</div>
	</CardHeader>
	<CardContent>
		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div class="text-gray-500" role="status" aria-live="polite">Loading sessions...</div>
			</div>
		{:else if filteredSessions.length === 0}
			<div class="flex items-center justify-center py-12">
				<div class="text-center">
					<p class="text-gray-500">No sessions found</p>
					{#if searchTerm}
						<p class="mt-2 text-sm text-gray-400">Try adjusting your search criteria</p>
					{/if}
				</div>
			</div>
		{:else}
			<div class="overflow-hidden">
				<table class="min-w-full divide-y divide-gray-200" role="table">
					<thead class="bg-gray-50">
						<tr>
							<th
								scope="col"
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
							>
								Session
							</th>
							<th
								scope="col"
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
							>
								Host
							</th>
							<th
								scope="col"
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
							>
								Participants
							</th>
							<th
								scope="col"
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
							>
								Status
							</th>
							<th
								scope="col"
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
							>
								Last Activity
							</th>
							<th
								scope="col"
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
							>
								Actions
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white">
						{#each filteredSessions as session (session.sessionCode)}
							<tr class="hover:bg-gray-50">
								<td class="px-6 py-4">
									<div>
										<div class="text-sm font-medium text-gray-900">{session.title}</div>
										<div class="text-sm text-gray-500">Code: {session.sessionCode}</div>
									</div>
								</td>
								<td class="px-6 py-4">
									<div class="text-sm text-gray-900">{session.hostName}</div>
								</td>
								<td class="px-6 py-4">
									<div class="text-sm text-gray-900">{session.participantCount}</div>
								</td>
								<td class="px-6 py-4">
									<span
										class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {session.isActive
											? 'bg-green-100 text-green-800'
											: 'bg-gray-100 text-gray-800'}"
										aria-label="Session status: {session.isActive ? 'Active' : 'Inactive'}"
									>
										{session.isActive ? 'Active' : 'Inactive'}
									</span>
								</td>
								<td class="px-6 py-4">
									<div class="text-sm text-gray-900">
										{formatRelativeTime(session.lastActivity)}
									</div>
									<div class="text-xs text-gray-500">{formatDate(session.lastActivity)}</div>
								</td>
								<td class="px-6 py-4">
									<div class="flex items-center space-x-2">
										<Button
											size="sm"
											variant="outline"
											onclick={() => onViewDetails?.(session)}
											aria-label="View details for session {session.sessionCode}"
										>
											<Eye class="mr-1 h-3 w-3" />
											View Details
										</Button>
										{#if session.isActive}
											<Button
												size="sm"
												variant="outline"
												onclick={() => onTerminate?.(session.sessionCode)}
												aria-label="Terminate session {session.sessionCode}"
											>
												<Power class="mr-1 h-3 w-3" />
												Terminate
											</Button>
										{/if}
										<Button
											size="sm"
											variant="destructive"
											class="border border-red-600 bg-red-600 text-white hover:bg-red-700"
											onclick={() => onDelete?.(session.sessionCode)}
											aria-label="Delete session {session.sessionCode}"
										>
											<Trash2 class="mr-1 h-3 w-3" />
											Delete
										</Button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</CardContent>
</Card>
