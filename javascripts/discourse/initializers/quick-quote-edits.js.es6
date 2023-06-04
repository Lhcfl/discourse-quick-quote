import { withPluginApi } from "discourse/lib/plugin-api";
import Composer from "discourse/models/composer";
import { buildQuote } from "discourse/lib/quote";

const PLUGIN_ID = "discourse-quick-quote";

export default {
  name: "quick-quote-edits",
  initialize(container) {
    withPluginApi("0.8.12", (api) => {
      api.modifyClass("controller:topic", {
        pluginId: PLUGIN_ID,
        actions: {
          // Post related methods
          async replyToPost(post) {
            if (this.currentUser && this.siteSettings.enable_user_tips) {
              this.currentUser.hideUserTipForever("post_menu");
            }

            const composerController = this.composer;
            const topic = post ? post.get("topic") : this.model;
            const quoteState = this.quoteState;
            const postStream = this.get("model.postStream");

            this.appEvents.trigger("page:compose-reply", topic);

            if (
              !postStream ||
              !topic ||
              !topic.get("details.can_create_post")
            ) {
              return;
            }

            var quotedText = "";

            if (quoteState.buffer == "" || quoteState.buffer == undefined) {
              if (post) {
                if (
                  topic.highest_post_number + 1 - post.post_number >
                  settings.quick_quote_post_location_threshold
                ) {
                  if (settings.quick_quote_use_raw_post) {
                    quotedText = '\n' + await $.ajax(`/posts/${post.id}/raw`);
                    if (settings.quick_quote_remove_prior_quotes) {
                      quotedText = quotedText.replace(
                        /<aside[\s\S]*<\/aside>/g,
                        ""
                      );
                      quotedText = quotedText.replace(
                        /<blockquote[\s\S]*<\/blockquote>/g,
                        ""
                      );
                      quotedText = quotedText.replace(
                        /\n>[^\n]*/g,
                        ""
                      );
                      quotedText = quotedText.replace(
                        /\[quote[\s\S]*?\[\/quote\]/g,
                        ""
                      );
                    }
                    if (settings.quick_quote_character_limit) {
                      if (
                        quotedText.length > settings.quick_quote_character_limit
                      ) {
                        quotedText = quotedText.replace(/<[^>]*>/g, ""); // remove HTML tags
                      }
                      if (
                        quotedText.length > settings.quick_quote_character_limit
                      ) {
                        quotedText = quotedText.replaceAll(/\[[^\]]+?\][^\(][\s\S]+?\[\/[a-z]*\]/g, " "); // remove bbcode tags
                        quotedText = quotedText.replaceAll(/```\[[\s\S]*```/g, " "); //remove codeblock
                      }
                      if (
                        quotedText.length > settings.quick_quote_character_limit
                      ) {
                        quotedText = quotedText.replaceAll(/\!\[[\s\S][^\]]*?\]\([\s\S]*?\)/g, " "); // remove images
                      }
                      if (
                        quotedText.length > settings.quick_quote_character_limit
                      ) {
                        quotedText = quotedText.replaceAll("[", "");
                        quotedText = quotedText.replaceAll(/\]\([^\)]*?\)/g, " "); // remove links
                      }
                      if (
                        quotedText.length > settings.quick_quote_character_limit
                      ) {
                        quotedText = quotedText.replaceAll("**", " "); // remove Bold
                        quotedText = quotedText.replaceAll("__", " "); // remove Italic
                        quotedText = quotedText.substring(0, settings.quick_quote_character_limit) + "...";
                      }
                    }
                    quotedText = quotedText.trim();
                    if (
                      quotedText.length > 2 * settings.quick_quote_character_limit
                    ) {
                      quotedText = '';
                    }
                    if (quotedText !== "") {
                      quotedText = buildQuote(post, quotedText);
                    } else {
                      quotedText = post.cooked;
                      quotedText = quotedText.replace(
                        /<aside[\s\S]*<\/aside>/g,
                        ""
                      );
                      quotedText = quotedText.replace(/<[^>]*>/g, ""); // remove HTML tags
                      quotedText = quotedText.substring(0, settings.quick_quote_character_limit) + "...";
                      quotedText = quotedText.trim();
           
                      quotedText = buildQuote(post, quotedText);
                    }
                    
                  } else {
                    quotedText = buildQuote(post, post.cooked);
  
                    if (settings.quick_quote_remove_prior_quotes) {
                      quotedText = quotedText.replace(
                        /<aside[\s\S]*<\/aside>/g,
                        ""
                      );
                    }
                    if (settings.quick_quote_remove_links) {
                      quotedText = quotedText.replace(/<a[\s\S]*<\/a>/g, "");
                    }
                    const startOfQuoteText = quotedText.indexOf("]") + 2; // not forgetting the new line char
                    const lengthOfEndQuoteTag = 11; // [/quote] and newline preceeding
                    var startOfExcerpt = startOfQuoteText;
                    var excerpt = "";
                    if (settings.quick_quote_remove_contiguous_new_lines) {
                      excerpt = quotedText.substring(
                        startOfExcerpt,
                        quotedText.length - lengthOfEndQuoteTag
                      );
                      excerpt = excerpt.replace(/\n*\n/g, "");
                      quotedText =
                        quotedText.substring(0, startOfQuoteText) +
                        excerpt +
                        quotedText.substring(
                          quotedText.length - lengthOfEndQuoteTag,
                          quotedText.length
                        );
                    }
                    if (settings.quick_quote_character_limit) {
                      if (
                        quotedText.length > 2 * settings.quick_quote_character_limit
                      ) {
                        quotedText = '';
                      }
                      if (
                        quotedText.length > settings.quick_quote_character_limit
                      ) {
                        quotedText = quotedText.replace(/<[^>]*>/g, ""); // remove tags because you are splitting text so can't guarantee where
                        startOfExcerpt =
                          quotedText.length -
                            lengthOfEndQuoteTag -
                            settings.quick_quote_character_limit <
                          startOfQuoteText
                            ? startOfQuoteText
                            : quotedText.length -
                              settings.quick_quote_character_limit -
                              lengthOfEndQuoteTag -
                              2;
                        quotedText =
                          quotedText.substring(0, startOfQuoteText) +
                          "..." +
                          quotedText.substring(startOfExcerpt, quotedText.length);
                      }
                    }
                  }
                }
              }
            } else {
              const quotedPost = postStream.findLoadedPost(quoteState.postId);
              quotedText = buildQuote(
                quotedPost,
                quoteState.buffer,
                quoteState.opts
              );
            }

            quoteState.clear();

            if (
              composerController.get("model.topic.id") === topic.get("id") &&
              composerController.get("model.action") === Composer.REPLY
            ) {
              composerController.set("model.post", post);
              composerController.set("model.composeState", Composer.OPEN);
              this.appEvents.trigger(
                "composer:insert-block",
                quotedText.trim()
              );
            } else {
              const opts = {
                action: Composer.REPLY,
                draftKey: topic.get("draft_key"),
                draftSequence: topic.get("draft_sequence"),
              };

              if (quotedText) {
                opts.quote = quotedText;
              }

              if (post && post.get("post_number") !== 1) {
                opts.post = post;
              } else {
                opts.topic = topic;
              }

              composerController.open(opts);
            }
            return false;
          },
        },
      });
    });
  },
};
