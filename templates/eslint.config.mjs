export default [
  {
    files: ["**/*.js"],
    ignores: ["vendor/**", "node_modules/**"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script"
    },
    rules: {
      "no-undef": "error",
      "no-unreachable": "error"
    }
  }
];
