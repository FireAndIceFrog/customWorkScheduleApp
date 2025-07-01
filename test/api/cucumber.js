module.exports =  {
  default: {
    require: ['ts-node/register', "src/steps/**/*.ts"],
    features: ['src/features/**/*.feature'],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    paths: ['src/features/'],
    requireModule: ['ts-node/register'],
    format: ['progress-bar', 'html:cucumber-report.html'],
    publishQuiet: true
  }
};