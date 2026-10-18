import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'.',testMatch:'*.spec.mjs',fullyParallel:false,workers:1,reporter:'list',outputDir:'artifacts',use:{baseURL:'http://127.0.0.1:4179',trace:'retain-on-failure'},webServer:{command:'node serve.mjs',url:'http://127.0.0.1:4179',reuseExistingServer:false,timeout:30000}});
