

<div align="center">
<img width="200" alt="Image" src="https://github.com/user-attachments/assets/8b617791-cd37-4a5a-8695-a7c9018b7c70" />
<br>
<br>
<h1>Onramp Quickstart</h1>

<div align="center">
<a href="https://www.crossmint.com/quickstarts">All Quickstarts</a> | <a href="https://docs.crossmint.com/payments/headless/quickstarts/onramp">Onramp Docs</a>
</div>

<br>
<br>
</div>

## Introduction
Create and fund a crypto wallet using Crossmint Onramp. This quickstart walks through creating an order, completing KYC (Persona) when required, collecting payment via Checkout.com Flow, and tracking delivery to the recipient wallet.

**Learn how to:**
- Create an onramp order
- Handle KYC via Persona when required
- Collect payment with Checkout.com Web Components (Flow)
- Track delivery status and show the resulting transaction id

## Deploy
Easily deploy the template to Vercel with the button below. You will need to set the required environment variables in the Vercel dashboard.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCrossmint%2Fonramp-quickstart&env=CROSSMINT_SERVER_SIDE_API_KEY,CROSSMINT_ENV)

## Setup
1. Clone the repository and navigate to the project folder:
```bash
git clone https://github.com/crossmint/onramp-quickstart.git && cd onramp-quickstart
```

2. Install all dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Set up the environment variables:
```bash
cp .env.template .env
```

4. Get a Crossmint server API key from [here](https://docs.crossmint.com/introduction/platform/api-keys/server-side) and add it to the `.env` file. Ensure it has the scopes: `orders.read` and `orders.create`. The following variables are used by the API routes in this project:
```bash
CROSSMINT_SERVER_SIDE_API_KEY=your_server_api_key

# staging | production
CROSSMINT_ENV=staging
```

5. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Using in production
1. Create a [production server-side API key](https://docs.crossmint.com/introduction/platform/api-keys/server-side) key and set `CROSSMINT_ENV=production`.
