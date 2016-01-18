var testingInstanceGet = false;
var testingInstanceParent = false;
var testingData = false;

// Setting this number to different value prior/after to rendering templateDynamicChild will set the number of child
// rendered in templateDynamicChild.
var dynamicChildCount = new ReactiveVar(5);

// Setting this array to different value prior/after to rendering templateManualChild will set the number of child
// rendered in templateDynamicChild with corresponding data context in the given array.
var manualChildren = new ReactiveVar([]);

Template.templateOneChild.hooks({
  rendered: function() {
    this._renderedTemplateOneChild = true;
  }
});

Template.templateTwoChild.hooks({
  rendered: function() {
    this._renderedTemplateTwoChild = true;
  }
});

Template.templateDynamicChild.hooks({
  rendered: function() {
    this._renderedTemplateDynamicChild = true;
  }
});

Template.templateDynamicChild.helpers({
  childs: function() {
    var childs = [];
    for (var i = 0; i < dynamicChildCount.get(); i++) {
      childs.push(i);
    }
    return childs;
  }
});

Template.templateManualChild.hooks({
  created: function() {
    this._createdTemplateManualChild = true;
  },
  rendered: function() {
    this._renderedTemplateManualChild = true;
  }
});

Template.templateManualChild.helpers({
  childs: function() {
    return manualChildren.get();
  }
});

Template.onCreated(function () {
  this._globalCreated = true;
});

Template.onRendered(function () {
  this._globalRendered = true;
});

Template.onDestroyed(function () {
  this._globalDestroyed = true;
});

Template.clearEventMaps.events({
  'click button': function () {
    return false;
  }
});

Tinytest.add('template-extension - children empty-children', function(test) {
  var emptyView = Blaze.render(Template.emptyTemplate, $('body')[0]);
  Tracker.flush();
  test.isTrue(emptyView._templateInstance._renderedEmptyTemplate);
  test.equal(emptyView._templateInstance.children(), []);
});

