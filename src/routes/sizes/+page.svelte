<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { localStore } from '$lib/localStore.js';

	// Game state
	let gameState = localStore('poker-game', {
		sessionCode: '',
		playerName: '',
		isHost: false,
		gameStarted: false,
		currentStory: '',
		votes: {} as Record<string, string>,
		revealed: false,
		selectedCard: null as string | null
	});

	// Reactive values from the store
	let sessionCode = $state('');
	let playerName = $state('');
	let isHost = $state(false);
	let gameStarted = $state(false);
	let currentStory = $state('');
	let votes = $state<Record<string, string>>({});
	let revealed = $state(false);
	let selectedCard = $state<string | null>(null);

	// Subscribe to store changes
	gameState.subscribe(value => {
		sessionCode = value.sessionCode;
		playerName = value.playerName;
		isHost = value.isHost;
		gameStarted = value.gameStarted;
		currentStory = value.currentStory;
		votes = value.votes;
		revealed = value.revealed;
		selectedCard = value.selectedCard;
	});

	// Card values for different scales
	const fibonacciCards = ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', ''];
	const tshirtCards = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?', ''];
	
	let currentScale = $state('fibonacci');
	let cards = $state(fibonacciCards);

	// Form inputs
	let sessionInput = $state('');
	let playerNameInput = $state('');
	let storyInput = $state('');

	function generateSessionCode() {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude 0, O, 1, I for clarity
		return Array.from({length: 8}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
	}

	function startNewSession() {
		if (!playerNameInput.trim()) return;
		
		gameState.update(state => ({
			...state,
			sessionCode: generateSessionCode(),
			playerName: playerNameInput.trim(),
			isHost: true,
			gameStarted: true,
			votes: {},
			revealed: false,
			selectedCard: null
		}));
	}

	function joinSession() {
		if (!sessionInput.trim() || !playerNameInput.trim()) return;
		
		gameState.update(state => ({
			...state,
			sessionCode: sessionInput.trim().toUpperCase(),
			playerName: playerNameInput.trim(),
			isHost: false,
			gameStarted: true,
			votes: {},
			revealed: false,
			selectedCard: null
		}));
	}

	function selectCard(value: string) {
		gameState.update(state => ({
			...state,
			selectedCard: value,
			votes: { ...state.votes, [state.playerName]: value }
		}));
	}

	function revealCards() {
		gameState.update(state => ({ ...state, revealed: true }));
	}

	function newRound() {
		gameState.update(state => ({
			...state,
			votes: {},
			revealed: false,
			selectedCard: null,
			currentStory: storyInput.trim()
		}));
	}

	function changeScale(scale: string) {
		currentScale = scale;
		cards = scale === 'fibonacci' ? fibonacciCards : tshirtCards;
		gameState.update(state => ({ ...state, selectedCard: null }));
	}

	function resetGame() {
		gameState.update(state => ({
			...state,
			sessionCode: '',
			playerName: '',
			isHost: false,
			gameStarted: false,
			currentStory: '',
			votes: {},
			revealed: false,
			selectedCard: null
		}));
	}

	// Calculate vote statistics
	$effect(() => {
		if (revealed && Object.keys(votes).length > 0) {
			const numericVotes = Object.values(votes)
				.filter(vote => !isNaN(Number(vote)) && vote !== '?' && vote !== '')
				.map(Number);
			
			if (numericVotes.length > 0) {
				const avg = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;
				console.log(`Average: ${avg.toFixed(1)}`);
			}
		}
	});
</script>

<!-- Navigation -->
<nav class="w-full px-6 py-4 backdrop-blur-md bg-white/90 border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
	<div class="container mx-auto">
		<div class="flex items-center justify-center space-x-12">
			<a href="/" class="text-gray-700 hover:text-red-600 transition-all duration-200 font-medium text-lg">
				Home
			</a>
			<Button 
				variant="ghost"
				class="bg-gray-500 hover:bg-gray-600 text-white border-gray-400 text-lg"
				onclick={() => window.location.href = '/admin'}
			>
				Admin
			</Button>
			<Button 
				class="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
				onclick={() => window.location.href = '/sizes'}
			>
				Start Sizing
			</Button>
		</div>
	</div>
</nav>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 p-6">
	<div class="container mx-auto max-w-6xl">
		{#if !gameStarted}
			<!-- Session Setup -->
			<div class="flex justify-center items-center min-h-[80vh]">
				<Card class="bg-white border-blue-200 shadow-xl max-w-md w-full">
					<CardContent class="p-8 text-center space-y-6">
						<h1 class="text-3xl font-bold text-blue-800 mb-2">Planning Poker</h1>
						<p class="text-gray-600 mb-8">Choose your story points collaboratively</p>

						<div class="space-y-4">
							<Input
								type="text"
								placeholder="Your name"
								bind:value={playerNameInput}
								class="text-center text-lg p-4"
							/>

							<div class="flex flex-col space-y-3">
								<Button
									onclick={startNewSession}
									disabled={!playerNameInput.trim()}
									class="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white py-3 text-lg"
								>
									Start New Session
								</Button>

								<div class="flex items-center space-x-2">
									<hr class="flex-1 border-gray-300" />
									<span class="text-gray-500 text-sm">or</span>
									<hr class="flex-1 border-gray-300" />
								</div>

								<div class="space-y-2">
									<Input
										type="text"
										placeholder="Session Code"
										bind:value={sessionInput}
										class="text-center text-lg p-3 uppercase"
										maxlength={8}
									/>
									<Button
										onclick={joinSession}
										disabled={!sessionInput.trim() || !playerNameInput.trim()}
										variant="outline"
										class="w-full bg-gray-500 hover:bg-gray-600 text-white border-gray-400 py-3 text-lg"
									>
										Join Session
									</Button>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		{:else}
			<!-- Game Interface -->
			<div class="space-y-6">
				<!-- Header -->
				<Card class="bg-white border-blue-200 shadow-lg">
					<CardContent class="p-6">
						<div class="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
							<div class="text-center md:text-left">
								<h1 class="text-2xl font-bold text-blue-800">Session: {sessionCode}</h1>
								<p class="text-gray-600">Player: <span class="font-semibold">{playerName}</span></p>
							</div>
							
							<div class="flex items-center space-x-4">
								<!-- Scale Selector -->
								<div class="flex bg-gray-100 rounded-lg p-1">
									<button
										onclick={() => changeScale('fibonacci')}
										class="px-4 py-2 rounded-md transition-colors {currentScale === 'fibonacci' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}"
									>
										Fibonacci
									</button>
									<button
										onclick={() => changeScale('tshirt')}
										class="px-4 py-2 rounded-md transition-colors {currentScale === 'tshirt' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}"
									>
										T-Shirts
									</button>
								</div>
								
								<Button
									onclick={resetGame}
									variant="outline"
									class="bg-gray-500 hover:bg-gray-600 text-white border-gray-400"
								>
									Leave Session
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				<!-- Story Input (Host only) -->
				{#if isHost}
					<Card class="bg-white border-green-200 shadow-lg">
						<CardContent class="p-6">
							<div class="flex items-center space-x-4">
								<Input
									type="text"
									placeholder="Enter the story/feature to estimate..."
									bind:value={storyInput}
									class="flex-1 text-lg p-3"
								/>
								<Button
									onclick={newRound}
									class="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
								>
									New Round
								</Button>
							</div>
						</CardContent>
					</Card>
				{/if}

				<!-- Current Story -->
				{#if currentStory}
					<Card class="bg-yellow-50 border-yellow-200 shadow-lg">
						<CardContent class="p-6 text-center">
							<h2 class="text-xl font-semibold text-gray-800 mb-2">Current Story</h2>
							<p class="text-lg text-gray-700">{currentStory}</p>
						</CardContent>
					</Card>
				{/if}

				<!-- Voting Cards -->
				<Card class="bg-white border-gray-200 shadow-lg">
					<CardContent class="p-6">
						<h2 class="text-xl font-semibold text-center mb-6 text-gray-800">
							{revealed ? 'Votes Revealed' : 'Choose Your Card'}
						</h2>
						
						<div class="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 max-w-4xl mx-auto mb-6">
							{#each cards as card}
								<button
									onclick={() => selectCard(card)}
									disabled={revealed}
									class="aspect-[3/4] bg-white border-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-2xl font-bold hover:scale-105 disabled:hover:scale-100 {
										selectedCard === card 
											? 'border-blue-500 bg-blue-50 scale-105' 
											: 'border-gray-300 hover:border-blue-300'
									} {
										revealed 
											? 'cursor-not-allowed opacity-60' 
											: 'cursor-pointer hover:bg-blue-50'
									}"
								>
									{card === '' ? '' : card}
								</button>
							{/each}
						</div>

						<!-- Action Buttons -->
						<div class="flex justify-center space-x-4">
							{#if isHost}
								{#if !revealed}
									<Button
										onclick={revealCards}
										disabled={Object.keys(votes).length === 0}
										class="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 text-lg"
									>
										Reveal Cards
									</Button>
								{:else}
									<Button
										onclick={newRound}
										class="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
									>
										Start New Round
									</Button>
								{/if}
							{/if}
						</div>
					</CardContent>
				</Card>

				<!-- Results -->
				{#if revealed && Object.keys(votes).length > 0}
					<Card class="bg-white border-green-200 shadow-lg">
						<CardContent class="p-6">
							<h2 class="text-xl font-semibold text-center mb-6 text-gray-800">Results</h2>
							<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
								{#each Object.entries(votes) as [player, vote]}
									<div class="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
										<div class="font-semibold text-gray-800 mb-2">{player}</div>
										<div class="text-3xl font-bold text-blue-600">
											{vote === '' ? '' : vote}
										</div>
									</div>
								{/each}
							</div>
						</CardContent>
					</Card>
				{/if}

				<!-- Players waiting indicator -->
				{#if !revealed && Object.keys(votes).length > 0}
					<Card class="bg-blue-50 border-blue-200 shadow-lg">
						<CardContent class="p-4 text-center">
							<p class="text-blue-800">
								<span class="font-semibold">{Object.keys(votes).length}</span> 
								{Object.keys(votes).length === 1 ? 'player has' : 'players have'} voted
							</p>
						</CardContent>
					</Card>
				{/if}
			</div>
		{/if}
	</div>
</div>