# What to do When a Task is Completed

When a development task is completed, follow these steps for verification and quality assurance:

1.  **Run Linting:**
    *   Execute `npm run lint` to ensure all code adheres to the defined style guidelines and there are no linting errors.
2.  **Build the Project:**
    *   Run `npm run build` to ensure the project compiles successfully and no new build errors are introduced. This also verifies TypeScript type checks.
3.  **Local Preview (if applicable):**
    *   If the changes involve UI or user-facing features, use `npm run preview` to locally test the production build for functionality and appearance.
4.  **Testing (if tests are implemented):**
    *   Currently, there are no explicit testing scripts defined in `package.json`. If tests are added in the future, run the appropriate test command to ensure all existing and new tests pass. (e.g., `npm test` or `npm run test`).
5.  **Code Review:**
    *   Ensure the code is reviewed by another team member (if applicable) before merging.