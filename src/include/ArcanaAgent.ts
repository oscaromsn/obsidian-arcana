import { OpenAI } from 'langchain';
//import { HNSWLib, HNSWLibArgs } from "langchain/vectorstores/hnswlib";
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import {
  TFolder,
  TFile,
  normalizePath,
  FileSystemAdapter,
  TAbstractFile,
} from 'obsidian';

import VectorStore from './VectorStore';
import NoteIDer from './NoteIDer';
import ArcanaPlugin from 'src/main';
/*
  TODO: Rename File to Arcanagent
  - Each file needs to have an id
  - Each id is associated with a vector

  - Upon certain events, vectors are added and removed from the store

*/
export default class ArcanaAgent {
  private arcana: ArcanaPlugin;
  private openAI: OpenAI;

  private vectorStore: VectorStore;
  private noteIDer: NoteIDer;

  constructor(arcana: ArcanaPlugin) {
    this.arcana = arcana;

    this.openAI = new OpenAI({ openAIApiKey: this.arcana.getAPIKey() });
    this.noteIDer = new NoteIDer(arcana);

    this.vectorStore = new VectorStore(arcana);

    // Setup file system callbacks
    app.vault.on('create', async (file: TAbstractFile) => {});
    app.vault.on('delete', async (file: TAbstractFile) => {});
    app.vault.on('rename', async (file: TAbstractFile, oldPath: string) => {});
  }

  async save() {
    await this.vectorStore.saveStore();
  }

  public async requestNewEmbedding(file: TFile) {
    // Get the embedding for the file
    const text = await this.arcana.app.vault.read(file);
    const id = await this.noteIDer.getNoteID(file);
    const isDifferent = await this.vectorStore.hasChanged(id, text);
    if (isDifferent) {
      console.log(file.path + ' has changed - fetching new embedding');
      // Get the embedding
      const embedding = new OpenAIEmbeddings({
        openAIApiKey: this.arcana.getAPIKey(),
      });
      const res = (await embedding.embedDocuments([text]))[0];

      // Save the embedding
      await this.vectorStore.setVector(id, res, text);
    }
  }

  public async getKClosestDocuments(text: string, k: number): Promise<TFile[]> {
    // Get embedding
    const embedding = new OpenAIEmbeddings({
      openAIApiKey: this.arcana.getAPIKey(),
    });
    const res = (await embedding.embedDocuments([text]))[0];
    // Get closest documents
    const closestIds = await this.vectorStore.searchForClosestVectors(res, k);
    // Get the files
    const closestFiles = closestIds.map(async id => {
      return await this.noteIDer.getDocumentWithID(id);
    });

    return (await Promise.all(closestFiles)).filter(
      file => file != null
    ) as TFile[];
  }
}
