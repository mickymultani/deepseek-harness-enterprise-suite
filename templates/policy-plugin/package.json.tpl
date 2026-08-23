{
  "name": "dsh-policy-{{slug}}",
  "version": "0.1.0",
  "description": "{{title}} policy for DeepSeek Harness",
  "type": "module",
  "exports": "./src/index.js",
  "files": ["src", "cordis.patch.yml", "README.md", "LICENSE"],
  "dsh": { "bundle": { "patch": "./cordis.patch.yml" } },
  "peerDependencies": {
    "@deepseek-ai/cordis": "^4.0.1",
    "@deepseek-ai/dsh-tools": "^0.1.1-rc.2"
  },
  "dependencies": { "@deepseek-ai/schemastery": "^3.18.1" },
  "license": "MIT"
}
