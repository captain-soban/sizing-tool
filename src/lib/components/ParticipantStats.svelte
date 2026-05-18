<script lang="ts">
	import type { Participant } from '$lib/stores/session';
	import { ParticipantModeService } from '$lib/services/participantModeService';
	import { Users } from '@lucide/svelte';

	interface Props {
		participants: Participant[];
		showVotingProgress?: boolean;
		class?: string;
	}

	let { participants = [], showVotingProgress = false, class: className = '' }: Props = $props();

	// Use $derived correctly
	const stats = $derived(ParticipantModeService.getParticipantCounts(participants));

	const votingProgress = $derived(
		!showVotingProgress
			? null
			: (() => {
					const votingParticipants = ParticipantModeService.getVotingParticipants(participants);
					const votedCount = votingParticipants.filter((p) => p.voted).length;

					return {
						voted: votedCount,
						total: votingParticipants.length,
						percentage:
							votingParticipants.length > 0
								? Math.round((votedCount / votingParticipants.length) * 100)
								: 0
					};
				})()
	);

	const displayText = $derived(
		(() => {
			const { total, voting, observing, disconnected } = stats;

			let text = `${total} online`;

			if (observing > 0) {
				text += ` (${voting} voting)`;
			}

			if (disconnected > 0) {
				text += ` - ${disconnected} offline`;
			}

			return text;
		})()
	);
</script>

<div class={`flex items-center gap-2 text-sm ${className}`}>
	<Users class="h-3.5 w-3.5 text-gray-500" />
	<span class="text-gray-600">
		{displayText}
	</span>

	{#if showVotingProgress && votingProgress && votingProgress.total > 0}
		<span class="text-gray-500">
			&bull; {votingProgress.voted} / {votingProgress.total} voted
			{#if votingProgress.percentage < 100}
				<span class="text-xs">({votingProgress.percentage}%)</span>
			{/if}
		</span>
	{/if}
</div>
