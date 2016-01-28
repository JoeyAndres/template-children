# jandres:template-children (Deprecated).
Meteor package that adds the ability to keep track of underlying templates, including ordering.
_This will be mereged to jandres:template-extension-extended package._

# Install:

meteor add jandres:template-children

# How to use:

In your template:

```js
Template.instance().children();  // Non-reactive. Returns an array of Template instances that are a direct children.
Template.instance().getChildren();  // Reactive. Returns an array of Template instances that are  a direct children.
```

# Caveat(s):

Suppose we have the following template:

```html
<template name="fooTextTemplate">
  <!-- Needs a span so we can actually switch the DOM nodes easier -->
  <span>
  foo
</template>
```

And then this template is used in another template:

```html
<template name="barTemplate">
  {{> fooTextTemplate}}
  {{> fooTextTemplate}}
</template>
```

Moving only the span of fooTextTemplate inside barTemplate will not change the ordering of the children since
the html comment element was not moved, only the span. Therefore, if you are going to move things around, move
them all.

I don't think there is a simple solution to this, (unless you will move all of them by observing
mutation, which would cause undesired effects).

# Bugs and Suggestions:

If there are bugs, use the github [issue tracker](https://github.com/JoeyAndres/template-children/issues), I will
personally try and see what is up.

# TODO:
1. ~~`children` or `getChildren` methods accepts an integer **x** and will return all children in **x** tiers, in a dfs
   order.~~
2. ~~Improve performance in MutationObserver by not doing anything if non of the things that got reordered are direct
   children. This is because, there exist no grand children DOM element that is the top level DOM element of a child
   template.~~
3. In 0.0.5 performance improvements were made by having just one mutation observer delegating task to each template
   instances.
   
   Possible ways to even make this faster:
   - Only enable (for a template) when children()/getChildren() is called.
   - Have some hash concerning first level elements to template. This will massively improve performance. By only
     considering first level, we avoid executing changes from top level template to the template where the dom element
     that changed is in first leve.