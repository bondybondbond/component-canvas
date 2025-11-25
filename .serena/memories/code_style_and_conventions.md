# Code Style and Conventions

## Linting
*   ESLint is configured to enforce code style and identify potential issues.
*   It extends recommended configurations for:
    *   Standard JavaScript (`@eslint/js`)
    *   TypeScript (`typescript-eslint`)
    *   React Hooks (`eslint-plugin-react-hooks`)
    *   Vite's React refresh mechanism (`eslint-plugin-react-refresh`)
*   **Specific Rule:** Unused variables are allowed if their names start with an underscore (`_`). This is configured by:
    ```javascript
    '@typescript-eslint/no-unused-vars': [
      'error',
      { 'argsIgnorePattern': '^_' },
    ],
    ```

## TypeScript Configuration
*   **Strict Type Checking:** The `tsconfig.app.json` file sets `"strict": true`, indicating that strict type-checking options are enabled. This promotes higher code quality and fewer runtime errors.
*   **No Fallthrough Cases in Switch:** `"noFallthroughCasesInSwitch": true` is enabled, preventing unintended fallthroughs in `switch` statements, which can be a source of bugs.
*   **JSX:** `jsx` is set to `"react-jsx"`, which is the standard for React projects.

## Naming Conventions
*   Not explicitly defined beyond what ESLint and TypeScript configurations imply. Following standard React/TypeScript naming conventions (e.g., PascalCase for components, camelCase for variables/functions) is expected.

## General Structure
*   Code is organized within the `src/` directory.
*   Related assets are in `src/assets/`.
*   Entry points are `main.tsx` and `App.tsx`.
