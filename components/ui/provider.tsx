"use client";

import mainTheme from "@/theme/mainTheme";
import { ChakraProvider } from "@chakra-ui/react";
import { ReactNode } from "react";

export function Provider({ children }: { children: ReactNode }) {
  return <ChakraProvider value={mainTheme}>{children}</ChakraProvider>;
}
