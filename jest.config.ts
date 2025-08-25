export default {
    clearMocks: true,
    coverageProvider: "v8",
    preset: "ts-jest/presets/js-with-ts",
    setupFiles: ["dotenv/config"],
    transform: {
        "^.+\\.mjs$": "ts-jest",
    },
    testTimeout: 60000,
    testPathIgnorePatterns: ["node_modules", "dist", "^.*\.skip\..*$"]
};