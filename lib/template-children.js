/**
 * template-children.js
 *
 * Caveats:
 *
 * 1. Child order maintenance.
 *  Suppose we have the following template:
 *
 *  <template name="fooTextTemplate">
 *    <!-- Needs a span so we can actually switch the DOM nodes easier -->
 *    <span>
 *    foo
 *  </template>
 *
 *  And then this template is used in another template:
 *
 *  <template name="barTemplate">
 *    {{> fooTextTemplate}}
 *    {{> fooTextTemplate}}
 *  </template>
 *
 *  Moving only the span of fooTextTemplate inside barTemplate will not change the ordering of the children since
 *  the html comment element was not moved, only the span. Therefore, if you are going to move things around, move
 *  them all.
 *
 *  I don't think there is a simple solution to this, (unless you will move all of them by observing
 *  mutation, which would cause undesired effects).
 */

/**
 * @returns {Array|*} Array of templates that are child of the current template. They have the same ordering in DOM.
 */
Blaze.TemplateInstance.prototype.children = function() { return this._children; };

/**
 * @returns {Array|*} Array of templates that are child of the current template. They have the same ordering in DOM. Reactive.
 */
Blaze.TemplateInstance.prototype.getChildren = function() { return this._childrenReactive.get(); };

/**
 * @param reorderCallback A callback to be called when child is reordered.
 */
Blaze.TemplateInstance.prototype.onReorder = function(reorderCallback) { this._reorderCallbacks.push(reorderCallback); };

Template.onCreated(function () {
    this._children = [];
    this._childrenReactive = new ReactiveVar([]);
    this._mutationSummary = null;
    this._reorderCallbacks = [];
});

Template.onRendered(function () {
    let parent = this.parent(1, true);

    if (!!parent && !!parent._children) {  // For some reason, onRendered is called without onCreated, hence this check.
        // See if this template already exist as parent's children.
        let alreadyExist = parent._children.find((child) => { child === this; });

        // If it doesn't exist, add it as parent's child.
        if (!alreadyExist) {
            let newChildren = parent._children;
            newChildren.push(this);
            parent._setChildren(newChildren);
        }

        // Reorder children just in case the new child is in the middle of existing children in DOM.
        parent._reorderChildren();
    }

    // onRendered is not called when Templates's DOM representation is being changed, thus we must monitor
    // them ourselves.
    this._startMutationSummary();
});

Template.onDestroyed(function () {
    this._endMutationSummary();

    let parent = this.parent(1, true);
    if (!!parent && !!parent._children) {
        let parentChildren = parent._children;
        parentChildren.splice(parentChildren.indexOf(this), 1);
        parent._setChildren(parentChildren);
    }
});

/**
 * Reorders the children array so that they match their order in DOM. Call this when reorder mutation is observed.
 *
 * @param {Blaze.Template} template
 */
Blaze.TemplateInstance.prototype._reorderChildren = function () {
    try {
        var parentRange = this._createRange();
    } catch (e) {
        return;
    }

    let parentChildrenCopy = this._children;  // We will manipulate this, and don't want to modify original.
    let parentSortedChildren = [];
    let childNodes = parentRange.getNodes([Node.ELEMENT_NODE, Node.TEXT_NODE]);
    for (let childNode of childNodes) {
        if (parentChildrenCopy.length === 0) break;
        for (let childTemplate of parentChildrenCopy) {
            try {
                var childRange = childTemplate._createRange();
            } catch (e) {
                return;
            }

            if (childRange.containsNode(childNode)) {
                parentSortedChildren.push(childTemplate);
                parentChildrenCopy.splice(parentChildrenCopy.indexOf(childTemplate), 1);
                break;
            }
        }
    }

    this._setChildren(parentSortedChildren);
};

/**
 * Starts the Template mutation summary. Create's one if it doesn't exist.
 * @private
 */
Blaze.TemplateInstance.prototype._startMutationSummary = function() {
    // Find the nearest parent that include both first and last node of this template.
    let commonParent = $(this.firstNode).parents().has(this.lastNode).first().get(0);
    if (!this._mutationSummary) {
        this._mutationSummary = new MutationSummary({
            callback: (response) => {
                try {
                    var range = this._createRange();
                } catch(e) {
                    return;
                }

                let reordered = response[0].reordered;
                let childReordered = (!!reordered && reordered.length) ? _.find(reordered, (node) => range.containsNode(node)) : false;

                // Only reordered if child got reordered.
                if (childReordered) {
                    this._reorderChildren();
                    this._reorderCallbacks.forEach((callback) => callback());  // Call all reorder callbacks.
                }
            },
            rootNode: commonParent,
            observeOwnChanges: true,
            queries: [
                { characterData: true },
                { element: '*' }
            ]
        });
    }
};

/**
 * Stops and destroys the MutationSummary if it exist.
 * @private
 */
Blaze.TemplateInstance.prototype._endMutationSummary = function() {
    if (!!this._mutationSummary) {
        this._mutationSummary.disconnect();
        delete this._mutationSummary;
    }
};

/**
 * @param {Blaze.Template} template
 * @returns {Range|TextRange}
 * @throws Exception when error occurs.
 */
Blaze.TemplateInstance.prototype._createRange = function() {
    let range = rangy.createRange();

    range.setStart(this.firstNode);
    range.setEndAfter(this.lastNode);

    return range;
};

/**
 * Called to set the children of this template. Use this method so that reactive and non-reactive update is consistent.
 *
 * @param children
 * @private
 */
Blaze.TemplateInstance.prototype._setChildren = function(children) {
    this._children = children;
    this._childrenReactive.set(children);
};