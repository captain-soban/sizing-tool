<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { generateSessionCode } from '$lib/stores/session';

	let sessionCode = $state('');
	let playerName = $state('');

	function createSession() {
		const code = generateSessionCode();
		localStorage.setItem('sessionCode', code);
		localStorage.setItem('playerName', playerName);
		localStorage.setItem('isHost', 'true');
		goto(`/session/${code}`);
	}

	function joinSession() {
		if (sessionCode.length === 8 && playerName.trim()) {
			localStorage.setItem('sessionCode', sessionCode.toUpperCase());
			localStorage.setItem('playerName', playerName);
			localStorage.setItem('isHost', 'false');
			goto(`/session/${sessionCode.toUpperCase()}`);
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
			<div class="space-y-2">
				<label for="playerName" class="text-sm font-medium"> Your Name </label>
				<Input id="playerName" type="text" bind:value={playerName} placeholder="Enter your name" />
			</div>

			<div class="space-y-4">
				<Button
					onclick={createSession}
					disabled={!playerName.trim()}
					class="bg-poker-blue hover:bg-poker-blue/90 w-full"
				>
					Create New Session
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
					disabled={!playerName.trim() || sessionCode.length !== 8}
					class="btn-poker-gray w-full"
				>
					Join Session
				</Button>
			</div>
		</CardContent>
	</Card>
</div>
