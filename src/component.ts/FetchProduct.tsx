import React, { useEffect, useState } from 'react';
import * as anchor from '@project-serum/anchor';
import { PublicKey, Connection } from '@solana/web3.js';
import { useAnchorWallet } from '@solana/wallet-adapter-react';

const CENTRAL_PDA = '4TCULn9sm7PKjiAQE3s2KQGq3G5eQDTNaPyU5srRRdU9';
const PROGRAM_ID = new PublicKey("7fCTzxzei5se329Gtbhr7cu2C8Qmx1gK7NVFagFKXuBd");

const idl: anchor.Idl = {
  version: "0.1.0",
  name: "progress_tracker",
  instructions: [
    {
      name: "initialize",
      accounts: [
        { name: "baseAccount", isMut: true, isSigner: true },
        { name: "user", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: []
    },
    {
      name: "saveTrade",
      accounts: [
        { name: "baseAccount", isMut: true, isSigner: false }
      ],
      args: [
        { name: "item", type: "string" },
        { name: "price", type: "string" },
        { name: "time", type: "i64" }
      ]
    },
    {
      name: "getTrades",
      accounts: [
        { name: "baseAccount", isMut: false, isSigner: false }
      ],
      args: []
    }
  ],
  accounts: [
    {
      name: "BaseAccount",
      type: {
        kind: "struct",
        fields: [
          { name: "trades", type: { vec: { defined: "Trade" } } }
        ]
      }
    }
  ],
  types: [
    {
      name: "Trade",
      type: {
        kind: "struct",
        fields: [
          { name: "item", type: "string" },
          { name: "price", type: "string" },
          { name: "time", type: "i64" }
        ]
      }
    }
  ]
};

const FetchProduct: React.FC = () => {
  const wallet = useAnchorWallet();
  const [item, setItem] = useState('');
  const [price, setPrice] = useState('');
  const [trades, setTrades] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchTrades = async () => {
    try {
      if (!wallet) {
        console.error("Wallet not connected");
        return;
      }
      const connection = new Connection("https://api.devnet.solana.com");
      const provider = new anchor.AnchorProvider(connection, wallet, anchor.AnchorProvider.defaultOptions());
      const program = new anchor.Program(idl, PROGRAM_ID, provider);
      const baseAccount = new PublicKey(CENTRAL_PDA);

      const accountData = await program.account.baseAccount.fetch(baseAccount);

      if (accountData.trades) {
        setTrades(accountData.trades.map((trade: any) => ({
          item: trade.item,
          price: trade.price,
          time: new Date(trade.time.toNumber() * 1000).toLocaleString()
        })));
      } else {
        console.error("No trades found");
      }
    } catch (err: any) {
      setError(err.message || "Error fetching trades");
      console.error("Error fetching trades:", err);
    }
  };

  const saveTrade = async () => {
    try {
      if (!wallet) {
        console.error("Wallet not connected");
        return;
      }

      const connection = new Connection("https://api.devnet.solana.com");
      const provider = new anchor.AnchorProvider(connection, wallet, anchor.AnchorProvider.defaultOptions());
      const program = new anchor.Program(idl, PROGRAM_ID, provider);
      const baseAccount = new PublicKey(CENTRAL_PDA);
      // USE BLOCKTIME FOR TRADE TIME
      const slot = await connection.getSlot();
      const tradetime =  await connection.getBlockTime(slot);

      const tx = await program.methods.saveTrade(item, price, new anchor.BN(tradetime)).accounts({
        baseAccount: new PublicKey(baseAccount),
      }).rpc();

      console.log("TX FOR ADDING TRADE:", tx);

      fetchTrades(); // Refresh trades
      setItem('');
      setPrice('');
    } catch (err: any) {
      setError(err.message || "Error saving trade");
      console.error("Error saving trade:", err);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      <form
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          saveTrade();
        }}
      >
        <h2 className="text-lg font-bold mb-4">Add Stock</h2>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Item
          </label>
          <input
            type="text"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Price
          </label>
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Save Product
        </button>
      </form>

      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
        <h2 className="text-lg font-bold mb-4">Products</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <ul>
          {trades.map((trade, index) => (
            <li key={index} className="mb-2">
              <strong>Item:</strong> {trade.item} <br />
              <strong>Price:</strong> {trade.price} <br />
              <strong>Time:</strong> {trade.time}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FetchProduct;