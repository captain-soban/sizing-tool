<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { onMount } from 'svelte';
	import { fly, scale } from 'svelte/transition';
	import { spring, tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { theme, toggleTheme } from '$lib/stores/theme.svelte';

	// Animation state
	let mounted = $state(false);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let visible = $state(false);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let heroVisible = $state(false);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let featuresVisible = $state(false);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let howItWorksVisible = $state(false);

	// Floating elements animation
	const floatY = spring(0, { stiffness: 0.1, damping: 0.3 });
	const rotateAngle = tweened(0, { duration: 20000, easing: cubicOut });

	// Scroll observer
	let observer: IntersectionObserver;

	onMount(() => {
		mounted = true;
		setTimeout(() => (visible = true), 100);
		setTimeout(() => (heroVisible = true), 300);

		// Start background animations
		startFloatingAnimation();

		// Set up intersection observer for scroll animations
		setupScrollAnimations();

		return () => {
			if (observer) observer.disconnect();
		};
	});

	function startFloatingAnimation() {
		setInterval(() => {
			floatY.set(Math.sin(Date.now() / 1000) * 20);
			rotateAngle.set($rotateAngle + 0.5);
		}, 50);
	}

	function setupScrollAnimations() {
		observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const id = entry.target.id;
						if (id === 'features') featuresVisible = true;
						if (id === 'how-it-works') howItWorksVisible = true;
					}
				});
			},
			{ threshold: 0.1 }
		);

		// Observe elements
		const featuresEl = document.getElementById('features');
		const howItWorksEl = document.getElementById('how-it-works');
		if (featuresEl) observer.observe(featuresEl);
		if (howItWorksEl) observer.observe(howItWorksEl);
	}
</script>

<!-- Hero Section -->
<div
	class="from-blue-50 via-white to-red-50 relative min-h-screen overflow-hidden bg-gradient-to-br"
