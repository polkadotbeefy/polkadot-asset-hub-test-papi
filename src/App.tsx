import { start } from "polkadot-api/smoldot"
import { chainSpec as polkadotChainspec } from "polkadot-api/chains/polkadot"
import { chainSpec as ahChainspec } from "polkadot-api/chains/polkadot_asset_hub"
import { getSmProvider } from "polkadot-api/sm-provider"
import { createClient } from "polkadot-api"
import { MultiAddress, assetHub } from "@polkadot-api/descriptors"
import React, { useEffect, useState } from "react"
import { InjectedPolkadotAccount, connectInjectedExtension, getInjectedExtensions } from "polkadot-api/pjs-signer"

const ASSET_ID = 420

const smoldot = start()

const polkadot = await smoldot.addChain({
  chainSpec: polkadotChainspec,
  disableJsonRpc: true,
})

const assethubChain = smoldot.addChain({
  chainSpec: ahChainspec,
  potentialRelayChains: [polkadot],
})

const client = createClient(getSmProvider(assethubChain))
const api = client.getTypedApi(assetHub)

const ExtensionSelector: React.FC = () => {
  const [availableExtensions, setAvailableExtensions] = useState<string[]>([])
  const [selectedExtension, setSelectedExtension] = useState<string | null>(
    null,
  )
  const [accounts, setAccounts] = useState<Array<InjectedPolkadotAccount>>([])

  

  useEffect(() => {
    const newExtensions = getInjectedExtensions() || [];
      setAvailableExtensions(newExtensions)
      setSelectedExtension(newExtensions[0] ?? null)
  }, [])

  useEffect(() => {
    if (selectedExtension) {
      const fetchAccounts = async () => {
        const wallet = await connectInjectedExtension(selectedExtension)
        setAccounts(wallet.getAccounts())
      }
      fetchAccounts()
    }
  }, [selectedExtension])

  if (!availableExtensions.length)
    return <div>No Account Providers detected</div>

  return (
    <div>
      <div>
        <label>Wallet: </label>
        <select
          value={selectedExtension ?? ""}
          onChange={(e) => {
            setSelectedExtension(e.target.value)
          }}
        >
          {availableExtensions.map((wallet) => (
            <option key={wallet} value={wallet}>
              {wallet}
            </option>
          ))}
        </select>
      </div>
      {accounts.length ? (
        <App accounts={accounts} />
      ) : (
        <div>No connected accounts :(</div>
      )}
    </div>
  )
}

interface Receiver {
  address: string;
  amount: string;
}

const App: React.FC<{ accounts: InjectedPolkadotAccount[] }> = ({ accounts }) => {
  const [account, setAccount] = useState(accounts[0])
  const [joeBalance, setJoeBalance] = useState<bigint | null>(null)
  const [wndFreeBalance, setWndFreeBalance] = useState<bigint | null>(null)
  const [recipientAddress, setRecipientAddress] = useState(
    "5ELXt7N4gPpN4d1E5c4wKyYhZFCaSDiH5zUxuWsgY4SNrPW5",
  )
  const [amount, setAmount] = useState("")
  const [receivers, setReceivers] = useState<Receiver[]>([])

  useEffect(() => {
    setJoeBalance(null)
    const subscription = api.query.Assets.Account.watchValue(
      ASSET_ID,
      account.address,
    ).subscribe((assetAccount) => {
      setJoeBalance(assetAccount?.balance ?? 0n)
    })

    setWndFreeBalance(null)
    subscription.add(
      api.query.System.Account.watchValue(account.address).subscribe(
        (account) => {
          setWndFreeBalance(account.data.free ?? 0n)
        },
      ),
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [account])

  const addReceiver = () => {
    setReceivers((prev) => [
      ...prev,
      { address: recipientAddress, amount }
    ])
    setRecipientAddress("")
    setAmount("")
  }

  const handleTransact = () => {
    const transfers = receivers.map(({ address, amount }) =>
      api.tx.Assets.transfer_keep_alive({
        id: ASSET_ID,
        amount: BigInt(amount),
        target: MultiAddress.Id(address),
      }).decodedCall
    )

    const batchCall = api.tx.Utility.batch_all({ calls: transfers })
    batchCall.signAndSubmit(account.polkadotSigner)
      .then(console.log)
  }

  return (
    <>
      <div>
        <label>Account: </label>
        <select
          value={account.address}
          onChange={(e) => {
            setAccount(accounts.find((a) => a.address === e.target.value)!)
          }}
        >
          {accounts.map((elm) => (
            <option key={elm.address} value={elm.address}>
              {elm.address}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>
          DOT Free Balance:{" "}
          {wndFreeBalance === null ? "Loading..." : wndFreeBalance.toString()}
        </label>
      </div>
      <div>
        <label>
          BEEFY Balance:{" "}
          {joeBalance === null ? "Loading..." : joeBalance.toString()}
        </label>
      </div>
      <div>
        <label>Receiver: </label>
        <input
          type="text"
          value={recipientAddress}
          onChange={(e) => {
            setRecipientAddress(e.target.value)
          }}
          placeholder="To address"
        />
      </div>
      <div>
        <label>Amount: </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value)
          }}
          placeholder="Enter amount to send"
        />
      </div>
      <button onClick={addReceiver}>Add to receivers</button>
      <ul>
        {receivers.map((receiver, index) => (
          <li key={index}>
            {receiver.address} - {receiver.amount}
          </li>
        ))}
      </ul>
      <button onClick={handleTransact}>Transact</button>
    </>
  )
}

export default ExtensionSelector
