<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
</script>

<!-- Hero Section -->
<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
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

	<!-- Main Content -->
	<div class="container mx-auto px-6 py-16">
		<div class="max-w-4xl mx-auto text-center">
			<!-- Hero Title -->
			<div class="space-y-6 mb-12">
				<h1 class="text-6xl md:text-7xl font-bold tracking-tight">
					<span class="bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
						Estimate
					</span>
					<br>
					<span class="text-gray-900">with Confidence</span>
				</h1>
				<p class="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
					Modern Planning Poker for agile teams. Estimate story points collaboratively with 
					<span class="text-blue-600 font-semibold">privacy-first</span> design.
				</p>
			</div>

			<!-- Feature Cards -->
			<div id="features" class="grid md:grid-cols-3 gap-6 mb-12">
				<Card class="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
					<CardContent class="p-6 text-center">
						<div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
							<span class="text-white text-xl">🎯</span>
						</div>
						<h3 class="font-semibold text-lg mb-2 text-gray-900">Accurate Estimates</h3>
						<p class="text-gray-600 text-sm">Fibonacci sequences, T-shirt sizes, and custom scales for precise estimation</p>
					</CardContent>
				</Card>

				<Card class="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
					<CardContent class="p-6 text-center">
						<div class="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
							<span class="text-white text-xl">🔒</span>
						</div>
						<h3 class="font-semibold text-lg mb-2 text-gray-900">Privacy First</h3>
						<p class="text-gray-600 text-sm">All data stays local. No external servers, no data collection</p>
					</CardContent>
				</Card>

				<Card class="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
					<CardContent class="p-6 text-center">
						<div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
							<span class="text-white text-xl">⚡</span>
						</div>
						<h3 class="font-semibold text-lg mb-2 text-gray-900">Instant Setup</h3>
						<p class="text-gray-600 text-sm">No registration required. Generate session codes and start estimating immediately</p>
					</CardContent>
				</Card>
			</div>

			<!-- CTA Button -->
			<div class="space-y-4 mb-20">
				<Button 
					class="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white text-lg px-8 py-4 h-auto rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
					onclick={() => window.location.href = '/sizes'}
				>
					<div class="flex items-center space-x-2">
						<span>Start Your Session</span>
						<span class="text-xl">→</span>
					</div>
				</Button>
				<p class="text-sm text-gray-500">Free forever • No sign-up required</p>
			</div>

			<!-- How It Works Section -->
			<section id="how-it-works" class="mb-20">
				<div class="max-w-3xl mx-auto">
					<h2 class="text-4xl font-bold text-center mb-12 text-gray-900">How It Works</h2>
					<div class="grid md:grid-cols-3 gap-8">
						<div class="text-center">
							<div class="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
								<span class="text-white text-2xl font-bold">1</span>
							</div>
							<h3 class="text-xl font-semibold mb-3 text-gray-900">Create Session</h3>
							<p class="text-gray-600">Generate an 8-digit session code that your team members can join</p>
						</div>
						<div class="text-center">
							<div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
								<span class="text-white text-2xl font-bold">2</span>
							</div>
							<h3 class="text-xl font-semibold mb-3 text-gray-900">Vote Anonymously</h3>
							<p class="text-gray-600">Team members estimate story points using Fibonacci, T-shirt sizes, or custom scales</p>
						</div>
						<div class="text-center">
							<div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
								<span class="text-white text-2xl font-bold">3</span>
							</div>
							<h3 class="text-xl font-semibold mb-3 text-gray-900">Reveal Results</h3>
							<p class="text-gray-600">See all votes simultaneously and discuss any discrepancies as a team</p>
						</div>
					</div>
				</div>
			</section>

			<!-- About Section -->
			<section id="about" class="mb-20">
				<div class="max-w-3xl mx-auto text-center">
					<h2 class="text-4xl font-bold mb-8 text-gray-900">Why Planning Poker?</h2>
					<div class="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
						<p class="text-lg text-gray-700 leading-relaxed mb-6">
							Planning Poker is a consensus-based technique for estimating effort or relative size of development goals. 
							It helps teams avoid the influence of anchoring bias where the first number spoken aloud sets a precedent for subsequent estimates.
						</p>
						<div class="grid md:grid-cols-2 gap-6 text-left">
							<div>
								<h4 class="font-semibold text-red-600 mb-2">Benefits:</h4>
								<ul class="space-y-1 text-gray-600">
									<li>• Reduces estimation bias</li>
									<li>• Encourages team discussion</li>
									<li>• Improves estimation accuracy</li>
									<li>• Builds team consensus</li>
								</ul>
							</div>
							<div>
								<h4 class="font-semibold text-blue-600 mb-2">Privacy Features:</h4>
								<ul class="space-y-1 text-gray-600">
									<li>• No data collection</li>
									<li>• Local storage only</li>
									<li>• No registration required</li>
									<li>• No external dependencies</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	</div>

	<!-- Bottom Wave -->
	<div class="relative">
		<svg 
			class="w-full h-24 fill-current text-gray-100" 
			viewBox="0 0 1440 120" 
			xmlns="http://www.w3.org/2000/svg"
		>
			<path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
		</svg>
	</div>
</div>

<!-- Footer -->
<footer class="bg-gray-100 py-8">
	<div class="container mx-auto px-6 text-center">
		<p class="text-gray-600">
			Built with ❤️ for agile development teams
		</p>
	</div>
</footer>