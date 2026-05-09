# Donation Tree Progress Demo

This is a Bolt-friendly Vite React sample for a live donation visualization.

The reusable piece is `src/DonationTree3D.jsx`:

```jsx
<DonationTree3D
  amount={100}
  target={1000}
  campaignName="Plumbing Repairs"
/>
```

The tree always maps `amount / target` to a 0-100% progress value. Black vines are drawn for the full target, and colored vine geometry is drawn from the roots upward to represent the proposed donation amount.

Run locally:

```bash
npm install
npm run dev
```
