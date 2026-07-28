import { defineConfig } from "vite"
import react from "@vitejs/plugin-react" // Or vue(), depending on your framework

export default defineConfig({
  plugins: [react()],
  base: "/TaskTracker-MobileApp-IT1050", // 👈 Make sure to add this line
})
