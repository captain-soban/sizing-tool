<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import NewRoundModal from '$lib/components/NewRoundModal.svelte';
	import ShareableLinkModal from '$lib/components/ShareableLinkModal.svelte';
	import RoundsDrawer from '$lib/components/RoundsDrawer.svelte';
	import ParticipantModeToggle from '$lib/components/ParticipantModeToggle.svelte';
	import ParticipantStats from '$lib/components/ParticipantStats.svelte';
	// import ObserverNotice from '$lib/components/ObserverNotice.svelte';
	import { RoundService } from '$lib/services/roundService';
	import { ShareableLinkService } from '$lib/services/shareableLinkService';
	import {
		ParticipantModeService,
		type ParticipantModeState
	} from '$lib/services/participantModeService';
	import {
		type Participant,
		type VotingRound,
		updateRecentSessionTitle,
		addRecentSession
	} from '$lib/stores/session';
	import { SessionClient, type SessionData } from '$lib/api/sessionClient';
	import {
		BrainCog,
		Share2,
		Eye,
		Vote,
		Settings,
		LogOut,
		Plus,
		BarChart3,
		RotateCcw,
		Check,
		Edit3,
		Theater,
		Rocket,
		Lightbulb,
		CheckCircle,
		UserMinus
	} from '@lucide/svelte';

	const sessionCode = $page.params.sessionCode!;

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
	let sessionClient: SessionClient;
	let heartbeatInterval: number | null = null;
	// Removed old name prompt state - now using ShareableLinkModal

	let storyPointOptions = $state<string[]>(['0', '1', '2', '3', '5', '8', '?']);
	let isManDaysMode = $state(false);
	let manDaysInput = $state('');
	let currentRound = $state(1);
	let currentRoundDescription = $state('Round 1');
	let rounds = $state<VotingRound[]>([]);
	let showRoundsDrawer = $state(false);
	let showNewRoundModal = $state(false);
	let isStartingNewRound = $state(false);
	let showShareableLinkModal = $state(false);
	let shareableLinkError = $state('');
	let isJoiningViaLink = $state(false);
	let participantToRemove = $state<string | null>(null);
	let showRemoveConfirmation = $state(false);
	let roundService: RoundService;
	let participantModeService: ParticipantModeService;
	let shareableLinkService: ShareableLinkService;

	// Helper function to initialize participant mode service
	function initializeParticipantModeService() {
		if (!playerName) return; // Don't initialize without playerName

		participantModeService = new ParticipantModeService(sessionClient, {
			sessionCode,
			playerName,
			onStateUpdate: (state) => {
				isHost = state.isHost;
				isObserver = state.isObserver;
			},
			onVoteReset: () => {
				selectedVote = null;
				manDaysInput = '';
			}
		});
	}

	onMount(() => {
		// Initialize services first
		sessionClient = new SessionClient();
		shareableLinkService = new ShareableLinkService(sessionClient);
		roundService = new RoundService(sessionClient);
		// participantModeService will be initialized later when playerName is set

		// Check shareable link access - async but not blocking the main onMount return
		(async () => {
			try {
				// First check if user has recent session data (they may have just created this session)
				const recentSessions = await import('$lib/stores/session').then((m) =>
					m.getRecentSessions()
				);
				const existingSession = recentSessions.find((s) => s.sessionCode === sessionCode);

				if (existingSession) {
					// User has recent session data - use it directly
					console.log('[Session] Found recent session data, using direct flow');
					playerName = existingSession.playerName;
					isHost = existingSession.isHost;
					initializeParticipantModeService();
					await initializeSession();
					return;
				}

				// No recent session data - proceed with shareable link flow
				const linkResult = await shareableLinkService.checkShareableLinkAccess(sessionCode);

				if (!linkResult.sessionExists) {
					// Session doesn't exist - redirect to home
					console.log('[Session] Session not found, redirecting to home');
					goto('/');
					return;
				}

				if (linkResult.needsNamePrompt) {
					// New user accessing shared link - show name prompt
					console.log('[Session] New user accessing shared link, showing name modal');
					showShareableLinkModal = true;
					return;
				}

				// Returning user - set info and rejoin
				if (linkResult.playerName) {
					playerName = linkResult.playerName;
					isHost = linkResult.isHost || false;
					initializeParticipantModeService(); // Initialize service now that we have playerName

					await shareableLinkService.rejoinViaShareableLink(sessionCode, playerName, isHost);
					await initializeSession();
				}
			} catch (error) {
				console.error('[Session] Error with shareable link access:', error);
				goto('/');
				return;
			}
		})();

		// Handle visibility changes to reconnect when user returns to tab
		const handleVisibilityChange = () => {
			if (!document.hidden && sessionClient) {
				// Reconnect to real-time updates if needed
				sessionClient.connectToRealtime(sessionCode, playerName);
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		// Add keyboard shortcuts
		const handleKeyPress = (e: KeyboardEvent) => {
			// Don't handle shortcuts if user is typing in an input
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
				return;
			}

			switch (e.key) {
				case 'Escape':
					exitSession();
					break;
				case 's':
				case 'S':
					if (e.ctrlKey || e.metaKey) {
						e.preventDefault();
						goToSettings();
					}
					break;
				case '1':
				case '2':
				case '3':
				case '5':
				case '8':
				case '0':
				case '?':
					if (votingInProgress && !votesRevealed && !isObserver) {
						selectVote(e.key);
					}
					break;
			}
		};

		document.addEventListener('keydown', handleKeyPress);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			document.removeEventListener('keydown', handleKeyPress);
		};
	});

	onDestroy(() => {
		if (sessionClient) {
			sessionClient.disconnect();
		}
		if (heartbeatInterval) {
			clearInterval(heartbeatInterval);
		}
	});

	async function initializeSession() {
		// Load observer status from localStorage (user preference)
		isObserver = participantModeService.loadObserverPreference();

		// Services are already initialized in onMount

		// Set up real-time updates
		sessionClient.onUpdate((sessionData: SessionData) => {
			updateFromSessionData(sessionData);
		});

		try {
			// Join or rejoin the session
			const sessionData = await sessionClient.joinSession(sessionCode, playerName, isObserver);
			updateFromSessionData(sessionData);

			// Track participant joining this session
			await sessionClient.trackParticipant(sessionCode, playerName, isHost);

			// Load existing rounds from database
			const existingRounds = await sessionClient.getRounds(sessionCode);
			rounds = existingRounds;
			// Note: currentRound and currentRoundDescription will be set by updateFromSessionData

			// Connect to real-time updates
			sessionClient.connectToRealtime(sessionCode, playerName);

			// Start lightweight heartbeat (reduced frequency since SSE provides real-time connection tracking)
			heartbeatInterval = window.setInterval(() => {
				if (sessionClient) {
					sessionClient.sendHeartbeat(sessionCode, playerName);
				}
			}, 60000); // Send heartbeat every 60 seconds (reduced from 5 seconds)
		} catch (error) {
			console.error('[Session] Error joining session:', error);
			goto('/');
		}
	}

	function updateFromSessionData(sessionData: SessionData) {
		console.log('[SessionData] Received update:', sessionData);

		sessionTitle = sessionData.title;
		participants = sessionData.participants;
		votingInProgress = sessionData.votingState.votingInProgress;
		votesRevealed = sessionData.votingState.votesRevealed;
		voteAverage = sessionData.votingState.voteAverage;
		finalEstimate = sessionData.votingState.finalEstimate;

		// Update rounds data if available
		if (sessionData.votingState.currentRound) {
			currentRound = sessionData.votingState.currentRound;
		}
		if (sessionData.votingState.currentRoundDescription) {
			currentRoundDescription = sessionData.votingState.currentRoundDescription;
		}
		if (sessionData.votingState.rounds) {
			rounds = sessionData.votingState.rounds;
		}

		// Update story point options if different
		if (JSON.stringify(sessionData.storyPointScale) !== JSON.stringify(storyPointOptions)) {
			storyPointOptions = sessionData.storyPointScale;
		}

		// Check if we're in man days mode
		isManDaysMode = storyPointOptions.length === 1 && storyPointOptions[0] === 'man_days';
		console.log('[SessionData] Man days mode:', isManDaysMode, 'Options:', storyPointOptions);

		// Update local selected vote and participant mode based on participant data
		const currentParticipant = participants.find((p) => p.name === playerName);
		if (currentParticipant) {
			if (currentParticipant.vote !== selectedVote) {
				selectedVote = currentParticipant.vote || null;
				console.log('[SessionData] Updated selectedVote to:', selectedVote);
			}

			// Update participant mode state (host and observer status)
			const currentState: ParticipantModeState = {
				isObserver,
				isHost,
				playerName,
				sessionCode
			};

			const updatedState = participantModeService.updateFromParticipant(
				currentState,
				currentParticipant
			);
			if (updatedState) {
				console.log('[SessionData] Updated participant mode:', updatedState);
			}
		}

		// Update recent session title if it changed
		updateRecentSessionTitle(sessionCode, playerName, sessionData.title);

		// Update localStorage with correct host status if changed
		if (currentParticipant && currentParticipant.isHost !== undefined) {
			addRecentSession({
				sessionCode,
				playerName,
				isHost: currentParticipant.isHost,
				sessionTitle: sessionData.title
			});
		}
	}

	// function saveSessionState() {
	// 	// Save individual session settings (not shared)
	// 	localStorage.setItem(`session_${sessionCode}_observer_${playerName}`, isObserver.toString());
	// }

	async function copySessionLink() {
		await ShareableLinkService.copyShareableLink(sessionCode, '[title="Share session"]');
	}

	async function handleShareableLinkJoin(joinPlayerName: string) {
		shareableLinkError = '';
		isJoiningViaLink = true;

		try {
			await shareableLinkService.joinViaShareableLink(sessionCode, joinPlayerName);

			// Set local state
			playerName = joinPlayerName;
			isHost = false;
			initializeParticipantModeService(); // Initialize service now that we have playerName
			showShareableLinkModal = false;

			// Setup session without double-joining (service already joined)
			await setupSessionAfterJoin();
		} catch (error) {
			console.error('[Session] Error joining via shareable link:', error);
			shareableLinkError = error instanceof Error ? error.message : 'Failed to join session';
		} finally {
			isJoiningViaLink = false;
		}
	}

	async function setupSessionAfterJoin() {
		// Load observer status from localStorage (user preference)
		isObserver = participantModeService.loadObserverPreference();

		// Set up real-time updates
		sessionClient.onUpdate((sessionData: SessionData) => {
			updateFromSessionData(sessionData);
		});

		try {
			// Get current session data (don't join again, already joined via service)
			const sessionData = await sessionClient.getSession(sessionCode);
			if (sessionData) {
				updateFromSessionData(sessionData);
			}

			// Load existing rounds from database
			const existingRounds = await sessionClient.getRounds(sessionCode);
			rounds = existingRounds;

			// Connect to real-time updates
			sessionClient.connectToRealtime(sessionCode, playerName);

			// Start lightweight heartbeat (reduced frequency since SSE provides real-time connection tracking)
			heartbeatInterval = window.setInterval(() => {
				if (sessionClient) {
					sessionClient.sendHeartbeat(sessionCode, playerName);
				}
			}, 60000); // Send heartbeat every 60 seconds (reduced from 5 seconds)
		} catch (error) {
			console.error('[Session] Error setting up session after join:', error);
			goto('/');
		}
	}

	function handleShareableLinkCancel() {
		showShareableLinkModal = false;
		goto('/');
	}

	// Old shared link functions removed - now using ShareableLinkService and ShareableLinkModal

	async function toggleObserverMode() {
		// Ensure service is initialized before using it
		if (!participantModeService) {
			console.error('[Session] ParticipantModeService not initialized');
			return;
		}

		const currentState: ParticipantModeState = {
			isObserver,
			isHost,
			playerName,
			sessionCode
		};

		try {
			await participantModeService.toggleObserverMode(currentState);
			// State will be updated via the onStateUpdate callback
		} catch (error) {
			console.error('[Session] Error toggling observer mode:', error);
			// State remains unchanged on error
		}
	}

	function exitSession() {
		// The recent sessions data will remain for quick access later
		goto('/');
	}

	function goToSettings() {
		goto(`/session/${sessionCode}/settings`);
	}

	async function selectVote(vote: string) {
		if (isObserver) return; // Observers cannot vote

		// Immediate UI update for better UX
		selectedVote = vote;

		// Optimized server update - uses batching for better performance
		if (sessionClient) {
			try {
				// Vote updates are batched and debounced (not immediate)
				await sessionClient.updateParticipant(
					sessionCode,
					playerName,
					{
						voted: true,
						vote: vote
					},
					false
				); // false = use batching
			} catch (error) {
				console.error('[Session] Error selecting vote:', error);
			}
		}
	}

	function submitManDaysVote() {
		if (isObserver || !manDaysInput) return;

		const numValue = parseFloat(manDaysInput);
		if (isNaN(numValue) || numValue < 0) return;

		const vote = numValue.toString();
		selectVote(vote);
	}

	async function startNewVoting() {
		if (!isHost) return;

		// Clear local UI state
		selectedVote = null;
		manDaysInput = '';

		// Reset votes on server
		if (sessionClient) {
			try {
				await sessionClient.resetVotes(sessionCode);
			} catch (error) {
				console.error('[Session] Error starting new voting:', error);
			}
		}
	}

	async function revealVotes() {
		if (!isHost) return;

		// Calculate average from current participants (exclude disconnected non-hosts)
		const votes = participants
			.filter(
				(p) =>
					!p.isObserver &&
					(p.isHost || p.isConnected !== false) &&
					p.vote &&
					p.vote !== '?' &&
					!isNaN(parseFloat(p.vote))
			)
			.map((p) => parseFloat(p.vote!));

		let calculatedAverage = '';
		if (votes.length > 0) {
			const average = votes.reduce((sum, vote) => sum + vote, 0) / votes.length;
			calculatedAverage = average.toFixed(1);
		}

		// Update server state
		if (sessionClient) {
			try {
				await sessionClient.updateVotingState(sessionCode, {
					votesRevealed: true,
					voteAverage: calculatedAverage
				});
			} catch (error) {
				console.error('[Session] Error revealing votes:', error);
			}
		}
	}

	async function acceptEstimate() {
		if (!isHost) return;

		if (sessionClient) {
			try {
				await sessionClient.updateVotingState(sessionCode, {
					finalEstimate: voteAverage,
					votingInProgress: false
				});
			} catch (error) {
				console.error('[Session] Error accepting estimate:', error);
			}
		}
	}

	async function handleNewRound(description: string) {
		if (!isHost) {
			throw new Error('Invalid state for starting new round');
		}

		isStartingNewRound = true;
		try {
			// Complete current round if there are votes
			if (voteAverage) {
				const completedRound = await roundService.completeCurrentRound(
					sessionCode,
					currentRound,
					currentRoundDescription,
					participants,
					voteAverage,
					finalEstimate || voteAverage
				);
				rounds = [...rounds, completedRound];
			}

			// Start new round
			const newRoundNumber = currentRound + 1;
			await roundService.startNewRound(sessionCode, newRoundNumber, description);

			// Refresh session data after round operations
			const updatedSession = await sessionClient.getSession(sessionCode);
			if (updatedSession) {
				updateFromSessionData(updatedSession);
			}

			console.log(`[Rounds] Successfully started round ${newRoundNumber}`);
			if (voteAverage) {
				console.log(
					`[Rounds] Completed previous round ${currentRound} with average: ${voteAverage}`
				);
			} else {
				console.log(
					`[Rounds] Started new round ${newRoundNumber} without completing previous round`
				);
			}

			// Reset voting state
			selectedVote = null;
			manDaysInput = '';
		} catch (error) {
			console.error('[Session] Error starting new round:', error);
			throw error; // Re-throw to let modal handle the error
		} finally {
			isStartingNewRound = false;
		}
	}

	function startEditingTitle() {
		if (!isHost) return;
		editingTitle = true;
		tempTitle = sessionTitle;
	}

	async function saveTitle() {
		if (tempTitle.trim()) {
			if (sessionClient) {
				try {
					await sessionClient.updateSessionTitle(sessionCode, tempTitle.trim());
				} catch (error) {
					console.error('[Session] Error saving title:', error);
				}
			}
		}
		editingTitle = false;
		tempTitle = '';
	}

	function cancelEditTitle() {
		editingTitle = false;
		tempTitle = '';
	}

	function getParticipantPosition(index: number, total: number) {
		// Start from top (12 o'clock position) and distribute evenly
		const angle = (index * 360) / total - 90;

		// Define table boundaries and create invisible padding zone
		// Table occupies: top-[15%] right-[12%] bottom-[15%] left-[12%]
		const tableEdges = {
			left: 12, // left-[12%]
			right: 88, // 100% - right-[12%]
			top: 15, // top-[15%]
			bottom: 85 // 100% - bottom-[15%]
		};

		// Add invisible padding around the table (8% padding on all sides)
		const padding = 8;
		const paddedBoundaries = {
			left: tableEdges.left - padding, // 4%
			right: tableEdges.right + padding, // 96%
			top: tableEdges.top - padding, // 7%
			bottom: tableEdges.bottom + padding // 93%
		};

		// Calculate radius to place participants outside the padded zone
		// Use the maximum extent of the padded oval to ensure clearance
		const paddedRadiusX = Math.max(50 - paddedBoundaries.left, paddedBoundaries.right - 50);
		const paddedRadiusY = Math.max(50 - paddedBoundaries.top, paddedBoundaries.bottom - 50);

		// Add extra margin based on participant count to prevent crowding
		const extraMargin = total <= 3 ? 2 : total <= 5 ? 4 : total <= 7 ? 6 : 8;
		const finalRadiusX = paddedRadiusX + extraMargin;
		const finalRadiusY = paddedRadiusY + extraMargin;

		const x = 50 + finalRadiusX * Math.cos((angle * Math.PI) / 180);
		const y = 50 + finalRadiusY * Math.sin((angle * Math.PI) / 180);

		// Ensure participants stay within container bounds
		const clampedX = Math.max(1, Math.min(99, x));
		const clampedY = Math.max(1, Math.min(99, y));

		return { x: `${clampedX}%`, y: `${clampedY}%` };
	}

	// Calculate responsive width based on number of story point options
	function getEstimationFrameWidth() {
		const optionCount = storyPointOptions.length;
		if (optionCount <= 5) return 'max-w-sm';
		if (optionCount <= 7) return 'max-w-md';
		if (optionCount <= 9) return 'max-w-lg';
		if (optionCount <= 12) return 'max-w-xl';
		return 'max-w-2xl';
	}

	// Calculate responsive button size and spacing based on number of options
	function getButtonClasses(isSelected: boolean) {
		const optionCount = storyPointOptions.length;
		let baseClasses = '';

		if (optionCount <= 7) {
			// Larger buttons for fewer options
			baseClasses = 'min-w-[2.5rem] h-8 text-sm sm:min-w-[3rem] sm:h-9 sm:text-base';
		} else if (optionCount <= 10) {
			// Medium buttons for moderate options
			baseClasses = 'min-w-[2rem] h-7 text-xs sm:min-w-[2.5rem] sm:h-8 sm:text-sm';
		} else {
			// Smaller buttons for many options
			baseClasses = 'min-w-[1.75rem] h-6 text-xs sm:min-w-[2rem] sm:h-7 sm:text-sm';
		}

		if (isSelected) {
			return `bg-poker-blue hover:bg-poker-blue/90 slide-up ${baseClasses} font-bold shadow-md`;
		} else {
			return `btn-poker-gray poker-card-hover ${baseClasses} font-semibold hover:shadow-sm transition-all duration-200`;
		}
	}

	// Calculate gap size based on number of options
	function getButtonGap() {
		const optionCount = storyPointOptions.length;
		if (optionCount <= 7) return 'gap-1.5 sm:gap-2';
		if (optionCount <= 10) return 'gap-1 sm:gap-1.5';
		return 'gap-0.5 sm:gap-1';
	}

	// Check if all non-observer participants have voted
	function allParticipantsVoted(): boolean {
		return ParticipantModeService.allVotingParticipantsHaveVoted(participants);
	}

	// Remove participant functions
	function confirmRemoveParticipant(participantName: string) {
		if (!isHost) return;
		participantToRemove = participantName;
		showRemoveConfirmation = true;
	}

	function cancelRemoveParticipant() {
		participantToRemove = null;
		showRemoveConfirmation = false;
	}

	async function removeParticipant() {
		if (!isHost || !participantToRemove || !sessionClient) return;

		try {
			await sessionClient.removeParticipant(sessionCode, participantToRemove);
			console.log(`[Session] Removed participant: ${participantToRemove}`);
		} catch (error) {
			console.error('[Session] Error removing participant:', error);
		} finally {
			cancelRemoveParticipant();
		}
	}
