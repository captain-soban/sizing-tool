<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { defaultStoryPointScales } from '$lib/stores/session';
	import { SessionClient } from '$lib/api/sessionClient';

	const sessionCode = $page.params.sessionCode!;

	let sessionTitle = $state('Sprint Planning Session');
	let selectedScale = $state('fibonacci_0_8');
	let customScale = $state('');
	let isHost = $state(false);
	let sessionClient: SessionClient;
	let originalTitle = $state('');

	onMount(async () => {
		const storedIsHost = localStorage.getItem('isHost') === 'true';
		const storedSessionCode = localStorage.getItem('sessionCode');

		if (storedSessionCode !== sessionCode) {
			goto('/');
			return;
		}

		isHost = storedIsHost;
		sessionClient = new SessionClient();

		try {
			// Load current session data from server
			const sessionData = await sessionClient.getSession(sessionCode);
			sessionTitle = sessionData.title;
			originalTitle = sessionData.title;
		} catch (error) {
			console.error('[Settings] Error loading session:', error);
			// Fallback to localStorage
			const storedTitle = localStorage.getItem(`session_${sessionCode}_title`);
			if (storedTitle) {
				sessionTitle = storedTitle;
				originalTitle = storedTitle;
			}
		}

		// Load scale settings from localStorage (these are still local preferences)
		const storedScale = localStorage.getItem(`session_${sessionCode}_scale`);
		if (storedScale) selectedScale = storedScale;
	});

	async function saveSettings() {
		try {
			// Update session title on server if it changed
			if (isHost && sessionTitle !== originalTitle && sessionClient) {
				await sessionClient.updateSessionTitle(sessionCode, sessionTitle);
			}

			// Save local preferences to localStorage
			localStorage.setItem(`session_${sessionCode}_scale`, selectedScale);

			if (selectedScale === 'custom' && customScale) {
				const customScaleArray = customScale
					.split(',')
					.map((s) => s.trim())
					.filter((s) => s);
				localStorage.setItem(
					`session_${sessionCode}_custom_scale`,
					JSON.stringify(customScaleArray)
				);
			}

			goto(`/session/${sessionCode}`);
		} catch (error) {
			console.error('[Settings] Error saving settings:', error);
			// Still navigate back even if there's an error
			goto(`/session/${sessionCode}`);
		}
	}

	function goBack() {
		goto(`/session/${sessionCode}`);
	}

	function getScalePreview(scaleKey: string): string {
		if (scaleKey === 'custom') {
			const customScaleArray = customScale
				.split(',')
				.map((s) => s.trim())
				.filter((s) => s);
			return customScaleArray.length > 0 ? customScaleArray.join(', ') : 'Enter values...';
		}
		return (
			defaultStoryPointScales[scaleKey as keyof typeof defaultStoryPointScales]?.join(', ') || ''
		);
	}
</script>

<div class="flex min-h-screen items-center justify-center p-4">
	<Card class="work-area w-full max-w-2xl">
		<CardHeader>
			<CardTitle class="text-poker-blue text-center text-2xl font-bold">Session Settings</CardTitle>
			<p class="text-muted-foreground text-center">Session: {sessionCode}</p>
		</CardHeader>
		<CardContent class="space-y-6">
			<!-- Session Title -->
			<div class="space-y-2">
				<label for="sessionTitle" class="text-sm font-medium">Session Title</label>
				<Input
					id="sessionTitle"
					type="text"
					bind:value={sessionTitle}
					placeholder="Enter session title"
					disabled={!isHost}
				/>
				{#if !isHost}
					<p class="text-muted-foreground text-xs">Only the host can change session settings</p>
				{/if}
			</div>

			<!-- Story Point Scale -->
			<div class="space-y-4">
				<label class="text-sm font-medium">Story Point Scale</label>

				<div class="space-y-3">
					{#each Object.entries(defaultStoryPointScales) as [key, scale] (key)}
						<div class="flex items-center space-x-3">
							<input
								type="radio"
								id={key}
								bind:group={selectedScale}
								value={key}
								disabled={!isHost}
								class="text-poker-blue focus:ring-poker-blue h-4 w-4"
							/>
							<label for={key} class="flex-1 cursor-pointer">
								<div class="font-medium capitalize">
									{key
										.replace('_', ' ')
										.replace('fibonacci', 'Fibonacci')
										.replace('tshirt', 'T-Shirt')}
								</div>
								<div class="text-muted-foreground text-sm">
									{scale.join(', ')}
								</div>
							</label>
						</div>
					{/each}

					<!-- Custom Scale Option -->
					<div class="flex items-start space-x-3">
						<input
							type="radio"
							id="custom"
							bind:group={selectedScale}
							value="custom"
							disabled={!isHost}
							class="text-poker-blue focus:ring-poker-blue mt-1 h-4 w-4"
						/>
						<div class="flex-1">
							<label for="custom" class="cursor-pointer font-medium">Custom Scale</label>
							<Input
								type="text"
								bind:value={customScale}
								placeholder="Enter comma-separated values (e.g., 1, 2, 4, 8, 16)"
								disabled={!isHost || selectedScale !== 'custom'}
								class="mt-2"
							/>
							<div class="text-muted-foreground mt-1 text-sm">
								Preview: {getScalePreview('custom')}
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="flex gap-3 pt-4">
				<Button onclick={goBack} variant="outline" class="btn-poker-gray flex-1">
					Back to Session
				</Button>
				{#if isHost}
					<Button onclick={saveSettings} class="bg-poker-blue hover:bg-poker-blue/90 flex-1">
						Save Settings
					</Button>
				{/if}
			</div>
		</CardContent>
	</Card>
</div>
