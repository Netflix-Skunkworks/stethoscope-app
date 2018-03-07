# Creating Builds

You can create builds for all platforms by running:

```
yarn run build
```

**Note**: This will not work on Windows machines, you will need to manually delete the `dist/` directory and run:

```bash
./node_modules/.bin/react-scripts build && ./node_modules/.bin/electron-builder
```

The build process copies assets from the `public/` directory into `build/` via `react-scripts`, `electron` picks up assets from the `build/` directory to bundle into native applications.

## Signing Builds (Mac)

