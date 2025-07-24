# Sizing Tool

A modern Planning Poker/Story Point Sizing Tool built with SvelteKit for agile development teams. This client-side only application uses localStorage for data persistence with no backend dependencies.

## Features

- **Anonymous & Named Voting**: Flexible voting modes for different team preferences
- **Configurable Point Scales**: Fibonacci sequences, T-shirt sizes, and custom scales
- **Session Management**: 8-digit alphanumeric session codes for easy sharing
- **Privacy-First Design**: All data stays local, no external communication
- **Real-time Collaboration**: Multiple participants per session

## Installation

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/captain-soban/sizing-tool.git
   cd sizing-tool
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run all tests
npm run test:unit    # Run Vitest unit tests
npm run test:e2e     # Run Playwright E2E tests
npm run lint         # Run ESLint and Prettier checks
npm run format       # Format code with Prettier
npm run check        # Type check with svelte-check
```

## Technology Stack

- **SvelteKit** with **Svelte 5** (using runes API)
- **TypeScript** for type safety
- **shadcn-svelte** UI component library
- **Tailwind CSS v4** with custom properties
- **Vite** for build tooling

## Docker Support

Build and run with Docker:

```bash
docker build -t sizing-tool .
docker run -p 3000:3000 sizing-tool
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).
