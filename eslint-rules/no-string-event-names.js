/**
 * ESLint rule: no-string-event-names
 * 
 * Prevents calling track() with a string event name instead of an EventDefinition object.
 * 
 * ❌ Bad:
 *   track("page_viewed", { ... })
 * 
 * ✅ Good:
 *   track(eventRegistry["web.page_viewed@1"], { ... })
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce using EventDefinition objects instead of string event names in track() calls",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      noStringEventName: "Do not use string event names. Use EventDefinition from eventRegistry instead.",
    },
    schema: [],
  },

  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "track" &&
          node.arguments.length > 0
        ) {
          const firstArg = node.arguments[0];

          if (firstArg.type === "Literal" && typeof firstArg.value === "string") {
            context.report({
              node: firstArg,
              messageId: "noStringEventName",
            });
          }
        }
      },
    };
  },
};
