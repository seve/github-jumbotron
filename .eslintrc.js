module.exports = {
  env: {
    es6: true,
    node: true
  },
  extends: ["airbnb-base", "prettier"],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly"
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: "module"
  },
  plugins: ["@typescript-eslint"],
  rules: {
    "no-magic-numbers": "off",
    "no-nested-ternary": "off",
    "func-style": "off",
    "arrow-parens": "off",
    "no-use-before-define": "off",
    "react/jsx-filename-extension": "off",
    "comma-dangle": "off",
    "no-underscore-dangle": "off",
    quotes: ["error", "double"],
    "implicit-arrow-linebreak": "off",
    "operator-linebreak": [
      "error",
      "after",
      { overrides: { "?": "before", ":": "before" } }
    ],
    "no-console": "off",
    "spaced-comment": ["error", "always", { exceptions: ["*"] }],
    "no-param-reassign": "off",
    "object-curly-newline": ["error", { consistent: true }],
    "react/prop-types": [0],
    "space-before-function-paren": "off",
    "function-paren-newline": "off",
    "prefer-destructuring": ["error", { object: true, array: false }]
  }
};