Tinytest.add('template-extension - children non-empty-children', function(test) {
  var singleChildView = Blaze.render(Template.templateOneChild, $('body')[0]);
  Tracker.flush();
  test.isTrue(singleChildView._templateInstance._renderedTemplateOneChild);
  test.equal(singleChildView._templateInstance.children().length, 1);

  var twoChildView = Blaze.render(Template.templateTwoChild, $('body')[0]);
  Tracker.flush();
  test.isTrue(twoChildView._templateInstance._renderedTemplateTwoChild);
  test.equal(twoChildView._templateInstance.children().length, 2);

  dynamicChildCount.set(10);
  var dynamicChildView = Blaze.render(Template.templateDynamicChild, $('body')[0]);
  Tracker.flush();
  test.isTrue(dynamicChildView._templateInstance._renderedTemplateDynamicChild);
  test.equal(dynamicChildView._templateInstance.children().length, 10);
  var children = dynamicChildView._templateInstance.children();
  var childrenTexts = children.map(function(child) { return child.data.text; });
  test.equal(childrenTexts, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

Tinytest.add('template-extension - children children destroy', function(test) {
  dynamicChildCount.set(10);
  var dynamicChildView = Blaze.render(Template.templateDynamicChild, $('body')[0]);
  Tracker.flush();
  test.isTrue(dynamicChildView._templateInstance._renderedTemplateDynamicChild);
  test.equal(dynamicChildView._templateInstance.children().length, 10);
  var children = dynamicChildView._templateInstance.children();
  var childrenTexts = children.map(function(child) { return child.data.text; });
  test.equal(childrenTexts, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

  dynamicChildCount.set(9);  // Decrease one child.
  Tracker.flush();
  test.isTrue(dynamicChildView._templateInstance._renderedTemplateDynamicChild);
  test.equal(dynamicChildView._templateInstance.children().length, 9);
  var children = dynamicChildView._templateInstance.children();
  var childrenTexts = children.map(function(child) { return child.data.text; });
  test.equal(childrenTexts, [0, 1, 2, 3, 4, 5, 6, 7, 8]);

  dynamicChildCount.set(4);  // Decrease more child.
  Tracker.flush();
  test.isTrue(dynamicChildView._templateInstance._renderedTemplateDynamicChild);
  test.equal(dynamicChildView._templateInstance.children().length, 4);
  var children = dynamicChildView._templateInstance.children();
  var childrenTexts = children.map(function(child) { return child.data.text; });
  test.equal(childrenTexts, [0, 1, 2, 3]);

  dynamicChildCount.set(0);  // No more child.
  Tracker.flush();
  test.isTrue(dynamicChildView._templateInstance._renderedTemplateDynamicChild);
  test.equal(dynamicChildView._templateInstance.children().length, 0);
  var children = dynamicChildView._templateInstance.children();
  var childrenTexts = children.map(function(child) { return child.data.text; });
  test.equal(childrenTexts, []);
});

// Note: this is not REORDERING, we just want to see that ordering is consistent with the data when data is changed.
//       Reordering occurs when a dom manipulation is actually done.
Tinytest.add('template-extension - children children-ordering', function(test) {
  // Establish 3 children.
  manualChildren.set([0, 1, 2]);
  var dynamicChildView = Blaze.render(Template.templateManualChild, $('body')[0]);
  Tracker.flush();
  test.isTrue(dynamicChildView._templateInstance._renderedTemplateManualChild);
  test.equal(dynamicChildView._templateInstance.children().length, 3);

  // Ensure that they are all in correct order.
  var children = dynamicChildView._templateInstance.children();
  var childrenTexts = children.map(function(child) { return child.data.text; });
  test.equal(childrenTexts, [0, 1, 2]);

  // Switch last two child.
  manualChildren.set([0, 2, 1]);
  var manualChildView = Blaze.render(Template.templateManualChild, $('body')[0]);
  Tracker.flush();
  test.isTrue(manualChildView._templateInstance._renderedTemplateManualChild);

  // Ensure that they are all in correct order.
  var children = manualChildView._templateInstance.children();
  var childrenTexts = children.map(function(child) { return child.data.text; });
  test.equal(childrenTexts, [0, 2, 1]);

  // Switch first two child.
  manualChildren.set([2, 0, 1]);
  var manualChildView = Blaze.render(Template.templateManualChild, $('body')[0]);
  Tracker.flush();
  test.isTrue(manualChildView._templateInstance._renderedTemplateManualChild);

  // Ensure that they are all in correct order.
  var children = manualChildView._templateInstance.children();
  var childrenTexts = children.map(function(child) { return child.data.text; });
  test.equal(childrenTexts, [2, 0, 1]);
});

function swapElements(elm1, elm2) {
  var parent1, next1,
      parent2, next2;

  parent1 = elm1.parentNode;
  next1   = elm1.nextSibling;
  parent2 = elm2.parentNode;
  next2   = elm2.nextSibling;

  parent1.insertBefore(elm2, next1);
  parent2.insertBefore(elm1, next2);
}

Tinytest.add('template-extension - children re-ordering', function(test) {
  // Establish 3 children.
  manualChildren.set([0, 1, 2]);
  var manualChildView = Blaze.render(Template.templateManualChild, $('body')[0]);
  Tracker.flush();
  test.isTrue(manualChildView._templateInstance._createdTemplateManualChild);
  Tracker.flush();
  test.isTrue(manualChildView._templateInstance._renderedTemplateManualChild);
  test.equal(manualChildView._templateInstance.children().length, 3);

  // Base case.
  // Ensure that they are all in correct order.
  var children = manualChildView._templateInstance.children();
  var childrenTexts = children.map(function(child) { return child.data.text; });
  test.equal(childrenTexts, [0, 1, 2]);

  // DOM manipulation.
  var template_wrapper = $('.template-manual-child').last().get(0);
  swapElements(template_wrapper.children[2], template_wrapper.children[1]);

  Tracker.flush();
  test.isTrue(manualChildView._templateInstance._renderedTemplateManualChild);
  var children = manualChildView._templateInstance.children();
  var childrenTexts = children.map(function(child) { return child.data.text });
  manualChildView._templateInstance.onReorder(function() {
    test.equal(childrenTexts, [0, 2, 1]);
  });
});