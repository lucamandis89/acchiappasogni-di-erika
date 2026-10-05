module.exports=[{
  files:['js/**/*.js','scripts/**/*.cjs','tests/**/*.cjs'],
  languageOptions:{ecmaVersion:2022,sourceType:'script',globals:{__dirname:'readonly',module:'readonly',require:'readonly',console:'readonly',globalThis:'readonly',window:'readonly',document:'readonly',localStorage:'readonly',fetch:'readonly',Blob:'readonly',URL:'readonly',setTimeout:'readonly',crypto:'readonly',confirm:'readonly',ConfiguratorEngine:'readonly',ConfiguratorStore:'readonly'}},
  rules:{'no-undef':'error','no-dupe-keys':'error','no-unreachable':'error','valid-typeof':'error','no-constant-condition':'error','no-unused-vars':['error',{args:'none',caughtErrors:'none'}]}
}];
