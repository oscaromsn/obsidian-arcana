import { ConversationChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
  MessagesPlaceholder,
} from 'langchain/prompts';
import { BufferMemory } from 'langchain/memory';

export default class Conversation {
  private model: ChatOpenAI;
  private chain: ConversationChain;

  constructor(model: ChatOpenAI, conversationContext: string) {
    this.model = model;

    const chatPrompt = ChatPromptTemplate.fromPromptMessages([
      SystemMessagePromptTemplate.fromTemplate(conversationContext),
      new MessagesPlaceholder('history'),
      HumanMessagePromptTemplate.fromTemplate('{input}'),
    ]);

    this.chain = new ConversationChain({
      memory: new BufferMemory({ returnMessages: true, memoryKey: 'history' }),
      prompt: chatPrompt,
      llm: this.model,
    });
  }

  async askQuestion(question: string, handleToken: any): Promise<string> {
    let aborted = false;
    // When the esc key is pressed, abort the request
    const aborter = (e: any) => {
      if (e.key === 'Escape') {
        console.log('Abort');
        aborted = true;
      }
    };
    window.addEventListener('keydown', aborter);
    // Stream the tokens when calling

    const response = await this.chain.call(
      {
        input: question,
      },
      [
        {
          handleLLMNewToken(token: string) {
            if (!aborted) {
              handleToken(token);
            }
          },
        },
      ]
    );
    window.removeEventListener('keydown', aborter);

    console.log(response);
    return response.response;
  }
}