</script>

<div class="min-h-screen p-4">
	<!-- Session Info - Upper Left -->
	<div class="fixed top-4 left-4 z-10">
		<div class="rounded-lg border bg-white/90 px-3 py-2 shadow-lg backdrop-blur-sm">
			{#if editingTitle}
				<div class="space-y-2">
					<input
						type="text"
						bind:value={tempTitle}
						class="w-full rounded border p-1 text-lg font-bold text-blue-700 sm:text-xl lg:text-2xl"
						placeholder="Enter session title"
						onkeydown={(e) => {
							if (e.key === 'Enter') saveTitle();
							if (e.key === 'Escape') cancelEditTitle();
						}}
					/>
					<div class="flex gap-1">
						<Button
							onclick={saveTitle}
							size="sm"
							class="bg-green-500 text-xs text-white hover:bg-green-600"
						>
							Save
						</Button>
						<Button
							onclick={cancelEditTitle}
							variant="outline"
							size="sm"
							class="btn-poker-gray text-xs"
						>
							Cancel
						</Button>
					</div>
				</div>
			{:else}
				<div class="group flex items-center gap-2">
					<div class="flex-1">
						{#if isHost}
							<button
								type="button"
								class="m-0 cursor-pointer rounded border-none bg-transparent p-0 text-left text-lg font-bold text-blue-700 transition-colors hover:text-blue-700/80 focus:text-blue-700/80 focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:outline-none sm:text-xl lg:text-2xl"
								onclick={startEditingTitle}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										startEditingTitle();
									}
								}}
								title="Click to edit title"
							>
								{sessionTitle}
								<Edit3 class="ml-1 h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
							</button>
						{:else}
							<h1 class="text-lg font-bold text-blue-700 sm:text-xl lg:text-2xl">
								{sessionTitle}
							</h1>
						{/if}
					</div>
					<Button
						variant="outline"
						size="sm"
						class="btn-poker-gray h-6 w-6 p-0 sm:h-7 sm:w-7"
						title="Share session"
						onclick={copySessionLink}
					>
						<Share2 class="h-3 w-3 sm:h-4 sm:w-4" />
					</Button>
				</div>
			{/if}
			<p class="mt-1 text-xs text-gray-600">Session: {sessionCode}</p>
			<ParticipantStats {participants} class="text-xs text-gray-500" />
		</div>
	</div>

	<!-- Top Controls -->
	<div class="fixed top-4 right-4 z-10 flex gap-2">
		<ParticipantModeToggle {isObserver} onToggle={toggleObserverMode} />
		{#if isHost}
			<Button
				variant="outline"
				onclick={() => (showNewRoundModal = true)}
				class="btn-poker-gray"
				title="Start new voting round"
			>
				<Plus class="mr-1 h-4 w-4" />
				New Round
			</Button>
		{/if}
		{#if rounds.length > 0}
			<Button
				variant="outline"
				onclick={() => (showRoundsDrawer = !showRoundsDrawer)}
				class="btn-poker-gray"
				title="View rounds history"
			>
				<BarChart3 class="mr-1 h-4 w-4" />
				({rounds.length})
			</Button>
		{/if}
		<Button
			variant="outline"
			size="icon"
			onclick={goToSettings}
			class="btn-poker-gray"
			title="Settings"
		>
			<Settings class="h-4 w-4" />
		</Button>
		<Button variant="outline" onclick={exitSession} class="btn-poker-gray" title="Exit session">
			<LogOut class="mr-1 h-4 w-4" />
			Exit
		</Button>
	</div>

	<!-- Main Poker Table -->
	<div class="flex min-h-screen items-center justify-center p-2">
		<div class="relative w-full max-w-4xl">
			<!-- Poker Table Container with participants positioned around it -->
			<div class="relative aspect-[5/3] max-h-[450px] min-h-[350px] w-full">
				<!-- Poker Table (Oval) -->
				<div
					class="absolute top-[15%] right-[12%] bottom-[15%] left-[12%] border-3 border-amber-900 bg-green-800 shadow-xl sm:border-4"
					style="border-radius: 50% / 40%;"
				>
					<!-- Table Center Area -->
					<div class="absolute inset-0 flex flex-col items-center justify-center p-2 sm:p-3">
						<Card class="work-area w-full max-w-[240px] text-center sm:max-w-[280px]">
							<CardContent class="p-2.5 sm:p-3 lg:p-4">
								<!-- Round Info -->
								<div class="mb-3 sm:mb-4">
									<p class="text-sm font-medium text-gray-600">{currentRoundDescription}</p>
								</div>

								<!-- Voting Status and Results -->
								{#if votesRevealed && voteAverage}
									<div class="space-y-2 sm:space-y-3">
										<p class="text-muted-foreground text-xs sm:text-sm">
											{isManDaysMode ? 'Average Days:' : 'Team Average:'}
										</p>
										<p class="text-poker-red bounce-in text-2xl font-bold sm:text-3xl lg:text-4xl">
											{voteAverage}{isManDaysMode ? ' days' : ''}
										</p>

										{#if isHost && !finalEstimate}
											<div class="mt-3 space-y-2 sm:mt-4">
												<div class="flex justify-center gap-2">
													<Button
														onclick={acceptEstimate}
														class="bg-green-500 px-3 text-xs text-white hover:bg-green-600 sm:px-4 sm:text-sm"
														size="sm"
													>
														<Check class="mr-1 h-3 w-3" />
														Accept {voteAverage}
													</Button>
												</div>
												<div class="flex flex-wrap justify-center gap-1 sm:gap-2">
													<Button
														onclick={startNewVoting}
														variant="outline"
														size="sm"
														class="btn-poker-gray text-xs sm:text-sm"
													>
														<RotateCcw class="mr-1 h-3 w-3" />
														Re-vote
													</Button>
													<Button
														onclick={async () => {
															const customValue = prompt('Enter custom estimate:', voteAverage);
															if (customValue && customValue.trim() && sessionClient) {
																try {
																	await sessionClient.updateVotingState(sessionCode, {
																		finalEstimate: customValue.trim(),
																		votingInProgress: false
																	});
																} catch (error) {
																	console.error('[Session] Error saving custom estimate:', error);
																}
															}
														}}
														variant="outline"
														size="sm"
														class="btn-poker-gray text-xs sm:text-sm"
													>
														<Edit3 class="mr-1 h-3 w-3" />
														Custom
													</Button>
												</div>
											</div>
										{/if}

										{#if finalEstimate}
											<div class="mt-4 rounded-md border-2 border-green-300 bg-green-100 p-3">
												<p class="font-medium text-green-800">
													Final Estimate: <span class="text-2xl font-bold"
														>{finalEstimate}{isManDaysMode ? ' days' : ''}</span
													>
												</p>
												{#if isHost}
													<Button
														onclick={async () => {
															if (sessionClient) {
																try {
																	await sessionClient.updateVotingState(sessionCode, {
																		finalEstimate: '',
																		votingInProgress: false
																	});
																} catch (error) {
																	console.error('[Session] Error resetting final estimate:', error);
																}
															}
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
										<div class="flex items-center justify-center gap-2">
											<Vote class="h-5 w-5 text-blue-600" />
											<p class="text-muted-foreground">Voting in progress...</p>
										</div>
										<ParticipantStats
											{participants}
											showVotingProgress={true}
											class="text-sm text-gray-600"
										/>
										{#if isHost}
											<div class="flex flex-wrap justify-center gap-2">
												<Button
													onclick={revealVotes}
													disabled={!allParticipantsVoted()}
													class={allParticipantsVoted()
														? 'bg-poker-red hover:bg-poker-red/90'
														: 'cursor-not-allowed bg-gray-400'}
												>
													<Theater class="mr-1 h-4 w-4" />
													Reveal Votes
												</Button>
												<Button
													onclick={startNewVoting}
													variant="outline"
													size="sm"
													class="btn-poker-gray text-xs sm:text-sm"
												>
													<RotateCcw class="mr-1 h-3 w-3" />
													Restart
												</Button>
											</div>
										{/if}
									</div>
								{:else}
									<div class="space-y-3">
										<p class="text-muted-foreground">Ready to start voting</p>
										{#if isHost}
											<Button onclick={startNewVoting} class="bg-poker-blue hover:bg-poker-blue/90">
												<Rocket class="mr-1 h-4 w-4" />
												Start Voting
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
						<div class="flex flex-col items-center">
							<!-- Participant Card -->
							<Card
								class="work-area relative w-24 sm:w-28 {!participant.isHost &&
								participant.isConnected === false
									? 'bg-gray-50 opacity-75'
									: ''}"
							>
								<CardContent class="p-1.5 text-center sm:p-2">
									<!-- Host Remove Button (only show for host viewing other participants) -->
									{#if isHost && participant.name !== playerName && !participant.isHost}
										<button
											onclick={() => confirmRemoveParticipant(participant.name)}
											class="absolute -top-1 -right-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white transition-colors hover:bg-red-600"
											title="Remove participant"
										>
											<UserMinus class="h-2.5 w-2.5" />
										</button>
									{/if}

									<!-- Participant Name and Badges -->
									<div class="mb-1 flex flex-col items-center space-y-0.5">
										<span
											class="max-w-full text-center text-[11px] leading-tight font-medium break-words sm:text-xs"
											>{participant.name}</span
										>
										<div class="flex flex-wrap items-center justify-center gap-0.5">
											{#if participant.isHost}
												<span
													class="bg-poker-blue rounded px-1 py-0.5 text-[8px] font-medium text-white sm:text-[9px]"
													>HOST</span
												>
											{/if}
											{#if participant.isObserver}
												<span
													class="flex items-center rounded bg-orange-200 px-1 py-0.5 text-[8px] font-medium text-orange-800 sm:text-[9px]"
												>
													<Eye class="h-2 w-2" />
												</span>
											{/if}
											{#if !participant.isHost && participant.isConnected === false}
												<span
													class="flex items-center rounded bg-gray-400 px-1 py-0.5 text-[8px] font-medium text-white sm:text-[9px]"
													title="Disconnected"
												>
													⚫
												</span>
											{/if}
										</div>
									</div>

									<!-- Vote Status Indicator -->
									<div class="flex justify-center">
										{#if !participant.isHost && participant.isConnected === false}
											<div
												class="flex items-center gap-1 rounded bg-gray-300 px-1.5 py-0.5 text-[9px] font-medium text-gray-700 sm:px-2 sm:py-1 sm:text-[10px]"
											>
												⚫ Offline
											</div>
										{:else if participant.isObserver}
											<div
												class="flex items-center gap-1 rounded bg-orange-100 px-1.5 py-0.5 text-[9px] font-medium text-orange-600 sm:px-2 sm:py-1 sm:text-[10px]"
											>
												<Eye class="h-3 w-3" />
												Observer
											</div>
										{:else if votesRevealed && participant.vote}
											<div
												class="bounce-in bg-poker-blue rounded px-2 py-0.5 text-xs font-bold text-white sm:px-2.5 sm:py-1 sm:text-sm"
											>
												{participant.vote}{isManDaysMode ? 'd' : ''}
											</div>
										{:else if participant.voted}
											<div
												class="bounce-in flex items-center gap-1 rounded bg-green-500 px-1.5 py-0.5 text-[9px] font-medium text-white sm:px-2 sm:py-1 sm:text-[10px]"
											>
												<CheckCircle class="h-3 w-3" />
												Voted
											</div>
										{:else if votingInProgress}
											<div
												class="thinking flex items-center gap-1 rounded bg-yellow-100 px-1.5 py-0.5 text-[9px] font-medium text-yellow-700 sm:px-2 sm:py-1 sm:text-[10px]"
											>
												<BrainCog size={16} color="#e52424" strokeWidth={1} />
												Thinking
											</div>
										{:else}
											<div
												class="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-500 sm:px-2 sm:py-1 sm:text-[10px]"
											>
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
		<div
			class="fixed bottom-4 left-1/2 w-full -translate-x-1/2 transform {isManDaysMode
				? 'max-w-md'
				: getEstimationFrameWidth()} px-4 sm:bottom-6"
		>
			<Card class="work-area">
				<CardContent class="p-2 sm:p-3">
					{#if isManDaysMode}
						<p class="mb-1 text-center text-xs font-medium sm:text-sm">Enter estimated man days:</p>
						<div class="mb-2 flex items-center justify-center gap-1">
							<Lightbulb class="h-3 w-3 text-yellow-500" />
							<p class="text-center text-[10px] text-gray-500 sm:text-xs">
								Enter number of workdays (decimals allowed: 1, 2.5, 0.5)
							</p>
						</div>

						<div class="flex gap-2">
							<Input
								type="number"
								step="0.1"
								min="0"
								bind:value={manDaysInput}
								placeholder="e.g., 2.5"
								class="flex-1"
								onkeydown={(e) => {
									if (e.key === 'Enter') {
										submitManDaysVote();
									}
								}}
							/>
							<Button
								onclick={submitManDaysVote}
								disabled={!manDaysInput || !!selectedVote}
								class="bg-poker-blue hover:bg-poker-blue/90"
							>
								{selectedVote ? 'Voted' : 'Vote'}
							</Button>
						</div>

						{#if selectedVote}
							<div class="mt-2 text-center">
								<div class="flex items-center justify-center gap-1 text-xs text-green-600">
									<CheckCircle class="h-3 w-3" />
									<p>Voted: {selectedVote} day{parseFloat(selectedVote) !== 1 ? 's' : ''}</p>
								</div>
								<Button
									onclick={() => {
										selectedVote = null;
										manDaysInput = '';
									}}
									variant="outline"
									size="sm"
									class="mt-1 text-xs"
								>
									Change Vote
								</Button>
							</div>
						{/if}
					{:else}
						<p class="mb-1 text-center text-xs font-medium sm:text-sm">Choose your estimate:</p>
						<div class="mb-2 flex items-center justify-center gap-1">
							<Lightbulb class="h-3 w-3 text-yellow-500" />
							<p class="text-center text-[10px] text-gray-500 sm:text-xs">
								Press 0-8 or ? to vote quickly
							</p>
						</div>
						<div class="flex flex-wrap justify-center {getButtonGap()}">
							{#each storyPointOptions as option (option)}
								<Button
									onclick={() => selectVote(option)}
									variant={selectedVote === option ? 'default' : 'outline'}
									class={getButtonClasses(selectedVote === option)}
								>
									{option}
								</Button>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>
	{/if}

	<!-- Observer Message (Bottom) -->
	{#if votingInProgress && !votesRevealed && isObserver}
		<div
			class="fixed bottom-4 left-1/2 w-full max-w-2xl -translate-x-1/2 transform px-4 sm:bottom-8"
		>
			<Card class="work-area">
				<CardContent class="p-4 sm:p-6">
					<div
						class="flex items-center justify-center gap-2 text-center text-sm text-orange-600 sm:text-base"
					>
						<Eye class="h-5 w-5" />
						<p>You are observing this session. Toggle to participant mode to vote.</p>
					</div>
				</CardContent>
			</Card>
		</div>
	{/if}
</div>

<RoundsDrawer show={showRoundsDrawer} {rounds} onClose={() => (showRoundsDrawer = false)} />

<!-- Shareable Link Modal -->
<ShareableLinkModal
	isOpen={showShareableLinkModal}
	{sessionCode}
	{sessionTitle}
	onJoin={handleShareableLinkJoin}
	onCancel={handleShareableLinkCancel}
	isLoading={isJoiningViaLink}
	error={shareableLinkError}
/>

<!-- New Round Modal -->
<NewRoundModal
	isOpen={showNewRoundModal}
	onClose={() => (showNewRoundModal = false)}
	onConfirm={handleNewRound}
	isLoading={isStartingNewRound}
/>

<!-- Remove Participant Confirmation Dialog -->
{#if showRemoveConfirmation && participantToRemove}
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
		<Card class="w-96 max-w-[90vw] bg-white">
			<CardContent class="p-6">
				<h3 class="mb-4 text-lg font-semibold">Remove Participant</h3>
				<p class="mb-6 text-gray-600">
					Are you sure you want to remove <strong>{participantToRemove}</strong> from this session? This
					action cannot be undone.
				</p>
				<div class="flex justify-end gap-3">
					<Button variant="outline" onclick={cancelRemoveParticipant} class="btn-poker-gray">
						Cancel
					</Button>
					<Button
						onclick={removeParticipant}
						class="border-red-500 bg-red-500 text-white hover:border-red-600 hover:bg-red-600"
					>
						Remove
					</Button>
				</div>
			</CardContent>
		</Card>
	</div>
{/if}

<style>
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	@keyframes slideInUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@keyframes scaleIn {
		from {
			transform: scale(0.8);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	.thinking {
		animation: pulse 2s infinite;
	}

	.bounce-in {
		animation: scaleIn 0.3s ease-out;
	}
</style>
