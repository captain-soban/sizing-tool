<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { defaultStoryPointScales, type Participant } from '$lib/stores/session';

	const sessionCode = $page.params.sessionCode;

	let sessionTitle = $state('Sprint Planning Session');
	let playerName = $state('');
	let isHost = $state(false);
	let isObserver = $state(false);
	let participants = $state<Participant[]>([]);
	let votingInProgress = $state(false);
	let votesRevealed = $state(false);
	let selectedVote = $state<string | null>(null);
	let voteAverage = $state<string>('');
	let finalEstimate = $state<string>('');
	let editingTitle = $state(false);
	let tempTitle = $state('');

	let storyPointOptions = $state<string[]>(['0', '1', '2', '3', '5', '8', '?']);

	onMount(() => {
		const storedPlayerName = localStorage.getItem('playerName');
		const storedIsHost = localStorage.getItem('isHost') === 'true';
		const storedSessionCode = localStorage.getItem('sessionCode');

		if (!storedPlayerName || storedSessionCode !== sessionCode) {
			goto('/');
			return;
		}

		playerName = storedPlayerName;
		isHost = storedIsHost;

		// Load observer status
		const storedIsObserver =
			localStorage.getItem(`session_${sessionCode}_observer_${playerName}`) === 'true';
		isObserver = storedIsObserver;

		// Load session settings
		const storedTitle = localStorage.getItem(`session_${sessionCode}_title`);
		const storedScale = localStorage.getItem(`session_${sessionCode}_scale`);

		if (storedTitle) sessionTitle = storedTitle;
		if (storedScale) {
			if (storedScale === 'custom') {
				const customScaleData = localStorage.getItem(`session_${sessionCode}_custom_scale`);
				if (customScaleData) {
					storyPointOptions = JSON.parse(customScaleData);
				}
			} else {
				storyPointOptions =
					defaultStoryPointScales[storedScale as keyof typeof defaultStoryPointScales] ||
					storyPointOptions;
			}
		}

		// Load session state or initialize
		const storedParticipants = localStorage.getItem(`session_${sessionCode}_participants`);
		if (storedParticipants) {
			participants = JSON.parse(storedParticipants);
		} else {
			participants = [
				{ name: playerName, voted: false, isHost: isHost, isObserver: isObserver },
				{ name: 'Alice', voted: false, isHost: false, isObserver: false },
				{ name: 'Bob', voted: false, isHost: false, isObserver: false },
				{ name: 'Charlie', voted: false, isHost: false, isObserver: true }
			];
			saveSessionState();
		}

		// Load voting state
		const storedVotingState = localStorage.getItem(`session_${sessionCode}_voting`);
		if (storedVotingState) {
			const votingState = JSON.parse(storedVotingState);
			votingInProgress = votingState.votingInProgress || false;
			votesRevealed = votingState.votesRevealed || false;
			voteAverage = votingState.voteAverage || '';
			finalEstimate = votingState.finalEstimate || '';
		}
	});

	function saveSessionState() {
		localStorage.setItem(`session_${sessionCode}_participants`, JSON.stringify(participants));
		localStorage.setItem(
			`session_${sessionCode}_voting`,
			JSON.stringify({
				votingInProgress,
				votesRevealed,
				voteAverage,
				finalEstimate
			})
		);
		// Save observer status
		localStorage.setItem(`session_${sessionCode}_observer_${playerName}`, isObserver.toString());
	}

	function toggleObserverMode() {
		isObserver = !isObserver;
		const participantIndex = participants.findIndex((p) => p.name === playerName);
		if (participantIndex !== -1) {
			participants[participantIndex].isObserver = isObserver;
			// Clear vote if becoming observer
			if (isObserver) {
				participants[participantIndex].voted = false;
				participants[participantIndex].vote = undefined;
				selectedVote = null;
			}
			saveSessionState();
		}
	}

	function exitSession() {
		localStorage.removeItem('sessionCode');
		localStorage.removeItem('playerName');
		localStorage.removeItem('isHost');
		goto('/');
	}

	function goToSettings() {
		goto(`/session/${sessionCode}/settings`);
	}

	function selectVote(vote: string) {
		if (isObserver) return; // Observers cannot vote

		selectedVote = vote;
		const participantIndex = participants.findIndex((p) => p.name === playerName);
		if (participantIndex !== -1) {
			participants[participantIndex].voted = true;
			participants[participantIndex].vote = vote;
			saveSessionState();
		}
	}

	function startNewVoting() {
		votingInProgress = true;
		votesRevealed = false;
		selectedVote = null;
		voteAverage = '';
		finalEstimate = '';
		participants = participants.map((p) => ({ ...p, voted: false, vote: undefined }));
		saveSessionState();
	}

	function revealVotes() {
		if (!isHost) return;

		votesRevealed = true;
		// Only include votes from active participants (not observers)
		const votes = participants
			.filter((p) => !p.isObserver && p.vote && p.vote !== '?' && !isNaN(parseFloat(p.vote)))
			.map((p) => parseFloat(p.vote!));
		if (votes.length > 0) {
			const average = votes.reduce((sum, vote) => sum + vote, 0) / votes.length;
			voteAverage = average.toFixed(1);
		}
		saveSessionState();
	}

	function acceptEstimate() {
		if (!isHost) return;
		finalEstimate = voteAverage;
		votingInProgress = false;
		saveSessionState();
	}

	function startEditingTitle() {
		if (!isHost) return;
		editingTitle = true;
		tempTitle = sessionTitle;
	}

	function saveTitle() {
		if (tempTitle.trim()) {
			sessionTitle = tempTitle.trim();
			localStorage.setItem(`session_${sessionCode}_title`, sessionTitle);
		}
		editingTitle = false;
		tempTitle = '';
	}

	function cancelEditTitle() {
		editingTitle = false;
		tempTitle = '';
	}

	function getParticipantPosition(index: number, total: number) {
		const angle = (index * 360) / total - 90;
		const radius = 45; // Increased radius to position outside the table
		const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
		const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
		return { x: `${x}%`, y: `${y}%` };
	}
