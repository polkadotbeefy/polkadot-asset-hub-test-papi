# BEEFY Airdrop Suite

- [main](https://github.com/polkadotbeefy/polkadot-asset-hub-test-papi/tree/main) - Transacting with BEEFY assets with single receiver, using `transfer_keep_alive`.
- [feature/batch-transactions](https://github.com/polkadotbeefy/polkadot-asset-hub-test-papi/tree/feature/batch-transactions) - Transacting with BEEFY assets with multiple receivers, using `batchAll`.

## Instructions

Run the dApp:
```zsh
pnpm i
pnpm papi update && pnpm papi
pnpm dev
```

Next, open the dApp at `http://localhost:5173/` in your browser.



## Known issues

- Console error: `Error when executing Utility.batch_all`

    **Solution:** Make sure to update an run `papi` to avoid issues:
    `pnpm papi update && pnpm papi`

