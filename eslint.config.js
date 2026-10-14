//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config";

export default [
	...tanstackConfig,
	{
		rules: {
			"pnpm/json-enforce-catalog": "off",

			"import/no-cycle": "off",
			"sort-imports": "off",
			"import/order": "off",
			"import/no-dynamic-require": "warn",
			"import/consistent-type-specifier-style": ["error", "prefer-inline"],
			"import/first": "error",
			"import/newline-after-import": "error",
			"import/no-commonjs": "error",
			"import/no-duplicates": "error",

			"@typescript-eslint/consistent-type-definitions": "off",
			"@typescript-eslint/explicit-function-return-type": "off",
			"@typescript-eslint/switch-exhaustiveness-check": "error",
			"@typescript-eslint/require-await": "error",
			"@typescript-eslint/array-type": ["error", { default: "generic", readonly: "generic" }],
			"@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
			"@typescript-eslint/explicit-member-accessibility": ["error", { accessibility: "explicit" }],
			"@typescript-eslint/no-empty-object-type": ["error", { allowInterfaces: "with-single-extends" }],
			"@typescript-eslint/strict-boolean-expressions": [
				"error",
				{
					allowString: true,
					allowNullableObject: true,
					allowNullableBoolean: true,
					allowNullableString: true,
					allowAny: true,
					allowNumber: false,
					allowNullableNumber: false,
				},
			],
		},
	},
	{
		ignores: ["eslint.config.js", "prettier.config.js"],
	},
];
