module.exports = {
  "root": true,
  "parser": "babel-eslint",
  "extends": "eslint:recommended",
  "env": {
    "browser": true,
    "node": true,
    "es6": true
  },
  "parserOptions": {
    "sourceType": "module",
    "ecmaVersion": 10
  },
  "rules": {
    "semi": ["error", "never"],
    "quotes": ["error", "single"]
  }
}
