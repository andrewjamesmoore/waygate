import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import App from "./App.tsx";

// Define the Chakra UI theme with teal accent color
const theme = extendTheme({
  colors: {
    brand: {
      50: "#E6FFFA",
      100: "#B2F5EA",
      200: "#81E6D9",
      300: "#4FD1C5",
      400: "#38B2AC",
      500: "#319795",
      600: "#2C7A7B",
      700: "#285E61",
      800: "#234E52",
      900: "#1D4044",
    },
    darkBg: {
      100: "#121212", // Main background
      200: "#1A1A1A", // Very subtle hover color
    },
  },
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  styles: {
    global: (props: { colorMode: string }) => ({
      body: {
        bg: props.colorMode === "dark" ? "#121212" : "white", // Very dark background in dark mode
        color: props.colorMode === "dark" ? "white" : "gray.800",
        fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
      },
    }),
  },
  fonts: {
    body: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
    heading: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
  },
  semanticTokens: {
    colors: {
      accent: {
        default: "gray.500",
        _dark: "gray.300",
      },
      accentBg: {
        default: "gray.50",
        _dark: "gray.700",
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "medium",
        borderRadius: "md",
      },
      variants: {
        solid: (props: { colorMode: string }) => ({
          bg: props.colorMode === "dark" ? "gray.600" : "gray.500",
          color: "white",
          _hover: {
            bg: props.colorMode === "dark" ? "gray.500" : "gray.600",
          },
        }),
        outline: {
          borderColor: "gray.500",
          color: "gray.500",
          _dark: {
            borderColor: "gray.300",
            color: "gray.300",
          },
        },
        ghost: {
          color: "gray.500",
          _dark: {
            color: "gray.300",
          },
        },
      },
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </StrictMode>
);
