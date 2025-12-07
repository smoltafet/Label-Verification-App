import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Required for client-side usage
});

const ASSISTANT_ID = process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID!;

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

/**
 * Create a new thread for conversation
 */
export async function createThread(): Promise<string> {
  try {
    const thread = await openai.beta.threads.create();
    return thread.id;
  } catch (error) {
    console.error('Error creating thread:', error);
    throw new Error('Failed to create conversation thread');
  }
}

/**
 * Send a message to the assistant and get response
 */
export async function sendMessage(
  threadId: string,
  message: string
): Promise<Message> {
  try {
    // Add user message to thread
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message,
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID,
    });

    // Poll for completion
    let runStatus = await openai.beta.threads.runs.retrieve(run.id, {
      thread_id: threadId,
    });
    
    // Wait for completion with timeout
    const maxAttempts = 60; // 60 seconds max
    let attempts = 0;
    
    while (runStatus.status !== 'completed' && attempts < maxAttempts) {
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
        throw new Error(`Run ${runStatus.status}: ${runStatus.last_error?.message || 'Unknown error'}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(run.id, {
        thread_id: threadId,
      });
      attempts++;
    }

    if (runStatus.status !== 'completed') {
      throw new Error('Assistant response timeout');
    }

    // Get the assistant's response
    const messages = await openai.beta.threads.messages.list(threadId, {
      limit: 1,
      order: 'desc',
    });

    const assistantMessage = messages.data[0];
    
    if (!assistantMessage || assistantMessage.role !== 'assistant') {
      throw new Error('No assistant response found');
    }

    // Extract text content
    const textContent = assistantMessage.content.find((content) => content.type === 'text');
    const responseText = textContent && 'text' in textContent ? textContent.text.value : 'No response';

    return {
      id: assistantMessage.id,
      role: 'assistant',
      content: responseText,
      createdAt: assistantMessage.created_at,
    };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Get all messages from a thread
 */
export async function getThreadMessages(threadId: string): Promise<Message[]> {
  try {
    const messages = await openai.beta.threads.messages.list(threadId, {
      order: 'asc',
      limit: 100,
    });

    return messages.data.map((msg) => {
      const textContent = msg.content.find((content) => content.type === 'text');
      const content = textContent && 'text' in textContent ? textContent.text.value : '';

      return {
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content,
        createdAt: msg.created_at,
      };
    });
  } catch (error) {
    console.error('Error getting thread messages:', error);
    throw new Error('Failed to retrieve conversation history');
  }
}

/**
 * Delete a thread (cleanup)
 */
export async function deleteThread(threadId: string): Promise<void> {
  try {
    await openai.beta.threads.delete(threadId);
  } catch (error) {
    console.error('Error deleting thread:', error);
    // Don't throw - cleanup is best effort
  }
}
