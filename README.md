# TiaoGaragem

App Android (Expo / React Native) para controlar a manutenção de carros e motos: checklist semanal, troca de óleo, documentos (IPVA e licenciamento) e backup no Google Drive — tudo salvo localmente em SQLite no aparelho.

📥 **[Baixar o APK mais recente](https://patrickcaloriocarvalho.github.io/TiaoGaragem/)**

## Funcionalidades

- Cadastro de veículos (carro ou moto), com placa, RENAVAM, UF e odômetro
- Checklist semanal de pneu, água e óleo com foto e status (ok / atenção / crítico)
- Controle de troca de óleo por km e por tempo, com alerta de vencimento
- Controle de IPVA e licenciamento com lembrete de vencimento
- Notificações locais para lembrar das pendências
- Backup e restauração dos dados via Google Drive

## Stack

- [Expo](https://docs.expo.dev/versions/v57.0.0/) SDK 57 + Expo Router
- React Native 0.86 / React 19
- SQLite local (`expo-sqlite`)
- TypeScript

## Rodando localmente

```bash
npm install
npm run android   # com um dispositivo/emulador Android conectado
```

> Este projeto usa Continuous Native Generation: a pasta `android/` não é versionada e é gerada automaticamente por `expo prebuild` (disparado pelo `npm run android`).

## Build e release

Toda tag no formato `vX.Y.Z` publicada no repositório dispara o workflow [`.github/workflows/build-release.yml`](.github/workflows/build-release.yml), que gera o APK e o anexa a uma [Release](../../releases) do GitHub. A página em [`docs/`](docs/index.html), publicada via GitHub Pages, sempre aponta para o APK da última release.

Para lançar uma nova versão:

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

## Licença

MIT — veja [LICENSE](LICENSE).
