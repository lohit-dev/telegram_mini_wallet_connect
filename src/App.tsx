import { useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";
import { defaultChain } from "./wagmi";

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        close: () => void;
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        sendData: (data: string) => void;
      };
    };
  }
}

function App() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId() || defaultChain.id;

  useEffect(() => {
    // Initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      console.log("Telegram WebApp initialized");
    }
  }, []);

  useEffect(() => {
    if (!window.Telegram?.WebApp) {
      console.error("Telegram WebApp not found");
      return;
    }

    const webApp = window.Telegram.WebApp;

    // Set up MainButton for connected state
    if (isConnected && address) {
      console.log("Wallet connected, setting up MainButton");
      webApp.MainButton.text = "CONFIRM WALLET";

      const handleClick = () => {
        console.log("MainButton clicked, sending data:", {
          address,
          chainId: chainId.toString(),
        });

        try {
          webApp.sendData(
            JSON.stringify({
              address: address,
              chainId: chainId.toString(),
            })
          );
          console.log("Data sent successfully");
          webApp.close();
        } catch (error) {
          console.error("Error sending data:", error);
        }
      };

      webApp.MainButton.onClick(handleClick);
      webApp.MainButton.show();
    } else {
      console.log("Wallet not connected, hiding MainButton");
      webApp.MainButton.hide();
    }

    return () => {
      // Cleanup
      if (window.Telegram?.WebApp) {
        webApp.MainButton.hide();
        webApp.MainButton.offClick(() => {});
      }
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
            <p className="network">
              Network: {chainId === 1 ? "Mainnet" : "Sepolia"}
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
