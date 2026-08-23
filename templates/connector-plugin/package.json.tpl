{
  "name": "dsh-plugin-{{slug}}",
  "version": "0.1.0",
  "description": "{{title}} connector for DeepSeek Harness",
  "type": "module",
  "exports": "./src/index.js",
  "files": ["src", "cordis.patch.yml", "README.md", "LICENSE"],
  "scripts": {
    "test": "node --test ./test/*.test.js"
  },
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" }
  },
  "peerDependencies": {
    "@deepseek-ai/cordis": "^4.0.1",
    "@deepseek-ai/dsh-tools": "^0.1.1-rc.2"
  },
  "dependencies": {
    "@deepseek-ai/schemastery": "^3.18.1",
    "dsh-enterprise-suite": "^0.1.0"
  },
  "devDependencies": {
    "@deepseek-ai/cordis": "^4.0.1",
    "@deepseek-ai/dsh-llm": "^0.1.1-rc.2",
    "@deepseek-ai/dsh-system-prompt": "^0.1.1-rc.2",
    "@deepseek-ai/dsh-tools": "^0.1.1-rc.2"
  },
  "license": "MIT"
}
