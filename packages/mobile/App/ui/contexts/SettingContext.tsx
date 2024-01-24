import { createContext } from "react"

interface SettingContextData {
  getSetting: (path: string) => any;
  getString: (path: string, defaultValue?: string) => string;
  getBool: (path: string, defaultValue?: boolean) => boolean;
}

const SettingContext = createContext<
