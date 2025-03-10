interface TelegramWebApps {
  WebApp: {
    ready(): void;
    close(): void;
    expand(): void;
    sendData(data: any): void;
    MainButton: {
      text: string;
      color: string;
      textColor: string;
      isVisible: boolean;
      isActive: boolean;
      show(): void;
      hide(): void;
      onClick(callback: Function): void;
    };
  };
}

declare global {
  interface Window {
    Telegram: TelegramWebApps;
  }
}

export {};
