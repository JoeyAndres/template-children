Package.describe({
  name: "jandres:template-children",
  summary: "Meteor package that adds the ability to keep track of underlying templates, including ordering.",
  version: "0.0.5",
  git: "https://github.com/JoeyAndres/template-children.git"
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.2');
  api.use([
    'ecmascript',
    'templating',
    'blaze',
    'jquery',
    'underscore',
    'tracker',
    'timdown:rangy@1.2.3',
    'aldeed:template-extension@4.0.0',
    'jandres:mutation-summary@0.0.1',
    'reactive-var'
  ], 'client');

  api.addFiles([
    'lib/template-children.js'
  ], 'client');
});

Package.onTest(function(api) {
  api.use([
    'aldeed:template-extension@4.0.0',
    'jandres:template-children',
    'jquery',
    'templating',
    'tinytest',
    'tracker',
    'ejson',
    'underscore',
    'timdown:rangy@1.2.3',
    'jandres:mutation-summary@0.0.1',
    'reactive-var'
  ], 'client');

  api.use('sanjo:jasmine@0.20.3');

  api.addFiles([
    'tests.html',
    'tests.js'
  ], 'client');
});