>
	<!-- Animated Background Elements -->
	{#if mounted}
		<div class="inset-0 pointer-events-none absolute overflow-hidden">
			<!-- Floating geometric shapes -->
			<div
				class="top-20 left-10 w-20 h-20 from-blue-200/30 to-blue-300/30 blur-xl absolute rounded-full bg-gradient-to-br"
				style="transform: translateY({$floatY}px) rotate({$rotateAngle}deg)"
				in:scale={{ duration: 2000, delay: 500 }}
			></div>
			<div
				class="top-40 right-20 w-16 h-16 from-red-200/30 to-red-300/30 rounded-lg blur-lg absolute bg-gradient-to-br"
				style="transform: translateY({$floatY * -0.8}px) rotate({$rotateAngle * -1}deg)"
				in:scale={{ duration: 2000, delay: 800 }}
			></div>
			<div
				class="bottom-32 w-12 h-12 from-purple-200/30 to-purple-300/30 blur-lg absolute left-1/4 rounded-full bg-gradient-to-br"
				style="transform: translateY({$floatY * 1.2}px) rotate({$rotateAngle * 0.7}deg)"
				in:scale={{ duration: 2000, delay: 1200 }}
			></div>
			<div
				class="top-60 w-8 h-8 from-yellow-200/30 to-yellow-300/30 blur-md absolute right-1/3 rounded-full bg-gradient-to-br"
				style="transform: translateY({$floatY * -1.5}px) rotate({$rotateAngle * 1.3}deg)"
				in:scale={{ duration: 2000, delay: 1000 }}
			></div>
		</div>
	{/if}
	<!-- Navigation -->
	<nav
		class="px-6 py-4 backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border-gray-200/60 dark:border-gray-700/60 top-0 shadow-sm sticky z-50 w-full border-b"
		in:fly={{ y: -50, duration: 600, delay: 200 }}
	>
		<div class="container mx-auto">
			<div class="flex items-center justify-between">
				<div class="space-x-12 flex items-center">
					<a
						href="/"
						class="text-gray-700 dark:text-gray-300 hover:text-red-600 font-medium text-lg transition-all duration-200"
					>
						Home
					</a>
				</div>
				<div class="space-x-4 flex items-center">
					<!-- Theme Toggle -->
					<Button
						variant="ghost"
						size="sm"
						class="w-9 h-9 p-0 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all duration-300"
						onclick={toggleTheme}
					>
						{#if theme.value === 'light'}
							<span class="text-lg">🌙</span>
						{:else}
							<span class="text-lg">☀️</span>
						{/if}
					</Button>
					<Button
						variant="ghost"
						class="bg-gray-500 hover:bg-gray-600 text-white border-gray-400 text-lg hover:-translate-y-0.5 transform transition-all duration-300 hover:scale-105"
						onclick={() => (window.location.href = '/admin')}
					>
						Admin
					</Button>
					<Button
						class="from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl text-lg hover:-translate-y-0.5 transform bg-gradient-to-r transition-all duration-300 hover:scale-105"
						onclick={() => (window.location.href = '/sizes')}
					>
						Start Sizing
					</Button>
				</div>
			</div>
		</div>
	</nav>

	<!-- Bento Box Layout -->
	<div class="px-6 py-8 container mx-auto min-h-screen">
		<!-- Hero Section -->
		<div class="max-w-6xl mb-16 mx-auto" in:fly={{ y: 50, duration: 800, delay: 400 }}>
			<div class="mb-12 text-center">
				<h1 class="text-5xl md:text-7xl font-bold tracking-tight mb-6">
					<span
						class="from-red-600 via-purple-600 to-blue-600 bg-gradient-to-r bg-clip-text text-transparent"
					>
						Planning Poker
					</span>
				</h1>
				<p
					class="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed mx-auto"
				>
					Modern story point estimation for agile teams with
					<span class="text-blue-600 font-semibold">privacy-first</span> design
				</p>
			</div>
		</div>

		<!-- Bento Grid -->
		<div class="max-w-7xl mx-auto" id="features">
			<div class="md:grid-cols-4 lg:grid-cols-6 gap-4 grid h-auto grid-cols-1">
				<!-- Main CTA Box (Large) -->
				<div
					class="md:col-span-2 lg:col-span-3 md:row-span-2 group"
					in:fly={{ y: 50, duration: 600, delay: 100 }}
				>
					<Card
						class="from-red-500 to-blue-600 border-blue-800 shadow-xl hover:shadow-2xl rounded-2xl h-full border-2 bg-gradient-to-br transition-all duration-500 hover:scale-[1.02]"
					>
						<CardContent
							class="p-8 text-white flex h-full flex-col items-center justify-center text-center"
						>
							<div class="mb-6">
								<div
									class="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 mx-auto flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
								>
									<span class="text-4xl">🎯</span>
								</div>
								<h2 class="text-3xl md:text-4xl font-bold mb-4">Start Estimating</h2>
								<p class="text-lg text-white/90 mb-8 max-w-md">
									Create a session in seconds and get your team estimating story points
									collaboratively
								</p>
							</div>
							<Button
								class="bg-white text-red-600 hover:bg-gray-50 text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl font-semibold h-auto transform transition-all duration-300 hover:scale-105"
								onclick={() => (window.location.href = '/sizes')}
							>
								Start Your Session →
							</Button>
						</CardContent>
					</Card>
				</div>

				<!-- Privacy Box -->
				<div
					class="md:col-span-1 lg:col-span-1 group"
					in:fly={{ y: 50, duration: 600, delay: 200 }}
				>
					<Card
						class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-blue-800 shadow-lg hover:shadow-xl rounded-2xl h-full border-2 transition-all duration-300 hover:scale-105"
					>
						<CardContent class="p-6 flex h-full flex-col items-center justify-center text-center">
							<div
								class="w-12 h-12 from-green-500 to-emerald-600 mb-4 rounded-xl flex items-center justify-center bg-gradient-to-br transition-transform duration-300 group-hover:scale-110"
							>
								<span class="text-white text-2xl">🔒</span>
							</div>
							<h3 class="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">Privacy First</h3>
							<p class="text-gray-600 dark:text-gray-300 text-sm">All data stays local</p>
						</CardContent>
					</Card>
				</div>

				<!-- Fast Setup Box -->
				<div
					class="md:col-span-1 lg:col-span-1 group"
					in:fly={{ y: 50, duration: 600, delay: 300 }}
				>
					<Card
						class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-blue-800 shadow-lg hover:shadow-xl rounded-2xl h-full border-2 transition-all duration-300 hover:scale-105"
					>
						<CardContent class="p-6 flex h-full flex-col items-center justify-center text-center">
							<div
								class="w-12 h-12 from-purple-500 to-violet-600 mb-4 rounded-xl flex items-center justify-center bg-gradient-to-br transition-transform duration-300 group-hover:scale-110"
							>
								<span class="text-white text-2xl">⚡</span>
							</div>
							<h3 class="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">Instant Setup</h3>
							<p class="text-gray-600 dark:text-gray-300 text-sm">No registration needed</p>
						</CardContent>
					</Card>
				</div>

				<!-- Scales Box -->
				<div
					class="md:col-span-1 lg:col-span-1 group"
					in:fly={{ y: 50, duration: 600, delay: 400 }}
				>
					<Card
						class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-blue-800 shadow-lg hover:shadow-xl rounded-2xl h-full border-2 transition-all duration-300 hover:scale-105"
					>
						<CardContent class="p-6 flex h-full flex-col items-center justify-center text-center">
							<div
								class="w-12 h-12 from-orange-500 to-red-600 mb-4 rounded-xl flex items-center justify-center bg-gradient-to-br transition-transform duration-300 group-hover:scale-110"
							>
								<span class="text-white text-2xl">📊</span>
							</div>
							<h3 class="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">Custom Scales</h3>
							<p class="text-gray-600 dark:text-gray-300 text-sm">Fibonacci, T-shirt, or custom</p>
						</CardContent>
					</Card>
				</div>

				<!-- How It Works (Wide) -->
				<div
					class="md:col-span-2 lg:col-span-2 group"
					in:fly={{ y: 50, duration: 600, delay: 500 }}
				>
					<Card
						class="from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-800 shadow-lg hover:shadow-xl rounded-2xl h-full border-2 bg-gradient-to-r transition-all duration-300 hover:scale-105"
					>
						<CardContent class="p-6 h-full">
							<h3 class="font-bold text-xl mb-4 text-gray-900 dark:text-gray-100 text-center">
								How It Works
							</h3>
							<div class="gap-4 grid grid-cols-3 text-center">
								<div class="flex flex-col items-center">
									<div
										class="w-10 h-10 from-red-500 to-red-600 mb-2 flex items-center justify-center rounded-full bg-gradient-to-br"
									>
										<span class="text-white font-bold">1</span>
									</div>
									<span class="text-xs text-gray-700 dark:text-gray-300">Create</span>
								</div>
								<div class="flex flex-col items-center">
									<div
										class="w-10 h-10 from-blue-500 to-blue-600 mb-2 flex items-center justify-center rounded-full bg-gradient-to-br"
									>
										<span class="text-white font-bold">2</span>
									</div>
									<span class="text-xs text-gray-700 dark:text-gray-300">Estimate</span>
								</div>
								<div class="flex flex-col items-center">
									<div
										class="w-10 h-10 from-purple-500 to-purple-600 mb-2 flex items-center justify-center rounded-full bg-gradient-to-br"
									>
										<span class="text-white font-bold">3</span>
									</div>
									<span class="text-xs text-gray-700 dark:text-gray-300">Reveal</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<!-- Anonymous Voting -->
				<div
					class="md:col-span-1 lg:col-span-1 group"
					in:fly={{ y: 50, duration: 600, delay: 600 }}
				>
					<Card
						class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-blue-800 shadow-lg hover:shadow-xl rounded-2xl h-full border-2 transition-all duration-300 hover:scale-105"
					>
						<CardContent class="p-6 flex h-full flex-col items-center justify-center text-center">
							<div
								class="w-12 h-12 from-teal-500 to-cyan-600 mb-4 rounded-xl flex items-center justify-center bg-gradient-to-br transition-transform duration-300 group-hover:scale-110"
							>
								<span class="text-white text-2xl">👥</span>
							</div>
							<h3 class="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">Anonymous</h3>
							<p class="text-gray-600 dark:text-gray-300 text-sm">Unbiased voting</p>
						</CardContent>
					</Card>
				</div>

				<!-- Real-time -->
				<div
					class="md:col-span-1 lg:col-span-1 group"
					in:fly={{ y: 50, duration: 600, delay: 700 }}
				>
					<Card
						class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-blue-800 shadow-lg hover:shadow-xl rounded-2xl h-full border-2 transition-all duration-300 hover:scale-105"
					>
						<CardContent class="p-6 flex h-full flex-col items-center justify-center text-center">
							<div
								class="w-12 h-12 from-pink-500 to-rose-600 mb-4 rounded-xl flex items-center justify-center bg-gradient-to-br transition-transform duration-300 group-hover:scale-110"
							>
								<span class="text-white text-2xl">⚡</span>
							</div>
							<h3 class="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">Real-time</h3>
							<p class="text-gray-600 dark:text-gray-300 text-sm">Live collaboration</p>
						</CardContent>
					</Card>
				</div>
			</div>

			<!-- Additional Info Section -->
			<div class="mt-8 text-center">
				<p class="text-sm text-gray-500 dark:text-gray-400">
					Free forever • No sign-up required • Privacy-first design
				</p>
			</div>
		</div>
	</div>

	<!-- Bottom Wave -->
	<div class="relative">
		<svg
			class="h-24 text-gray-100 w-full fill-current"
			viewBox="0 0 1440 120"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
			></path>
		</svg>
	</div>
</div>

<!-- Footer -->
<footer class="bg-gray-100 dark:bg-gray-800 py-8">
	<div class="px-6 container mx-auto text-center">
		<p class="text-gray-600 dark:text-gray-300">Built with ❤️ for agile development teams</p>
	</div>
</footer>
