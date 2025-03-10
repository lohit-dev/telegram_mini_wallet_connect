import { useEffect, useState } from "react";
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
          enable: () => void;
          disable: () => void;
        };
        sendData: (data: string) => void;
        initData: string;
        initDataUnsafe: {
          query_id: string;
          user: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
          auth_date: string;
          hash: string;
        };
        isExpanded: boolean;
        expand: () => void;
        platform: string;
      };
    };
  }
}

function App() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId() || defaultChain.id;
  const [isWebAppReady, setIsWebAppReady] = useState(false);

  // Initialize Telegram WebApp
  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    // Debug logging
    const logDebugInfo = () => {
      const info = {
        isTelegramAvailable: !!window.Telegram,
        isWebAppAvailable: !!window.Telegram?.WebApp,
        platform: tg?.platform,
        initData: tg?.initData,
        initDataUnsafe: tg?.initDataUnsafe,
        isExpanded: tg?.isExpanded,
      };
      console.log("Debug Info:", info);
    };

    if (tg) {
      console.log("Initializing Telegram WebApp");
      try {
        tg.ready();
        tg.expand();
        setIsWebAppReady(true);
        console.log("Telegram WebApp initialized successfully");
        logDebugInfo();
      } catch (error) {
        console.error("Error initializing Telegram WebApp:", error);
      }
    } else {
      console.error("Telegram WebApp not available");
    }
  }, []);

  // Handle wallet connection state
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg || !isWebAppReady) return;

    if (isConnected && address) {
      console.log("Wallet connected:", { address, chainId });
      tg.MainButton.text = "CONFIRM WALLET";
      tg.MainButton.show();
      tg.MainButton.enable();

      const handleConfirm = () => {
        const data = {
          address: address,
          chainId: chainId.toString(),
        };
        console.log("Sending data to Telegram:", data);

        try {
          tg.sendData(JSON.stringify(data));
          console.log("Data sent successfully");
          // Add a small delay before closing
          setTimeout(() => {
            tg.close();
          }, 100);
        } catch (error) {
          console.error("Failed to send data:", error);
        }
      };

      tg.MainButton.onClick(handleConfirm);
    } else {
      tg.MainButton.hide();
    }

    return () => {
      if (tg) {
        tg.MainButton.offClick(() => {});
        tg.MainButton.hide();
      }
    };
  }, [isConnected, address, chainId, isWebAppReady]);

  return (
    <div className="telegram-container">
      <div className="header">
        <h1>GardenJS Wallet</h1>
        <p className="subtitle">Connect your wallet to continue</p>
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
                  {connector.name === "Injected" && "🔑 "}
                  {connector.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="wallet-info">
            <h2>Wallet Connected</h2>
            <p className="address">
              Address: {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
            <p className="network">
              Network: {chainId === 1 ? "Mainnet" : "Sepolia"}
            </p>
            <p className="instruction">
              Click the button below to confirm your wallet
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
