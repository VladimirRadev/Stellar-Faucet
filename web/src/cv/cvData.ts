import type { SiteKey } from '../shell/sites'

/**
 * Content of the CV page. It is a transcription of the PDF in public/cv/ (the ATS version of
 * 2026-10-09). To update the site: copy the new PDF into public/cv/ (keep or update `pdf.fileName`),
 * then edit the text below so the HTML page and the PDF say the same thing.
 */

export const pdf = {
  /** File name inside public/cv/ and the name the browser saves it under. */
  fileName: 'CV-VLADIMIR-RADEV_2026_Blockchain.pdf',
  pages: 2,
  /** Date of the PDF, shown on the page as "Last updated". ISO yyyy-mm-dd. */
  updated: '2026-10-09',
} as const

/** Absolute path of the PDF on this site (respects Vite's `base`). */
export const pdfUrl = `${import.meta.env.BASE_URL}cv/${pdf.fileName}`

export type ContactKind = 'email' | 'phone' | 'linkedin' | 'github'
export type Contact = { kind: ContactKind; label: string; href: string }

export const profile: {
  name: string
  title: string
  location: string
  availability: string
  contacts: readonly Contact[]
} = {
  name: 'Vladimir Radev',
  title: 'Blockchain Developer | Solidity | Web3 Full-Stack',
  location: 'Sofia, Bulgaria',
  availability: 'Open to work since Aug 2026',
  contacts: [
    { kind: 'email', label: 'vladimiradev@gmail.com', href: 'mailto:vladimiradev@gmail.com' },
    { kind: 'phone', label: '+359 879 324 734', href: 'tel:+359879324734' },
    { kind: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/vladimir-radev-8730321b6' },
    { kind: 'github', label: 'GitHub', href: 'https://github.com/VladimirRadev' },
  ],
}

export const summary =
  'Blockchain Developer building EVM smart contracts and full-stack Web3 dApps: Solidity with Foundry, Hardhat and OpenZeppelin (ERC-20, ERC-721, ERC-1155), DeFi protocols (AMM, staking, lending), smart contract security and testing, and blockchain integration with TypeScript, React, Next.js, Node.js, wagmi and viem. Almost 2 years as a Web Developer & ERP / Odoo Integrator (Python / Django, REST APIs) for 10+ clients. Open to work since Aug 2026.'

/** One skill group per line of the PDF. `lines` is the PDF text split at its semicolons. */
export const skills: readonly { group: string; lines: readonly string[] }[] = [
  {
    group: 'Smart contracts',
    lines: [
      'Solidity, EVM, Ethereum, Foundry (forge, anvil), Hardhat, OpenZeppelin v4 / v5 (AccessControl, upgradeable), UUPS / transparent proxies, timelocks',
      'token standards ERC-20, ERC-721, ERC-1155, ERC-2612, ERC-3009, ERC-3643 (T-REX security tokens, RWA tokenization)',
      'DeFi (AMM, staking, lending), Uniswap V3, Gnosis Safe multisig',
      'smart contract security (role-based access control, price-manipulation guards, commit-reveal randomness)',
      'applied cryptography (EIP-712 typed-data signatures, ERC-2612 / ERC-3009 permits, SIWE)',
      'Etherscan / Sourcify verification',
    ],
  },
  {
    group: 'Blockchain infra',
    lines: [
      'Ethereum mainnet & Sepolia testnet, Avalanche L1 / Subnet-EVM, Cosmos SDK (Go), EVM event indexers (custom, Ponder), Infura / Alchemy RPC, Blockscout, IPFS, SIWE, wallet integration (WalletConnect, RainbowKit, Keplr)',
    ],
  },
  {
    group: 'Backend',
    lines: [
      'Python (FastAPI, SQLAlchemy async, Alembic, Pydantic, Celery, Django), TypeScript / Node.js (NestJS, Express, Fastify, tRPC, Drizzle ORM, zod), Go (chi, pgx, gRPC), REST API / OpenAPI, WebSockets',
    ],
  },
  {
    group: 'Frontend',
    lines: [
      'React 19, Next.js 15 / 16 (App Router), TypeScript, JavaScript, wagmi, viem, ethers.js v6, web3.js, Tailwind CSS v4, shadcn/ui, TanStack Query, Vite, Vue 3, HTML5, CSS',
    ],
  },
  {
    group: 'Data, DevOps & Testing',
    lines: [
      'PostgreSQL, Redis, Supabase, SQL, Docker / Docker Compose (containerization), Git, GitHub Actions CI/CD, Cloudflare Workers, nginx, Prometheus, Bash',
      'testing with Foundry unit / fuzz / invariant tests, mainnet & Sepolia fork tests, coverage gates, Hardhat + mocha / chai, Vitest, Jest, Playwright, pytest',
    ],
  },
  {
    group: 'ERP & Integrations',
    lines: [
      'Odoo Enterprise 18 / 19, REST APIs, e-commerce & delivery integrations (Econt / Sameday / Speedy), business process automation',
    ],
  },
  {
    group: 'Programming languages',
    lines: [
      'Solidity, TypeScript, JavaScript, Python, Go, SQL, Bash, C++ (OOP, data structures & algorithms)',
      'familiar with Rust and Java',
    ],
  },
]

export const experience: readonly { role: string; org: string; dates: string; bullets: readonly string[] }[] = [
  {
    role: 'Blockchain Developer',
    org: 'Independent projects (open to work)',
    dates: 'Aug 2026 – Present',
    bullets: [
      'Designed and deployed 10 Solidity smart contracts on Ethereum Sepolia: ERC-20 token with role-based minting and a faucet, constant-product AMM, MasterChef-style staking farm, lending / credit protocol, ERC-1155 item shop, on-chain game and arcade, voting oracle and prediction market.',
      'Built 6 React / TypeScript dApps with wagmi and viem and shipped them to GitHub Pages through GitHub Actions CI/CD pipelines.',
      'Tested the contracts with Foundry unit, fuzz and invariant tests and executed 25+ on-chain integration transactions on Sepolia.',
    ],
  },
  {
    role: 'Web Developer & ERP / Odoo Integrator',
    org: 'Industria Technology',
    dates: '2024 – Jul 2026',
    bullets: [
      'Delivered 10+ client ERP implementations on Odoo Enterprise 18 and 19, including customizations and custom module development.',
      'Integrated 3 delivery & logistics APIs (Econt, Sameday, Speedy) into client e-commerce and ERP workflows.',
      'Developed REST APIs and third-party / e-commerce integrations, Django web applications, business process automation and database integrations across almost 2 years of client work.',
    ],
  },
  {
    role: 'Intern',
    org: 'Nemetschek Bulgaria (Internship Program)',
    dates: '2019',
    bullets: [],
  },
]

export const projectsIntro = {
  title: 'Stellar, personal Web3 suite on Ethereum Sepolia (2026)',
  note: 'Stellar is a personal portfolio brand (not the Stellar/XLM network).',
  summary:
    '10 verified Solidity contracts, 6 React/TypeScript dApps, CI/CD with GitHub Actions, 25+ on-chain integration transactions on Sepolia.',
} as const

/** The six Stellar apps. The live URL and the repository come from shell/sites.ts via `site`. */
export const projects: readonly { site: SiteKey; name: string; description: string }[] = [
  {
    site: 'faucet',
    name: 'Stellar Faucet',
    description:
      'ERC-20 token "Vladimir ($VLAD)" with role-based minting (OpenZeppelin AccessControl) and a cooldown faucet; Foundry tests, Sourcify / Blockscout verification, React + wagmi + viem dApp on GitHub Pages.',
  },
  {
    site: 'lp-staking',
    name: 'Stellar Swap & LP Staking',
    description:
      'Own constant-product AMM (ETH/VLAD, 0.3% fee, LP token) and a MasterChef-style staking farm emitting VLAD rewards; invariant-style forge tests.',
  },
  {
    site: 'bank',
    name: 'Stellar Bank',
    description:
      'DeFi credit protocol: VLAD savings with on-chain interest accrual, ETH-collateralized credit lines (LTV, health factor, liquidation), AMM-based price feed with same-block manipulation guard.',
  },
  {
    site: 'store',
    name: 'Stellar Store',
    description:
      'ERC-1155 game-item shop paid in VLAD, role-gated consume / award for the game, metadata hosted on GitHub Pages.',
  },
  {
    site: 'arena',
    name: 'Stellar Arena',
    description:
      'Provably fair "play for keeps" on-chain game: commit-reveal + blockhash randomness, prize pool, item boosts from the store, canvas front end, plus a 29-cabinet provably fair arcade (5 game kinds, shared prize pool).',
  },
  {
    site: 'stellargon',
    name: 'Stellargon',
    description:
      'Polymarket-style prediction market on real-world events, paid in VLAD: parimutuel pools, implied odds, 2% fee to the Arena prize pool, human voting oracle where reporters stake VLAD and the minority is slashed.',
  },
]

export const education: readonly { degree: string; school: string; dates: string }[] = [
  {
    degree: "Master's degree (MSc) — Mechatronics & Robotics",
    school: 'Sofia University, Faculty of Mathematics and Informatics (FMI)',
    dates: '2024 – Jun 2026',
  },
  {
    degree: "Bachelor's degree (BSc) — Software Engineering",
    school: 'Sofia University, Faculty of Mathematics and Informatics (FMI)',
    dates: '2020 – 2024',
  },
  {
    degree: 'High school diploma — Mathematics',
    school: 'National High School of Natural Sciences and Mathematics, Sofia',
    dates: '2015 – 2020',
  },
]

export const certifications: readonly string[] = ['Odoo 18 Certified Professional']

export const languages: readonly { name: string; level: string }[] = [
  { name: 'English', level: 'Fluent' },
  { name: 'Bulgarian', level: 'Native' },
]
