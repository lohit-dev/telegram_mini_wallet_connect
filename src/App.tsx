import { useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";
import { defaultChain } from "./wagmi";

function App() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId() || defaultChain.id;

  useEffect(() => {
    // Initialize Telegram WebApp
    window.Telegram.WebApp.ready();

    // Set up MainButton for connected state
    if (isConnected && address) {
      window.Telegram.WebApp.MainButton.text = "CONFIRM WALLET";
      window.Telegram.WebApp.MainButton.onClick(() => {
        window.Telegram.WebApp.sendData(
          JSON.stringify({
            address: address,
            chainId: chainId.toString(),
          })
        );
        window.Telegram.WebApp.close();
      });
      window.Telegram.WebApp.MainButton.show();
    } else {
      window.Telegram.WebApp.MainButton.hide();
    }

    return () => {
      // Cleanup
      window.Telegram.WebApp.MainButton.hide();
      window.Telegram.WebApp.MainButton.onClick(() => {});
    };
  }, [isConnected, address, chainId]);

  return (
    <div className="telegram-container">
      <div className="header">
        <h1>GardenJS Wallet</h1>
      </div>

      <div className="content">
        {!isConnected ? (
          <div className="connect-section">
            <h2>Connect Wallet</h2>
            <div className="button-group">
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                  className="connect-button"
                >
                  {connector.name === "WalletConnect" && "🔗 "}
                  {connector.name === "Coinbase Wallet" && "💰 "}
                  {connector.name === "Injected" && "🦊 "}
                  {connector.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="wallet-info">
            <h2>Connected Wallet</h2>
            <p className="address">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
            <button onClick={() => disconnect()} className="disconnect-button">
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
