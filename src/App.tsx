import { useEffect, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useChainId,
  useSignMessage,
} from "wagmi";
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
  const [isProcessing, setIsProcessing] = useState(false);

  const { signMessageAsync } = useSignMessage();

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

      const handleConfirm = async () => {
        if (isProcessing) return; // Prevent double submission
        setIsProcessing(true);
        tg.MainButton.text = "PROCESSING...";
        tg.MainButton.disable();

        const message = `Connect wallet to GardenJS\n\nWallet: ${address}\nChain: ${chainId}`;
        try {
          console.log("Requesting signature...");
          const signature = await signMessageAsync({
            message,
            account: address,
          });
          console.log("Message signed successfully:", signature);

          const data = {
            address: address,
            chainId: chainId.toString(),
            signature: signature,
          };

          console.log("Sending data to Telegram...");
          tg.MainButton.text = "SENDING DATA...";

          try {
            tg.sendData(JSON.stringify(data));
            console.log("Data sent successfully");

            // Update button text and wait before closing
            tg.MainButton.text = "COMPLETED ✓";
            console.log("Waiting before closing...");

            // Wait for 1.5 seconds before closing
            await new Promise((resolve) => setTimeout(resolve, 1500));

            console.log("Closing WebApp...");
            window.Telegram.WebApp.close();
          } catch (sendError) {
            console.error("Error sending data:", sendError);
            tg.MainButton.text = "ERROR SENDING DATA";
            setIsProcessing(false);
            tg.MainButton.enable();
          }
        } catch (error) {
          console.error("Error in handleConfirm:", error);
          tg.MainButton.text = "SIGNATURE FAILED";
          setIsProcessing(false);
          tg.MainButton.enable();

          // Reset button text after 2 seconds
          setTimeout(() => {
            if (tg) {
              tg.MainButton.text = "CONFIRM WALLET";
            }
          }, 2000);
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
  }, [
    isConnected,
    address,
    chainId,
    isWebAppReady,
    signMessageAsync,
    isProcessing,
  ]);

  return (
    <div className="telegram-container">
      <div className="header">
        <h1>GardenJS Wallet</h1>
        <p className="subtitle">
          {isProcessing
            ? "Processing your request..."
            : "Connect your wallet to continue"}
        </p>
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
