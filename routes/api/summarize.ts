import { aiManager } from "../../lib/ai/ai-manager.ts";
import { AIMessage } from "../../lib/ai/types.ts";
import { getExtendedSessionFromRequest } from "../../utils/session.ts";
import {
  getThreadByUuid,
  Thread,
  updateThreadByUuid,
} from "../../db/database.ts";

interface Message {
  type: string;
  content: string;
  timestamp: string;
  summary?: string | null;
}

interface SummarizedMessage {
  type: string;
  summary: string;
  timestamp: string;
}

export const handler = {
  async POST(req: Request, _ctx: any) {
    // Validate session for all requests
    const extendedSession = await getExtendedSessionFromRequest(req);
    if (!extendedSession) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      const { threadUuid } = await req.json();

      if (!threadUuid) {
        return new Response(
          JSON.stringify({ error: "Thread UUID is required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Get the thread from database
      const thread = getThreadByUuid(threadUuid);
      if (!thread) {
        return new Response(
          JSON.stringify({ error: "Thread not found" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Check if user has access to this thread
      if (thread.user_id !== extendedSession.userId && !thread.public) {
        return new Response(
          JSON.stringify({ error: "Access denied" }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Parse messages from thread
      let allMessages: Message[];
      try {
        allMessages = JSON.parse(thread.messages);
      } catch (error) {
        return new Response(
          JSON.stringify({ error: "Invalid thread messages format" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (!Array.isArray(allMessages) || allMessages.length === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "No messages to summarize",
            thread: thread,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Create the prompt for Gemini
      const prompt =
        `You're a helpful writer who follows my instructions completely and can easily spot the highlights in a given text and summarise them in a few words without losing too many details. You can also write beautiful text with concise and easy-to-understand wording.

Given a JSON array in the following format:
\`\`\`json
[ { "type": "user_OR_OTHERS", "content": "MESSAGE_BODY", "timestamp": "ISO-8601-DATETIME-STRING", "summary": "NULLABLE-FIELD" } ]
\`\`\`


You should return a new JSON array that follows the following format:

\`\`\`json
[{"summary": "SUMMARY-IN-200CHARS-OR-ORIGINAL-CONTENT-IN-200CHARS", "timestamp": "ORIGINAL-ISO8601-DATETIME-STRING", "type": "ORIGINAL-TYPE" }]
\`\`\`

YOU NEED TO STRICTLY FOLLOW THE INSTRUCTIONS BELOW:

Going through each element of the given array:
Summarise current element's "content" field in the language "content" was written in,
with the important information of the content and its context in mind,
make it more than 80 characters but within 200 characters, maps the generated summary to the "summary" field.

ENSURE the returned JSON is valid and follows the given format.

DO NOT summarise  the \`"content"\` IF it's already within 200 characters.

Here's the array to process:
\`\`\`json
${
          JSON.stringify(allMessages.filter((message: Message) =>
            message.content.length > 200 && !message.summary
          ))
        }
\`\`\``;

      // Prepare messages for AI
      const aiMessages: AIMessage[] = [
        {
          role: "user",
          content: prompt,
        },
      ];

      // Check if Google provider is available
      if (!aiManager.isProviderAvailable("google")) {
        return new Response(
          JSON.stringify({
            error: "Google AI provider is not available or not configured",
            availableProviders: aiManager.getAvailableProviders(),
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Send request to Gemini
      const aiResponse = await aiManager.chat(
        aiMessages,
        "google",
        {
          model: "gemini-2.5-flash-lite-preview-06-17",
        },
      );

      if (!aiResponse.content) {
        return new Response(
          JSON.stringify({ error: "No response from AI model" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Parse the AI response
      let summaries: SummarizedMessage[];
      try {
        // Extract JSON from the response (in case it's wrapped in markdown)
        const jsonMatch = aiResponse.content.match(/\[[\s\S]*\]/);
        const jsonString = jsonMatch ? jsonMatch[0] : aiResponse.content;
        summaries = JSON.parse(jsonString);
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: "Failed to parse AI response",
            aiResponse: aiResponse.content,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (!Array.isArray(summaries)) {
        return new Response(
          JSON.stringify({
            error: "AI response is not an array",
            aiResponse: aiResponse.content,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Create a map for quick lookup of summaries by timestamp
      const summaryMap = new Map<string, string>();
      summaries.forEach((summary) => {
        const { summary: summaryText, type, timestamp } = summary;
        if (type && timestamp && summaryText) {
          summaryMap.set(`${type}-${timestamp}`, summaryText);
        }
      });

      // Merge summaries back to original messages
      const updatedMessages = allMessages.map((message) => {
        const summary =
          summaryMap.get(`${message.type}-${message.timestamp}`) || null;
        if (summary) {
          return {
            ...message,
            summary,
          };
        }
        return Object.assign({summary: message.content}, {
          ...message,
        });
      });

      // Update the thread in database
      updateThreadByUuid(threadUuid, {
        messages: JSON.stringify(updatedMessages),
      });

      // Get the updated thread
      const updatedThread = getThreadByUuid(threadUuid);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Messages summarized successfully",
          summariesGenerated: summaries.length,
          thread: updatedThread,
          usage: aiResponse.usage,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Summarize API error:", error);

      return new Response(
        JSON.stringify({
          error: (error instanceof Error ? error.message : String(error)) ||
            "An error occurred while processing the summarization request",
          success: false,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
