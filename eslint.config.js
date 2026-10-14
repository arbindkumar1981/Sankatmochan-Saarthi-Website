import {createRequire} from 'node:module';

// CI quality tools are pinned separately from the application's dependencies.
const require=createRequire(new URL('./tests/emulator/package.json',import.meta.url));
const parser=require('@typescript-eslint/parser');
export default [{ignores:['dist/**','node_modules/**']},{
  files:['src/**/*.{ts,tsx}'],
  languageOptions:{parser,parserOptions:{ecmaVersion:'latest',sourceType:'module',ecmaFeatures:{jsx:true}}},
  rules:{'no-debugger':'error','no-duplicate-case':'error','no-dupe-args':'error','no-unreachable':'error','valid-typeof':'error','constructor-super':'error','no-unsafe-finally':'error'},
}];
