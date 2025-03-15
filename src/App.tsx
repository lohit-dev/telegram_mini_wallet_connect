import { useEffect, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useChainId,
  useSignMessage,
} from "wagmi";
import { defaultChain } from "./wagmi";
import { WebApp } from "@grammyjs/web-app";

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
        themeParams: {
          bg_color: string;
          text_color: string;
          button_color: string;
          button_text_color: string;
        };
      };
    };
  }
}

function App() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId() || defaultChain.id;
  const [isProcessing, setIsProcessing] = useState(false);
  const { signMessageAsync } = useSignMessage();

  // Initialize WebApp
  useEffect(() => {
    // Expand the WebApp
    WebApp.expand();

    // Log debug info
    console.log("WebApp Info:", {
      platform: WebApp.platform,
      version: WebApp.version,
      initData: WebApp.initData,
      colorScheme: WebApp.colorScheme,
    });
  }, []);

  // Handle wallet connection state
  useEffect(() => {
    if (isConnected && address) {
      console.log("Wallet connected:", { address, chainId });
      WebApp.MainButton.text = "CONFIRM WALLET";
      WebApp.MainButton.show();
      WebApp.MainButton.enable();

      const handleConfirm = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        WebApp.MainButton.text = "PROCESSING...";
        WebApp.MainButton.disable();

        try {
          // Request signature
          console.log("Requesting signature...");
          const message = `Connect wallet to GardenJS\n\nWallet: ${address}\nChain: ${chainId}`;
          const signature = await signMessageAsync({
            message,
            account: address,
          });
          console.log("Message signed successfully:", signature);

          // Prepare and send data
          const data = {
            address,
            chainId: chainId.toString(),
            signature,
          };

          console.log("Sending data...");
          WebApp.MainButton.text = "SENDING DATA...";

          try {
            WebApp.sendData(JSON.stringify(data));
            console.log("Data sent successfully");

            // Show success and close
            WebApp.MainButton.text = "COMPLETED ✓";
            await new Promise((resolve) => setTimeout(resolve, 1000));
            WebApp.close();
          } catch (error) {
            console.error("Failed to send data:", error);
            WebApp.MainButton.text = "ERROR SENDING DATA";
            setIsProcessing(false);
            WebApp.MainButton.enable();
          }
        } catch (error) {
          console.error("Signature failed:", error);
          WebApp.MainButton.text = "SIGNATURE FAILED";
          setIsProcessing(false);
          WebApp.MainButton.enable();

          setTimeout(() => {
            WebApp.MainButton.text = "CONFIRM WALLET";
          }, 2000);
        }
      };

      WebApp.MainButton.onClick(handleConfirm);
    } else {
      WebApp.MainButton.hide();
    }

    // Cleanup
    return () => {
      WebApp.MainButton.offClick(() => {});
      // WebApp.close();
    };
  }, [isConnected, address, chainId, signMessageAsync, isProcessing]);

  return (
    <div
      className="telegram-container"
      style={{
        backgroundColor: WebApp.themeParams.bg_color,
        color: WebApp.themeParams.text_color,
      }}
    >
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
                  style={{
                    backgroundColor: WebApp.themeParams.button_color,
                    color: WebApp.themeParams.button_text_color,
                  }}
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
            <button
              onClick={() => disconnect()}
              className="disconnect-button"
              style={{
                backgroundColor: WebApp.themeParams.button_color,
                color: WebApp.themeParams.button_text_color,
              }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