</script>

<div class="min-h-screen p-4">
	<!-- Top Controls -->
	<div class="fixed top-4 right-4 z-10 flex gap-2">
		<Button
			variant="outline"
			onclick={toggleObserverMode}
			class={isObserver
				? 'border-orange-300 bg-orange-100 text-orange-800 hover:bg-orange-200'
				: 'border-green-300 bg-green-100 text-green-800 hover:bg-green-200'}
		>
			{isObserver ? '👁️ Observer' : '🗳️ Participant'}
		</Button>
		<Button variant="outline" size="icon" onclick={goToSettings} class="btn-poker-gray">⚙️</Button>
		<Button variant="outline" onclick={exitSession} class="btn-poker-gray">Exit</Button>
	</div>

	<!-- Main Poker Table -->
	<div class="flex min-h-screen items-center justify-center">
		<div class="relative">
			<!-- Poker Table Container with participants positioned around it -->
			<div class="relative h-[700px] w-[900px]">
				<!-- Poker Table (Oval) -->
				<div
					class="absolute top-[10%] left-[10%] h-[480px] w-[640px] rounded-full border-8 border-amber-900 bg-green-800 shadow-2xl"
				>
					<!-- Table Center Area -->
					<div class="absolute inset-0 flex flex-col items-center justify-center">
						<Card class="work-area max-w-sm text-center">
							<CardContent class="p-6">
								<!-- Session Title -->
								{#if editingTitle}
									<div class="mb-4 space-y-2">
										<input
											type="text"
											bind:value={tempTitle}
											class="w-full rounded border p-2 text-center text-lg font-bold"
											placeholder="Enter session title"
											autofocus
											onkeydown={(e) => {
												if (e.key === 'Enter') saveTitle();
												if (e.key === 'Escape') cancelEditTitle();
											}}
										/>
										<div class="flex justify-center gap-2">
											<Button
												onclick={saveTitle}
												size="sm"
												class="bg-green-500 text-white hover:bg-green-600"
											>
												Save
											</Button>
											<Button
												onclick={cancelEditTitle}
												variant="outline"
												size="sm"
												class="btn-poker-gray"
											>
												Cancel
											</Button>
										</div>
									</div>
								{:else}
									<div class="group mb-4">
										<h2
											class="text-poker-blue hover:text-poker-blue/80 cursor-pointer text-xl font-bold transition-colors"
											onclick={startEditingTitle}
											title={isHost ? 'Click to edit title' : 'Session title'}
										>
											{sessionTitle}
											{#if isHost}
												<span
													class="ml-2 text-sm opacity-0 transition-opacity group-hover:opacity-100"
													>✏️</span
												>
											{/if}
										</h2>
									</div>
								{/if}

								<!-- Voting Status and Results -->
								{#if votesRevealed && voteAverage}
									<div class="space-y-3">
										<p class="text-muted-foreground text-sm">Team Average:</p>
										<p class="text-poker-red bounce-in text-4xl font-bold">{voteAverage}</p>

										{#if isHost && !finalEstimate}
											<div class="mt-4 space-y-2">
												<div class="flex justify-center gap-2">
													<Button
														onclick={acceptEstimate}
														class="bg-green-500 text-white hover:bg-green-600"
													>
														✓ Accept {voteAverage}
													</Button>
												</div>
												<div class="flex justify-center gap-2">
													<Button
														onclick={startNewVoting}
														variant="outline"
														size="sm"
														class="btn-poker-gray"
													>
														🔄 Re-vote
													</Button>
													<Button
														onclick={() => {
															const customValue = prompt('Enter custom estimate:', voteAverage);
															if (customValue && customValue.trim()) {
																finalEstimate = customValue.trim();
																votingInProgress = false;
																saveSessionState();
															}
														}}
														variant="outline"
														size="sm"
														class="btn-poker-gray"
													>
														✏️ Custom
													</Button>
												</div>
											</div>
										{/if}

										{#if finalEstimate}
											<div class="mt-4 rounded-md border-2 border-green-300 bg-green-100 p-3">
												<p class="font-medium text-green-800">
													Final Estimate: <span class="text-2xl font-bold">{finalEstimate}</span>
												</p>
												{#if isHost}
													<Button
														onclick={() => {
															finalEstimate = '';
															saveSessionState();
														}}
														variant="outline"
														size="sm"
														class="mt-2 text-xs"
													>
														Reset
													</Button>
												{/if}
											</div>
										{/if}
									</div>
								{:else if votingInProgress}
									<div class="space-y-3">
										<p class="text-muted-foreground">🗳️ Voting in progress...</p>
										<div class="text-sm text-gray-600">
											{participants.filter((p) => !p.isObserver && p.voted).length} / {participants.filter(
												(p) => !p.isObserver
											).length} votes cast
										</div>
										{#if isHost}
											<Button onclick={revealVotes} class="bg-poker-red hover:bg-poker-red/90">
												🎭 Reveal Votes
											</Button>
										{/if}
									</div>
								{:else}
									<div class="space-y-3">
										<p class="text-muted-foreground">Ready to start voting</p>
										{#if isHost}
											<Button onclick={startNewVoting} class="bg-poker-blue hover:bg-poker-blue/90">
												🚀 Start Voting
											</Button>
										{:else}
											<p class="text-sm text-gray-500">Waiting for host to start...</p>
										{/if}
									</div>
								{/if}
							</CardContent>
						</Card>
					</div>
				</div>

				<!-- Participants Around Table (Outside the table) -->
				{#each participants as participant, index (participant.name)}
					{@const position = getParticipantPosition(index, participants.length)}
					<div
						class="absolute -translate-x-1/2 -translate-y-1/2 transform"
						style="left: {position.x}; top: {position.y};"
					>
						<div class="flex flex-col items-center space-y-2">
							<!-- Participant Card -->
							<Card class="work-area min-w-[120px]">
								<CardContent class="p-3 text-center">
									<div class="mb-1 flex items-center justify-center space-x-1">
										<span class="text-sm font-medium">{participant.name}</span>
										{#if participant.isHost}
											<span class="bg-poker-blue rounded px-1 text-xs text-white">HOST</span>
										{/if}
										{#if participant.isObserver}
											<span class="rounded bg-orange-200 px-1 text-xs text-orange-800">👁️</span>
										{/if}
									</div>

									<!-- Vote Status Indicator -->
									<div class="flex justify-center">
										{#if participant.isObserver}
											<div class="rounded-md bg-orange-100 px-3 py-1 text-xs text-orange-600">
												👁️ Observer
											</div>
										{:else if votesRevealed && participant.vote}
											<div
												class="bounce-in bg-poker-blue rounded-md px-3 py-1 font-bold text-white"
											>
												{participant.vote}
											</div>
										{:else if participant.voted}
											<div
												class="bounce-in rounded-md bg-green-500 px-3 py-1 font-medium text-white"
											>
												✓ Voted
											</div>
										{:else if votingInProgress}
											<div
												class="thinking rounded-md bg-yellow-100 px-3 py-1 text-sm text-yellow-700"
											>
												🤔 Thinking...
											</div>
										{:else}
											<div class="rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-500">
												Ready
											</div>
										{/if}
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Voting Cards (Bottom) -->
	{#if votingInProgress && !votesRevealed && !isObserver}
		<div class="fixed bottom-8 left-1/2 -translate-x-1/2 transform">
			<Card class="work-area">
				<CardContent class="p-4">
					<p class="mb-4 text-center text-sm font-medium">Choose your estimate:</p>
					<div class="flex justify-center gap-2">
						{#each storyPointOptions as option (option)}
							<Button
								onclick={() => selectVote(option)}
								variant={selectedVote === option ? 'default' : 'outline'}
								class={selectedVote === option
									? 'bg-poker-blue hover:bg-poker-blue/90'
									: 'btn-poker-gray'}
								size="lg"
							>
								{option}
							</Button>
						{/each}
					</div>
				</CardContent>
			</Card>
		</div>
	{/if}

	<!-- Observer Message (Bottom) -->
	{#if votingInProgress && !votesRevealed && isObserver}
		<div class="fixed bottom-8 left-1/2 -translate-x-1/2 transform">
			<Card class="work-area">
				<CardContent class="p-4">
					<p class="text-center text-sm text-orange-600">
						👁️ You are observing this session. Toggle to participant mode to vote.
					</p>
				</CardContent>
			</Card>
		</div>
	{/if}
</div>
