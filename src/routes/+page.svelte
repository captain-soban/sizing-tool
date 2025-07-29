<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { SessionClient } from '$lib/api/sessionClient';

	let sessionCode = $state('');
	let playerName = $state('');
	let isCreating = $state(false);
	let isJoining = $state(false);
	let error = $state('');

	const sessionClient = new SessionClient();

	async function createSession() {
		if (!playerName.trim()) return;

		isCreating = true;
		error = '';

		try {
			const session = await sessionClient.createSession(playerName.trim());
			localStorage.setItem('sessionCode', session.sessionCode);
			localStorage.setItem('playerName', playerName.trim());
			localStorage.setItem('isHost', 'true');
			goto(`/session/${session.sessionCode}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create session';
			console.error('[Landing] Error creating session:', err);
		} finally {
			isCreating = false;
		}
	}

	async function joinSession() {
		if (sessionCode.length !== 8 || !playerName.trim()) return;

		isJoining = true;
		error = '';

		try {
			const upperSessionCode = sessionCode.toUpperCase();
			await sessionClient.joinSession(upperSessionCode, playerName.trim());
			localStorage.setItem('sessionCode', upperSessionCode);
			localStorage.setItem('playerName', playerName.trim());
			localStorage.setItem('isHost', 'false');
			goto(`/session/${upperSessionCode}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to join session';
			console.error('[Landing] Error joining session:', err);
		} finally {
			isJoining = false;
		}
	}

	function handleSessionCodeInput(event: Event) {
		const target = event.target as HTMLInputElement;
		sessionCode = target.value.toUpperCase();
	}
</script>

<div class="flex min-h-screen items-center justify-center p-4">
	<Card class="work-area w-full max-w-md">
		<CardHeader>
			<CardTitle class="text-poker-blue text-center text-3xl font-bold">Planning Poker</CardTitle>
		</CardHeader>
		<CardContent class="space-y-6">
			<!-- Error Message -->
			{#if error}
				<div class="rounded-md bg-red-100 p-3 text-sm text-red-800">
					{error}
				</div>
			{/if}

			<div class="space-y-2">
				<label for="playerName" class="text-sm font-medium"> Your Name </label>
				<Input id="playerName" type="text" bind:value={playerName} placeholder="Enter your name" />
			</div>

			<div class="space-y-4">
				<Button
					onclick={createSession}
					disabled={!playerName.trim() || isCreating || isJoining}
					class="bg-poker-blue hover:bg-poker-blue/90 w-full"
				>
					{#if isCreating}
						Creating...
					{:else}
						Create New Session
					{/if}
				</Button>

				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t"></div>
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="text-muted-foreground bg-white px-2">or</span>
					</div>
				</div>

				<div class="space-y-2">
					<label for="sessionCode" class="text-sm font-medium"> Session Code </label>
					<Input
						id="sessionCode"
						type="text"
						bind:value={sessionCode}
						placeholder="Enter 8-digit code"
						maxlength={8}
						class="uppercase"
						oninput={handleSessionCodeInput}
					/>
				</div>

				<Button
					onclick={joinSession}
					disabled={!playerName.trim() || sessionCode.length !== 8 || isCreating || isJoining}
					class="btn-poker-gray w-full"
				>
					{#if isJoining}
						Joining...
					{:else}
						Join Session
					{/if}
				</Button>
			</div>
		</CardContent>
	</Card>
</div>
