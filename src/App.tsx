import React from "react";
import StockManager from "./component.ts/FetchProduct";
import WalletContextProvider from "./component.ts/connection";
import { CustomWalletMultiButton } from "./component.ts/connection";

const App: React.FC = () => {
  return (
    <WalletContextProvider>
      <div className="min-h-screen bg-black flex flex-col items-center justify-between p-6">
        <h1 className="text-4xl font-bold text-white text-center mb-6 border-2 border-white px-4 py-2 rounded-lg">
          STOCK PRODUCT
        </h1>
        <div className="p-6">
          <CustomWalletMultiButton />
        </div>
        <StockManager />
      </div>
    </WalletContextProvider>
  );
};

export default App;
